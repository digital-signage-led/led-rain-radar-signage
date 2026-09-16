/**
 * 下書きと公開の分離。
 * サイネージ本番は公開設定のみ読む。編集中の下書きは即時反映しない。
 */
import { CONTENTS } from "./data/contents.js";
import { PREFECTURES } from "./data/prefectures.js";
import { comboKey, defaultPoint } from "./data/observation-points.js";

export const DRAFT_KEY = "rain-radar-draft-v1";
export const PUBLISHED_KEY = "rain-radar-published-v1";

export function defaultCommon() {
  return {
    titleSize: 1,
    titleX: 0,
    titleY: 0,
    mapScale: 1,
    mapX: 0,
    mapY: 0,
    fontSize: 1,
    panelX: 0,
    panelY: 0,
    padding: 1,
    showStamp: true,
    showPoint: true,
    showLegend: true,
    showClock: true,
    showPanel: true,
    showAttribution: true
  };
}

export function defaultContentSettings() {
  return {
    rain_forecast: { showWeekly: true, showTemps: true },
    rain_radar: { playMs: 1800, pastMinutes: 60 },
    future_rain: { playMs: 2200, futureMinutes: 180 },
    precipitation_nowcast: { playMs: 2000, horizonMinutes: 60 }
  };
}

export function emptyStore() {
  const points = {};
  const status = {};
  for (const pref of PREFECTURES) {
    const point = defaultPoint(pref.slug);
    for (const content of CONTENTS) {
      const key = comboKey(pref.slug, content.id);
      points[key] = point?.id || "";
      status[key] = "published";
    }
  }
  return {
    version: 1,
    updatedAt: null,
    publishedAt: null,
    common: defaultCommon(),
    contents: defaultContentSettings(),
    points,
    status
  };
}

function mergeStore(base, patch) {
  const out = emptyStore();
  if (!patch || typeof patch !== "object") return out;
  out.updatedAt = patch.updatedAt || base.updatedAt || null;
  out.publishedAt = patch.publishedAt || base.publishedAt || null;
  out.common = { ...out.common, ...(patch.common || {}) };
  out.contents = {
    rain_forecast: { ...out.contents.rain_forecast, ...(patch.contents?.rain_forecast || {}) },
    rain_radar: { ...out.contents.rain_radar, ...(patch.contents?.rain_radar || {}) },
    future_rain: { ...out.contents.future_rain, ...(patch.contents?.future_rain || {}) },
    precipitation_nowcast: { ...out.contents.precipitation_nowcast, ...(patch.contents?.precipitation_nowcast || {}) }
  };
  out.points = { ...out.points, ...(patch.points || {}) };
  out.status = { ...out.status, ...(patch.status || {}) };
  return out;
}

function readKey(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadDraft() {
  return mergeStore(emptyStore(), readKey(DRAFT_KEY));
}

export function loadPublished() {
  return mergeStore(emptyStore(), readKey(PUBLISHED_KEY));
}

export function saveDraft(store) {
  const next = mergeStore(emptyStore(), store);
  next.updatedAt = new Date().toISOString();
  writeKey(DRAFT_KEY, next);
  return next;
}

export function publishDraft(store) {
  const next = mergeStore(emptyStore(), store);
  const now = new Date().toISOString();
  next.updatedAt = now;
  next.publishedAt = now;
  for (const key of Object.keys(next.status)) {
    next.status[key] = "published";
  }
  writeKey(DRAFT_KEY, next);
  writeKey(PUBLISHED_KEY, next);
  return next;
}

export function publishCombo(store, prefecture, content) {
  const draft = mergeStore(emptyStore(), store);
  const published = loadPublished();
  const key = comboKey(prefecture, content);
  draft.status[key] = "published";
  published.common = { ...draft.common };
  published.contents = JSON.parse(JSON.stringify(draft.contents));
  published.points[key] = draft.points[key];
  published.status[key] = "published";
  published.publishedAt = new Date().toISOString();
  draft.updatedAt = published.publishedAt;
  writeKey(DRAFT_KEY, draft);
  writeKey(PUBLISHED_KEY, published);
  return { draft, published };
}

export function markDraft(store, prefecture, content) {
  const next = mergeStore(emptyStore(), store);
  next.status[comboKey(prefecture, content)] = "draft";
  next.updatedAt = new Date().toISOString();
  writeKey(DRAFT_KEY, next);
  return next;
}

export function comboStatus(store, prefecture, content) {
  return store.status[comboKey(prefecture, content)] || "draft";
}

export function settingsForSignage(prefecture, content) {
  const published = loadPublished();
  const key = comboKey(prefecture, content);
  return {
    common: published.common,
    content: published.contents[content] || {},
    pointId: published.points[key],
    status: published.status[key] || "published",
    publishedAt: published.publishedAt
  };
}

export function allCombos() {
  const published = loadPublished();
  const draft = loadDraft();
  const rows = [];
  for (const pref of PREFECTURES) {
    for (const content of CONTENTS) {
      const key = comboKey(pref.slug, content.id);
      rows.push({
        key,
        prefecture: pref,
        content,
        pointId: draft.points[key] || published.points[key],
        status: published.status[key] === "published" ? "published" : (draft.status[key] || "draft")
      });
    }
  }
  return rows;
}

export function signageSearch(prefecture, content) {
  return `?prefecture=${encodeURIComponent(prefecture)}&content=${encodeURIComponent(content)}`;
}

export function signageUrl(prefecture, content, baseHref = location.href) {
  const url = new URL("index.html", baseHref);
  url.search = "";
  url.hash = "";
  return `${url.href}${signageSearch(prefecture, content)}`;
}

export async function persistPublishedFile(store) {
  try {
    const res = await fetch("/api/published-settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(store)
    });
    if (res.ok) return { ok: true, mode: "server" };
  } catch {
    /* ローカルサーバ未起動時はダウンロード */
  }
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "published-settings.json";
  a.click();
  URL.revokeObjectURL(a.href);
  return { ok: true, mode: "download" };
}
