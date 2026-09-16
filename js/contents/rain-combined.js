import { fetchFutureRain } from "../services/future-rain.js";
import { fetchRainForecast } from "../services/rain.js";
import { formatClock } from "../services/jma-common.js";
import { frameDate, tileUrl } from "../services/jma-tiles.js";
import { errorPanel, intensityLegend, playController, popCell, popTone, timesBlock } from "./shared-ui.js";

function popRow(pops) {
  return [
    ["朝", pops.morning],
    ["昼", pops.noon],
    ["夕", pops.evening],
    ["夜", pops.night]
  ].map(([label, value]) => (
    `<div class="pop-cell ${popTone(value)}"><span>${label}</span><strong>${popCell(value)}</strong></div>`
  )).join("");
}

function kindLabel(frame, nowDate) {
  const date = frameDate(frame);
  if (!date || !nowDate) return "雨雲";
  const min = Math.round((date.getTime() - nowDate.getTime()) / 60000);
  if (min <= 0) return "現在";
  if (frame.product === "rasrf" || min > 55) return `今後 +${min}分`;
  return `ナウキャスト +${min}分`;
}

export async function renderRainCombined(ctx) {
  const panel = ctx.els.panel;
  const [forecast, tiles] = await Promise.all([
    fetchRainForecast({ prefecture: ctx.prefecture.slug, pointId: ctx.point?.id }),
    fetchFutureRain({
      prefecture: ctx.prefecture.slug,
      pointId: ctx.point?.id,
      futureMinutes: ctx.contentSettings.futureMinutes ?? 180
    })
  ]);

  if (!forecast.ok && !tiles.ok) {
    panel.innerHTML = errorPanel(forecast.message || tiles.message);
    return forecast;
  }

  const temps = forecast.ok && ctx.contentSettings.showTemps !== false && (forecast.tempMin != null || forecast.tempMax != null)
    ? (forecast.tempMin != null && forecast.tempMax != null && forecast.tempMin !== forecast.tempMax
      ? `<div class="temps"><span>気温</span><strong>最低 ${forecast.tempMin}℃　最高 ${forecast.tempMax}℃</strong></div>`
      : `<div class="temps"><span>気温</span><strong>最高 ${forecast.tempMax ?? forecast.tempMin}℃</strong></div>`)
    : "";

  const nowDate = tiles.frames?.length ? frameDate(tiles.frames[0]) : null;
  const last = tiles.frames?.[tiles.frames.length - 1];

  panel.innerHTML = `
    <div class="panel-area">${forecast.areaName || ctx.prefecture.name}</div>
    ${forecast.ok ? `
      <div class="wx-row">
        <img class="wx-icon" src="${forecast.weatherIcon}" alt="" width="88" height="88">
        <div>
          <p class="wx-text">${forecast.weatherLabel}</p>
          <p class="wx-hint">${forecast.rainHint}</p>
        </div>
      </div>
      ${temps}
      <div class="section-label">今日の降水確率</div>
      <div class="pop-row">${popRow(forecast.todayPop)}</div>
    ` : errorPanel(forecast.message)}
    <div class="nowcast-compare">
      <div>
        <span>現在の降水</span>
        <strong data-now-clock>${formatClock(nowDate)}</strong>
      </div>
      <div>
        <span>今後の雨</span>
        <strong>${formatClock(frameDate(last))}</strong>
      </div>
    </div>
    <div class="axis"><span>現在</span><i></i><span>今後</span></div>
    <div class="now-clock">
      <span data-kind>雨雲レーダー</span>
      <strong data-frame-clock>${formatClock(nowDate)}</strong>
    </div>
    <div class="future-slots" data-slots></div>
    <div class="section-label">降水強度 mm/h</div>
    <div class="legend">${intensityLegend()}</div>
    ${timesBlock({
      dataUpdatedAt: tiles.dataUpdatedAt || forecast.reportAt,
      displayUpdatedAt: tiles.fetchedAt || forecast.fetchedAt,
      fromCache: tiles.fromCache || forecast.fromCache
    })}
  `;

  if (tiles.ok && tiles.frames?.length) {
    const clock = panel.querySelector("[data-frame-clock]");
    const kindEl = panel.querySelector("[data-kind]");
    const nowClock = panel.querySelector("[data-now-clock]");
    const slots = panel.querySelector("[data-slots]");
    const slotIndexes = tiles.frames.map((_, i) => i).filter((i, _, all) => {
      if (i === 0 || i === all.length - 1) return true;
      const date = frameDate(tiles.frames[i]);
      return date && date.getMinutes() % 30 === 0;
    });
    const nearest = (active) => slotIndexes.reduce((best, i) => (
      Math.abs(i - active) < Math.abs(best - active) ? i : best
    ), slotIndexes[0]);

    const player = playController({
      frames: tiles.frames,
      playMs: ctx.contentSettings.playMs || 2000,
      holdMs: 2800,
      onFrame(frame, index) {
        ctx.map?.setOverlay(tileUrl(frame));
        if (index === 0) ctx.map?.invalidate();
        const date = frameDate(frame);
        if (clock) clock.textContent = formatClock(date);
        if (kindEl) kindEl.textContent = kindLabel(frame, nowDate);
        if (nowClock && index === 0) nowClock.textContent = formatClock(date);
        const on = nearest(index);
        slots.innerHTML = slotIndexes.map((i) => {
          const item = tiles.frames[i];
          const d = frameDate(item);
          return `<button type="button" class="${i === on ? "is-on" : ""}" disabled>
            <em>${kindLabel(item, nowDate)}</em>
            <strong>${formatClock(d)}</strong>
          </button>`;
        }).join("");
      }
    });
    ctx.addCleanup(() => player.stop());
  }

  return {
    ok: forecast.ok || tiles.ok,
    reportAt: forecast.reportAt,
    dataUpdatedAt: tiles.dataUpdatedAt || forecast.reportAt,
    fetchedAt: tiles.fetchedAt || forecast.fetchedAt,
    fromCache: tiles.fromCache || forecast.fromCache
  };
}
