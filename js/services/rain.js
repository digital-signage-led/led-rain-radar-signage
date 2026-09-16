import { defaultPoint, getPoint } from "../data/observation-points.js";
import { getPrefecture } from "../data/prefectures.js";
import { cacheKey, loadLastGood, saveLastGood } from "./cache.js";
import {
  FORECAST_ICON,
  FORECAST_URL,
  fetchJson,
  formatStamp,
  formatYmd,
  num,
  parseJst,
  pickArea,
  popBucket,
  resolveOffice,
  seriesBy
} from "./jma-common.js";

function rainHint(weatherText, code) {
  const text = String(weatherText || "");
  const n = Number(code);
  if (/雨|雷|雪/.test(text) || (n >= 200 && n < 500 && /雨/.test(text))) {
    if (/激しい|豪雨|大雨/.test(text)) return "強い雨の可能性があります";
    if (/一時/.test(text)) return "一時的に雨が降る見込みです";
    if (/時々/.test(text)) return "雨が降ったり止んだりする見込みです";
    return "雨の見込みがあります";
  }
  if (n >= 300 && n < 400) return "雨の見込みがあります";
  if (n >= 400 && n < 500) return "雪または雨の見込みがあります";
  return "雨の心配は少ない見込みです";
}

function weeklyPops(weekly, mapping) {
  const wx = seriesBy(weekly, "weatherCodes") || seriesBy(weekly, "pops");
  if (!wx) return [];
  const area = pickArea(wx.areas, [mapping.class10, mapping.office, mapping.name]);
  const defines = wx.timeDefines || [];
  const days = [];
  for (let i = 0; i < Math.min(7, defines.length); i += 1) {
    const date = parseJst(defines[i]);
    days.push({
      date,
      label: date ? `${date.getMonth() + 1}/${date.getDate()}` : "—",
      weekday: date ? "日月火水木金土"[date.getDay()] : "",
      weatherCode: String(area?.weatherCodes?.[i] || ""),
      pop: num(area?.pops?.[i]),
      min: num(area?.tempsMin?.[i]),
      max: num(area?.tempsMax?.[i])
    });
  }
  return days;
}

export async function fetchRainForecast({ prefecture, pointId }) {
  const pref = getPrefecture(prefecture);
  const point = getPoint(pointId, pref.slug) || defaultPoint(pref.slug);
  const key = cacheKey(pref.slug, "rain_forecast", point?.id);
  const office = resolveOffice(point?.jmaOffice || pref.dataId);
  try {
    const forecast = await fetchJson(FORECAST_URL(office));
    const shortTerm = forecast[0] || {};
    const weekly = forecast[1] || {};
    const wxSeries = seriesBy(shortTerm, "weatherCodes") || seriesBy(shortTerm, "weathers");
    const popSeries = seriesBy(shortTerm, "pops");
    const tempSeries = seriesBy(shortTerm, "temps");
    const mapping = {
      office,
      class10: point?.jmaClass10,
      name: point?.name
    };
    const wxArea = pickArea(wxSeries?.areas, [mapping.class10, mapping.office, mapping.name, pref.name]);
    const popArea = pickArea(popSeries?.areas, [mapping.class10, mapping.office, mapping.name]);
    const tempArea = pickArea(tempSeries?.areas, [mapping.name, mapping.name?.replace(/[市町村]$/, "")]);
    const todayYmd = formatYmd(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYmd = formatYmd(tomorrow);
    const pops = (popArea?.pops || []).map(num);
    const todayPop = popBucket(popSeries?.timeDefines || [], pops, todayYmd);
    const tomorrowPop = popBucket(popSeries?.timeDefines || [], pops, tomorrowYmd);
    const reportAt = parseJst(shortTerm.reportDatetime);
    const weatherText = wxArea?.weathers?.[0] || "";
    const weatherCode = String(wxArea?.weatherCodes?.[0] || "200");
    const payload = {
      ok: true,
      fromCache: false,
      prefecture: pref,
      point,
      office,
      officeName: shortTerm.publishingOffice || "",
      reportAt,
      reportStamp: formatStamp(reportAt),
      fetchedAt: new Date(),
      areaName: wxArea?.area?.name || pref.name,
      weatherCode,
      weatherLabel: weatherText || "—",
      weatherIcon: FORECAST_ICON(weatherCode),
      rainHint: rainHint(weatherText, weatherCode),
      winds: wxArea?.winds?.[0] || "",
      todayPop,
      tomorrowPop,
      tempMin: num(tempArea?.temps?.[0]),
      tempMax: num(tempArea?.temps?.[1]),
      weekly: weeklyPops(weekly, mapping),
      tomorrowWeather: wxArea?.weathers?.[1] || "",
      tomorrowCode: String(wxArea?.weatherCodes?.[1] || weatherCode)
    };
    saveLastGood(key, payload);
    return payload;
  } catch (error) {
    const cached = loadLastGood(key);
    if (cached) {
      return { ...cached, ok: true, fromCache: true, fetchedAt: new Date(), cacheError: String(error.message || error) };
    }
    return {
      ok: false,
      fromCache: false,
      prefecture: pref,
      point,
      office,
      error: String(error.message || error),
      message: "気象データを取得できませんでした"
    };
  }
}
