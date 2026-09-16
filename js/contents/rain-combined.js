import { fetchFutureRain } from "../services/future-rain.js";
import { fetchRainForecast } from "../services/rain.js";
import { formatClock, formatStamp } from "../services/jma-common.js";
import { frameDate, tileUrl } from "../services/jma-tiles.js";
import { errorPanel, intensityLegend, playController, popCell, popTone } from "./shared-ui.js";

function shortWeather(text, code) {
  const t = String(text || "");
  const n = Number(code);
  if (/雷/.test(t) && /雪/.test(t)) return "雷雪";
  if (/雷/.test(t) && /雨/.test(t)) return "雷雨";
  if (/雪/.test(t) || (n >= 400 && n < 500)) return "雪";
  if (/雨/.test(t) || (n >= 300 && n < 400)) return "雨";
  if (/曇/.test(t) || (n >= 200 && n < 300)) return "くもり";
  if (/晴/.test(t) || (n >= 100 && n < 200)) return "晴れ";
  return t.split(/[　\s]/).find(Boolean) || "—";
}

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
  return min <= 0 ? "現在" : `+${min}分`;
}

export async function renderRainCombined(ctx) {
  const panel = ctx.els.panel;
  const [forecast, tiles] = await Promise.all([
    fetchRainForecast({ prefecture: ctx.prefecture.slug, pointId: ctx.point?.id }),
    fetchFutureRain({
      prefecture: ctx.prefecture.slug,
      pointId: ctx.point?.id,
      futureMinutes: ctx.contentSettings.futureMinutes ?? 180,
      national: !!ctx.prefecture.national
    })
  ]);

  if (!forecast.ok && !tiles.ok) {
    panel.innerHTML = errorPanel(forecast.message || tiles.message);
    return forecast;
  }

  const national = !!ctx.prefecture.national;
  const temps = !national && forecast.ok && ctx.contentSettings.showTemps !== false && (forecast.tempMin != null || forecast.tempMax != null)
    ? (forecast.tempMin != null && forecast.tempMax != null && forecast.tempMin !== forecast.tempMax
      ? `<p class="temps"><span>気温</span><strong>${forecast.tempMin}〜${forecast.tempMax}℃</strong></p>`
      : `<p class="temps"><span>気温</span><strong>${forecast.tempMax ?? forecast.tempMin}℃</strong></p>`)
    : "";

  const nowDate = tiles.frames?.length ? frameDate(tiles.frames[0]) : null;

  panel.innerHTML = `
    <div class="panel-area">${national ? "全国" : (forecast.areaName || ctx.prefecture.name)}</div>
    ${national ? `
      <p class="wx-text">雨雲レーダー</p>
      <p class="section-label">日本全国の降水を表示</p>
    ` : forecast.ok ? `
      <div class="wx-row">
        <img class="wx-icon" src="${forecast.weatherIcon}" alt="" width="88" height="88">
        <div>
          <p class="wx-text">${shortWeather(forecast.weatherLabel, forecast.weatherCode)}</p>
          ${temps}
        </div>
      </div>
      <div class="section-label">今日の降水確率</div>
      <div class="pop-row">${popRow(forecast.todayPop)}</div>
    ` : errorPanel(forecast.message)}
    <div class="time-bar">
      <div class="time-bar-head">
        <span data-kind>現在</span>
        <strong data-frame-clock>${formatClock(nowDate)}</strong>
      </div>
      <div class="time-bar-track">
        <i data-timebar-fill></i>
        <b data-timebar-knob></b>
      </div>
      <div class="time-bar-axis">
        <span data-timebar-start>${formatClock(nowDate)}</span>
        <span data-timebar-end>—</span>
      </div>
    </div>
    <div class="legend">${intensityLegend()}</div>
    <div class="time-one">
      <span>更新</span>
      <strong>${formatStamp(tiles.dataUpdatedAt || forecast.reportAt)}</strong>
      ${tiles.fromCache || forecast.fromCache ? `<em>前回データ</em>` : ""}
    </div>
  `;

  const playFrames = (tiles.frames || []).filter((frame) => frame.product !== "rasrf");
  if (tiles.ok && playFrames.length) {
    const clock = panel.querySelector("[data-frame-clock]");
    const kindEl = panel.querySelector("[data-kind]");
    const fillEl = panel.querySelector("[data-timebar-fill]");
    const knobEl = panel.querySelector("[data-timebar-knob]");
    const startEl = panel.querySelector("[data-timebar-start]");
    const endEl = panel.querySelector("[data-timebar-end]");
    const lastDate = frameDate(playFrames[playFrames.length - 1]);
    if (startEl) startEl.textContent = formatClock(nowDate || frameDate(playFrames[0]));
    if (endEl) endEl.textContent = formatClock(lastDate);
    const player = playController({
      frames: playFrames,
      playMs: Number(ctx.contentSettings.playMs) > 0 && Number(ctx.contentSettings.playMs) < 1800
        ? Number(ctx.contentSettings.playMs)
        : 700,
      holdMs: 1000,
      onFrame(frame, index, total) {
        const date = frameDate(frame);
        if (clock) clock.textContent = formatClock(date);
        if (kindEl) kindEl.textContent = kindLabel(frame, nowDate);
        const max = Math.max(1, (total || playFrames.length) - 1);
        const pct = `${Math.round(((Number(index) || 0) / max) * 1000) / 10}%`;
        if (fillEl) fillEl.style.width = pct;
        if (knobEl) knobEl.style.left = pct;
        return ctx.map?.setOverlay(tileUrl(frame));
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
