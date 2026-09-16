import { fetchRadar } from "../services/radar.js";
import { formatClock, formatStamp } from "../services/jma-common.js";
import { frameDate, tileUrl } from "../services/jma-tiles.js";
import { errorPanel, intensityLegend, playController, timesBlock } from "./shared-ui.js";

export async function renderRainRadar(ctx) {
  const data = await fetchRadar({
    prefecture: ctx.prefecture.slug,
    pointId: ctx.point?.id,
    pastMinutes: ctx.contentSettings.pastMinutes
  });
  const panel = ctx.els.panel;
  if (!data.ok) {
    panel.innerHTML = errorPanel(data.message);
    return data;
  }

  const latest = data.frames[data.frames.length - 1];
  panel.innerHTML = `
    <div class="panel-kicker">雨雲レーダー</div>
    <div class="panel-area">${ctx.prefecture.name}の雨雲分布</div>
    <p class="wx-hint">過去1時間の雨雲の動きを、操作なしで確認できます。</p>
    <div class="now-clock">
      <span>表示時刻</span>
      <strong data-frame-clock>${formatClock(frameDate(latest))}</strong>
    </div>
    <div class="section-label">降水強度 mm/h</div>
    <div class="legend">${intensityLegend()}</div>
    <div class="timeline" data-timeline></div>
    ${timesBlock({
      dataUpdatedAt: data.dataUpdatedAt,
      displayUpdatedAt: data.fetchedAt,
      fromCache: data.fromCache
    })}
  `;

  const clock = panel.querySelector("[data-frame-clock]");
  const timeline = panel.querySelector("[data-timeline]");
  const player = playController({
    frames: data.frames,
    playMs: ctx.contentSettings.playMs || 1800,
    holdMs: 2600,
    onFrame(frame, index, total) {
      ctx.map?.setOverlay(tileUrl(frame));
      if (clock) clock.textContent = formatClock(frameDate(frame));
      if (timeline) {
        const pct = total <= 1 ? 100 : (index / (total - 1)) * 100;
        timeline.innerHTML = `<i style="width:${pct}%"></i><em>${index + 1}/${total}　${formatStamp(frameDate(frame))}</em>`;
      }
    }
  });
  ctx.addCleanup(() => player.stop());
  return data;
}
