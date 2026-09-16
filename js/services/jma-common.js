/** 気象庁 bosai API の共通処理。画面ごとの取得コード複製を避ける。 */

export const JMA_ORIGIN = "https://www.jma.go.jp";
export const AREA_URL = `${JMA_ORIGIN}/bosai/common/const/area.json`;
export const FORECAST_URL = (office) => `${JMA_ORIGIN}/bosai/forecast/data/forecast/${office}.json`;
export const FORECAST_ICON = (code) => `${JMA_ORIGIN}/bosai/forecast/img/${code}.svg`;

const OFFICE_ALIAS = {
  "014030": "016000",
  "460040": "460100"
};

let areaCache = null;
let areaAt = 0;

export function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatStamp(date) {
  if (!date || Number.isNaN(date.getTime())) return "—";
  const week = "日月火水木金土"[date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()}日(${week}) ${hh}:${mm}`;
}

export function formatClock(date) {
  if (!date || Number.isNaN(date.getTime())) return "--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function parseJst(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function num(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function fetchJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadArea() {
  const now = Date.now();
  if (areaCache && now - areaAt < 24 * 60 * 60 * 1000) return areaCache;
  areaCache = await fetchJson(AREA_URL);
  areaAt = now;
  return areaCache;
}

export function resolveOffice(office) {
  return OFFICE_ALIAS[office] || office;
}

export function pickArea(areas, codesOrNames) {
  if (!areas?.length) return null;
  const names = (codesOrNames || []).filter(Boolean);
  return areas.find((item) => names.includes(item.area?.code))
    || areas.find((item) => names.some((name) => item.area?.name === name))
    || areas.find((item) => names.some((name) => item.area?.name?.includes(name)))
    || areas[0];
}

export function seriesBy(block, key) {
  return block?.timeSeries?.find((series) => series.areas?.some((item) => key in item));
}

export function nextForecastRefreshDelay() {
  const now = new Date();
  const slots = [5, 11, 17].map((hour) => {
    const d = new Date(now);
    d.setHours(hour, 5, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  });
  slots.sort((a, b) => a - b);
  return Math.max(60 * 1000, slots[0] - now);
}

export function parseNowcMs(stamp) {
  const s = String(stamp || "");
  if (s.length < 14) return null;
  const y = Number(s.slice(0, 4));
  const mo = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  const h = Number(s.slice(8, 10));
  const mi = Number(s.slice(10, 12));
  const se = Number(s.slice(12, 14));
  const utc = Date.UTC(y, mo, d, h, mi, se);
  return Number.isFinite(utc) ? utc : null;
}

export function nowcToDate(stamp) {
  const ms = parseNowcMs(stamp);
  return ms == null ? null : new Date(ms);
}

export const JMA_POP_LABELS = ["朝", "昼", "夕", "夜"];

export function popBucket(defines, values, ymd) {
  const out = { morning: null, noon: null, evening: null, night: null };
  for (let i = 0; i < defines.length; i += 1) {
    const stamp = parseJst(defines[i]);
    if (!stamp || formatYmd(stamp) !== ymd) continue;
    const hour = stamp.getHours();
    const v = num(values[i]);
    if (hour === 0 || hour === 3) out.night = v;
    else if (hour === 6 || hour === 9) out.morning = v;
    else if (hour === 12) out.noon = v;
    else if (hour === 15 || hour === 18) out.evening = v;
    else if (hour === 21) out.night = v;
  }
  return out;
}
