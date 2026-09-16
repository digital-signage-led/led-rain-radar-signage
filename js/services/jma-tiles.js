import { cacheKey, loadLastGood, saveLastGood } from "./cache.js";
import { fetchJson, nowcToDate, parseNowcMs } from "./jma-common.js";

const NOWC_N1 = "https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json";
const NOWC_N2 = "https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N2.json";
const RASRF = "https://www.jma.go.jp/bosai/jmatile/data/rasrf/targetTimes.json";

const TILE_CACHE_TTL = 60 * 1000;
let frameMemo = { at: 0, value: null };

function hasElement(entry, name) {
  const elems = entry?.elements || entry?.element || [];
  if (!elems) return true;
  if (Array.isArray(elems)) return elems.includes(name) || elems.length === 0;
  return String(elems).includes(name);
}

function sortByValid(list) {
  return (Array.isArray(list) ? list.slice() : []).sort((a, b) => {
    return String(a.validtime || a.basetime) < String(b.validtime || b.basetime) ? -1 : 1;
  });
}

export function tileUrl(frame) {
  if (!frame) return "";
  if (frame.product === "rasrf") {
    return `https://www.jma.go.jp/bosai/jmatile/data/rasrf/${frame.basetime}/none/${frame.validtime}/surf/rasrf/{z}/{x}/{y}.png`;
  }
  return `https://www.jma.go.jp/bosai/jmatile/data/nowc/${frame.basetime}/none/${frame.validtime}/surf/hrpns/{z}/{x}/{y}.png`;
}

export function frameDate(frame) {
  return nowcToDate(frame?.validtime);
}

function toFrame(entry, kind, product) {
  return {
    basetime: entry.basetime || entry.validtime,
    validtime: entry.validtime || entry.basetime,
    kind,
    product,
    date: nowcToDate(entry.validtime || entry.basetime)
  };
}

function uniqueFrames(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = `${item.product}:${item.validtime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchTileCatalog() {
  const now = Date.now();
  if (frameMemo.value && now - frameMemo.at < TILE_CACHE_TTL) return frameMemo.value;
  const q = `?_=${now}`;
  const [n1, n2, rasrf] = await Promise.all([
    fetchJson(NOWC_N1 + q),
    fetchJson(NOWC_N2 + q),
    fetchJson(RASRF + q).catch(() => [])
  ]);
  const past = sortByValid(n1).filter((d) => hasElement(d, "hrpns")).map((d) => toFrame(d, "past", "hrpns"));
  const nowcFc = sortByValid(n2).filter((d) => hasElement(d, "hrpns")).map((d) => toFrame(d, "forecast", "hrpns"));
  const rasrfAll = sortByValid(rasrf).filter((d) => hasElement(d, "rasrf")).map((d) => toFrame(d, "forecast", "rasrf"));
  const latestObs = past[past.length - 1] || null;
  const latestObsMs = latestObs ? parseNowcMs(latestObs.validtime) : null;
  const catalog = {
    fetchedAt: new Date(now),
    dataUpdatedAt: latestObs?.date || rasrfAll[0]?.date || null,
    past,
    nowcastForecast: nowcFc,
    rasrf: rasrfAll,
    latestObs,
    latestObsMs
  };
  frameMemo = { at: now, value: catalog };
  return catalog;
}

export function radarFrames(catalog, pastMinutes = 60) {
  const cutoff = Date.now() - pastMinutes * 60 * 1000;
  return uniqueFrames((catalog.past || []).filter((f) => {
    const ms = parseNowcMs(f.validtime);
    return ms == null || ms >= cutoff;
  }));
}

export function nowcastFrames(catalog, horizonMinutes = 60) {
  const nowMs = catalog.latestObsMs || Date.now();
  const futureCut = nowMs + horizonMinutes * 60 * 1000;
  const current = catalog.latestObs ? [catalog.latestObs] : [];
  const future = (catalog.nowcastForecast || []).filter((f) => {
    const ms = parseNowcMs(f.validtime);
    return ms != null && ms > nowMs && ms <= futureCut;
  });
  return uniqueFrames([...current, ...future]);
}

export function futureRainFrames(catalog, futureMinutes = 180) {
  const nowMs = catalog.latestObsMs || Date.now();
  const nearCut = nowMs + Math.min(55, Number(futureMinutes) || 180) * 60 * 1000;
  const current = catalog.latestObs ? [{ ...catalog.latestObs, kind: "now" }] : [];
  const near = (catalog.nowcastForecast || []).filter((f) => {
    const ms = parseNowcMs(f.validtime);
    return ms != null && ms > nowMs && ms <= nearCut;
  });
  return uniqueFrames([...current, ...near]);
}

export async function loadTileSet(kind, options) {
  const key = cacheKey(options.prefecture, kind, options.pointId);
  try {
    const catalog = await fetchTileCatalog();
    let frames = [];
    if (kind === "rain_radar") frames = radarFrames(catalog, options.pastMinutes);
    else if (kind === "precipitation_nowcast") frames = nowcastFrames(catalog, options.horizonMinutes);
    else frames = futureRainFrames(catalog, options.futureMinutes);
    if (!frames.length) throw new Error("タイル時刻が空です");
    const payload = {
      ok: true,
      fromCache: false,
      catalog,
      frames,
      dataUpdatedAt: catalog.dataUpdatedAt,
      fetchedAt: catalog.fetchedAt
    };
    saveLastGood(key, payload);
    return payload;
  } catch (error) {
    const cached = loadLastGood(key);
    if (cached?.frames?.length) {
      return { ...cached, ok: true, fromCache: true, cacheError: String(error.message || error) };
    }
    return {
      ok: false,
      fromCache: false,
      frames: [],
      error: String(error.message || error),
      message: "気象データを取得できませんでした"
    };
  }
}
