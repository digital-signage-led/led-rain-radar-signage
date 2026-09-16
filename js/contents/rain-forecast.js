import { fetchRainForecast } from "../services/rain.js";
import { errorPanel, popCell, popTone, timesBlock } from "./shared-ui.js";

function popRow(pops) {
  const cells = [
    ["朝", pops.morning],
    ["昼", pops.noon],
    ["夕", pops.evening],
    ["夜", pops.night]
  ];
  return cells.map(([label, value]) => (
    `<div class="pop-cell ${popTone(value)}"><span>${label}</span><strong>${popCell(value)}</strong></div>`
  )).join("");
}

export async function renderRainForecast(ctx) {
  const data = await fetchRainForecast({
    prefecture: ctx.prefecture.slug,
    pointId: ctx.point?.id
  });
  const panel = ctx.els.panel;
  if (!data.ok) {
    panel.innerHTML = errorPanel(data.message);
    return data;
  }

  const weekly = (ctx.contentSettings.showWeekly !== false && data.weekly?.length)
    ? `<div class="weekly">
        ${data.weekly.slice(0, 7).map((day) => `
          <div class="weekly-day">
            <em>${day.label}<small>${day.weekday}</small></em>
            <strong class="${popTone(day.pop)}">${day.pop == null ? "—" : `${day.pop}%`}</strong>
          </div>
        `).join("")}
      </div>`
    : "";

  const temps = ctx.contentSettings.showTemps !== false && (data.tempMin != null || data.tempMax != null)
    ? `<div class="temps"><span>気温</span><strong>${data.tempMin ?? "—"} / ${data.tempMax ?? "—"}℃</strong></div>`
    : "";

  panel.innerHTML = `
    <div class="panel-kicker">雨の予報</div>
    <div class="panel-area">${data.areaName}</div>
    <div class="wx-row">
      <img class="wx-icon" src="${data.weatherIcon}" alt="" width="88" height="88">
      <div>
        <p class="wx-text">${data.weatherLabel}</p>
        <p class="wx-hint">${data.rainHint}</p>
      </div>
    </div>
    ${temps}
    <div class="section-label">今日の降水確率</div>
    <div class="pop-row">${popRow(data.todayPop)}</div>
    <div class="section-label">明日の降水確率</div>
    <div class="pop-row">${popRow(data.tomorrowPop)}</div>
    ${weekly}
    ${timesBlock({
      dataUpdatedAt: data.reportAt,
      displayUpdatedAt: data.fetchedAt,
      fromCache: data.fromCache
    })}
  `;
  return data;
}
