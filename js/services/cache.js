const LASTGOOD_KEY = "rain-radar-lastgood-v2";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(LASTGOOD_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeAll(value) {
  try {
    localStorage.setItem(LASTGOOD_KEY, JSON.stringify(value));
  } catch {
    /* 容量超過時は最新だけ残す */
    try {
      localStorage.setItem(LASTGOOD_KEY, JSON.stringify({ latest: value.latest || null }));
    } catch {
      /* ignore */
    }
  }
}

export function cacheKey(prefecture, content, pointId) {
  return `${prefecture}:${content}:${pointId || "default"}`;
}

export function saveLastGood(key, payload) {
  const all = readAll();
  all[key] = {
    savedAt: new Date().toISOString(),
    payload
  };
  all.latest = { key, savedAt: all[key].savedAt };
  writeAll(all);
}

export function loadLastGood(key) {
  const all = readAll();
  return all[key]?.payload || null;
}
