import { fetchFutureRain } from "../services/future-rain.js";
import { formatClock } from "../services/jma-common.js";
import { frameDate, tileUrl } from "../services/jma-tiles.js";
import { errorPanel, intensityLegend, playController, timesBlock } from "./shared-ui.js";

function kindLabel(frame) {
  if (frame.kind === "now" || frame.product === "hrpns" && frame.kind !== "forecast") return "現在";
  if (frame.product === "hrpns") return "直近予測";
  return "今後の雨";
}

export async function renderFutureRain(ctx) {
  const data = await fetchFutureRain({
    prefecture: ctx.prefecture.slug,
    pointId: ctx.point?.id,
    futureMinutes: ctx.contentSettings.futureMinutes
  });
  const panel = ctx.els.panel;
  if (!data.ok) {
    panel.innerHTML = errorPanel(data.message);
    return data;
  }

  panel.innerHTML = `
    <div class="panel-kicker">今後の雨</div>
    <div class="panel-area">現在から最大3時間先</div>
    <p class="wx-hint">いまの雨雲から、これからどう変わるかを自動で送ります。</p>
    <div class="axis">
      <span>現在</span>
      <i></i>
      <span>今後</span>
    </div>
    <div class="now-clock">
      <span data-kind>現在</span>
      <strong data-frame-clock>${formatClock(frameDate(data.frames[0]))}</strong>
    </div>
    <div class="future-slots" data-slots></div>
    <div class="section-label">降水強度 mm/h</div>
    <div class="legend">${intensityLegend()}</div>
    ${timesBlock({
      dataUpdatedAt: data.dataUpdatedAt,
      displayUpdatedAt: data.fetchedAt,
      fromCache: data.fromCache
    })}
  `;

  const clock = panel.querySelector("[data-frame-clock]");
  const kindEl = panel.querySelector("[data-kind]");
  const slots = panel.querySelector("[data-slots]");
  const slotIndexes = data.frames.map((_, i) => i).filter((i, _, all) => {
    if (i === 0 || i === all.length - 1) return true;
    const date = frameDate(data.frames[i]);
    return date && date.getMinutes() % 30 === 0;
  });
  const nearestSlot = (active) => slotIndexes.reduce((best, i) => (
    Math.abs(i - active) < Math.abs(best - active) ? i : best
  ), slotIndexes[0]);
  const renderSlots = (active) => {
    const on = nearestSlot(active);
    slots.innerHTML = slotIndexes.map((i) => {
      const frame = data.frames[i];
      const date = frameDate(frame);
      return `<button type="button" class="${i === on ? "is-on" : ""}" disabled>
        <em>${kindLabel(frame)}</em>
        <strong>${formatClock(date)}</strong>
      </button>`;
    }).join("");
  };

  const player = playController({
    frames: data.frames,
    playMs: ctx.contentSettings.playMs || 2200,
    holdMs: 2800,
    onFrame(frame, index) {
      ctx.map?.setOverlay(tileUrl(frame));
      if (index === 0) ctx.map?.invalidate();
      if (clock) clock.textContent = formatClock(frameDate(frame));
      if (kindEl) kindEl.textContent = kindLabel(frame);
      renderSlots(index);
    }
  });
  ctx.addCleanup(() => player.stop());
  return data;
}
