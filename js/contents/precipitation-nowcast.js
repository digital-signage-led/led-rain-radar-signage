import { fetchNowcast } from "../services/nowcast.js";
import { formatClock } from "../services/jma-common.js";
import { frameDate, tileUrl } from "../services/jma-tiles.js";
import { errorPanel, intensityLegend, playController, timesBlock } from "./shared-ui.js";

function minutesAhead(base, frame) {
  if (!base || !frame) return 0;
  return Math.round((frame.getTime() - base.getTime()) / 60000);
}

export async function renderPrecipitationNowcast(ctx) {
  const data = await fetchNowcast({
    prefecture: ctx.prefecture.slug,
    pointId: ctx.point?.id,
    horizonMinutes: ctx.contentSettings.horizonMinutes
  });
  const panel = ctx.els.panel;
  if (!data.ok) {
    panel.innerHTML = errorPanel(data.message);
    return data;
  }

  const nowDate = frameDate(data.frames[0]);
  const last = data.frames[data.frames.length - 1];
  panel.innerHTML = `
    <div class="panel-kicker">降水ナウキャスト</div>
    <div class="panel-area">対象：${ctx.prefecture.name} ${ctx.point ? `／ ${ctx.point.name}` : ""}</div>
    <p class="wx-hint">現在の降水と、これから約1時間先までの短時間予測です。</p>
    <div class="nowcast-compare">
      <div>
        <span>現在</span>
        <strong>${formatClock(nowDate)}</strong>
      </div>
      <div>
        <span>予測の先</span>
        <strong>${formatClock(frameDate(last))}</strong>
      </div>
    </div>
    <div class="now-clock">
      <span data-slot-label>現在の降水</span>
      <strong data-frame-clock>${formatClock(nowDate)}</strong>
    </div>
    <div class="future-slots nowcast-slots" data-slots></div>
    <div class="section-label">降水強度 mm/h</div>
    <div class="legend">${intensityLegend()}</div>
    ${timesBlock({
      dataUpdatedAt: data.dataUpdatedAt,
      displayUpdatedAt: data.fetchedAt,
      fromCache: data.fromCache
    })}
  `;

  const clock = panel.querySelector("[data-frame-clock]");
  const label = panel.querySelector("[data-slot-label]");
  const slots = panel.querySelector("[data-slots]");

  const player = playController({
    frames: data.frames,
    playMs: ctx.contentSettings.playMs || 2000,
    holdMs: 2600,
    onFrame(frame, index) {
      ctx.map?.setOverlay(tileUrl(frame));
      const date = frameDate(frame);
      const ahead = minutesAhead(nowDate, date);
      if (clock) clock.textContent = formatClock(date);
      if (label) label.textContent = ahead <= 0 ? "現在の降水" : `${ahead}分先の降水`;
      const slotIndexes = data.frames.map((_, i) => i).filter((i, _, all) => {
        if (i === 0 || i === all.length - 1) return true;
        const d = frameDate(data.frames[i]);
        return d && d.getMinutes() % 10 === 0;
      });
      const on = slotIndexes.reduce((best, i) => (
        Math.abs(i - index) < Math.abs(best - index) ? i : best
      ), slotIndexes[0]);
      slots.innerHTML = slotIndexes.map((i) => {
        const item = data.frames[i];
        const d = frameDate(item);
        const m = minutesAhead(nowDate, d);
        return `<button type="button" class="${i === on ? "is-on" : ""}" disabled>
          <em>${m <= 0 ? "現在" : `+${m}分`}</em>
          <strong>${formatClock(d)}</strong>
        </button>`;
      }).join("");
    }
  });
  ctx.addCleanup(() => player.stop());
  return data;
}
