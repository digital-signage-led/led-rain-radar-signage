import { PREFECTURES } from "./data/prefectures.js";
import { comboKey, defaultPoint, pointsForPrefecture } from "./data/observation-points.js";
import {
  allCombos,
  comboStatus,
  DRAFT_KEY,
  loadDraft,
  persistPublishedFile,
  publishCombo,
  publishDraft,
  saveDraft,
  signageUrl
} from "./store.js";

const $ = (id) => document.getElementById(id);

const state = {
  store: loadDraft(),
  prefecture: new URLSearchParams(location.search).get("prefecture") || "iwate",
  content: "rain",
  preview: null
};

function fitPreviewFrame() {
  const host = document.querySelector(".admin-preview");
  const frame = $("preview-frame");
  if (!host || !frame) return;
  const scale = Math.min(host.clientWidth / 1920, host.clientHeight / 1080);
  const ox = (host.clientWidth - 1920 * scale) / 2;
  const oy = (host.clientHeight - 1080 * scale) / 2;
  frame.style.transform = `translate(${ox}px, ${oy}px) scale(${scale})`;
}

function fillSelect(el, items, getValue, getLabel, selected) {
  el.innerHTML = items.map((item) => {
    const value = getValue(item);
    return `<option value="${value}" ${value === selected ? "selected" : ""}>${getLabel(item)}</option>`;
  }).join("");
}

function currentPointId() {
  const key = comboKey(state.prefecture, state.content);
  return state.store.points[key] || defaultPoint(state.prefecture)?.id;
}

function setPointId(id) {
  state.store.points[comboKey(state.prefecture, state.content)] = id;
}

function syncCommonInputs() {
  const c = state.store.common;
  $("title-size").value = c.titleSize;
  $("title-x").value = c.titleX;
  $("title-y").value = c.titleY;
  $("map-scale").value = c.mapScale;
  $("map-x").value = c.mapX;
  $("map-y").value = c.mapY;
  $("font-size").value = c.fontSize;
  $("panel-x").value = c.panelX;
  $("panel-y").value = c.panelY;
  $("padding").value = c.padding;
  $("show-stamp").checked = c.showStamp !== false;
  $("show-point").checked = c.showPoint !== false;
  $("show-legend").checked = c.showLegend !== false;
  $("show-clock").checked = c.showClock !== false;
  $("show-panel").checked = c.showPanel !== false;
  $("show-attr").checked = c.showAttribution !== false;
}

function readCommonInputs() {
  const c = state.store.common;
  c.titleSize = Number($("title-size").value);
  c.titleX = Number($("title-x").value);
  c.titleY = Number($("title-y").value);
  c.mapScale = Number($("map-scale").value);
  c.mapX = Number($("map-x").value);
  c.mapY = Number($("map-y").value);
  c.fontSize = Number($("font-size").value);
  c.panelX = Number($("panel-x").value);
  c.panelY = Number($("panel-y").value);
  c.padding = Number($("padding").value);
  c.showStamp = $("show-stamp").checked;
  c.showPoint = $("show-point").checked;
  c.showLegend = $("show-legend").checked;
  c.showClock = $("show-clock").checked;
  c.showPanel = $("show-panel").checked;
  c.showAttribution = $("show-attr").checked;
}

function syncContentInputs() {
  const s = state.store.contents.rain;
  $("show-temps").checked = s.showTemps !== false;
  $("rain-play").value = s.playMs;
  $("future-min").value = s.futureMinutes;
}

function readContentInputs() {
  const s = state.store.contents.rain;
  s.showTemps = $("show-temps").checked;
  s.playMs = Number($("rain-play").value);
  s.futureMinutes = Number($("future-min").value);
}

function statusLabel() {
  const status = comboStatus(state.store, state.prefecture, state.content);
  $("combo-status").textContent = status === "published" ? "公開済み" : "下書き";
  $("combo-status").dataset.status = status;
}

function renderPreview() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state.store));
  } catch {
    /* ignore */
  }
  const frame = $("preview-frame");
  const url = new URL("index.html", location.href);
  url.searchParams.set("prefecture", state.prefecture);
  url.searchParams.set("content", state.content);
  url.searchParams.set("point", currentPointId() || "");
  url.searchParams.set("preview", "1");
  url.searchParams.set("_", String(Date.now()));
  frame.src = url.href;
  requestAnimationFrame(fitPreviewFrame);
}

function pushPreviewDesign() {
  const frame = $("preview-frame");
  try {
    frame.contentWindow?.postMessage({
      type: "rain-preview-design",
      common: state.store.common
    }, location.origin);
  } catch {
    /* ignore */
  }
}

function fillPoints() {
  const points = pointsForPrefecture(state.prefecture);
  fillSelect($("point-select"), points, (p) => p.id, (p) => p.name, currentPointId());
  if (!points.some((p) => p.id === currentPointId()) && points[0]) {
    setPointId(points[0].id);
    $("point-select").value = points[0].id;
  }
}

function publicHref(pref, content) {
  return signageUrl(pref, content, `${location.origin}${location.pathname.replace(/admin\.html.*$/, "index.html")}`);
}

function renderUrls() {
  const qPref = $("url-pref").value.trim();
  const qStatus = $("url-status").value;
  const rows = allCombos().filter((row) => {
    if (qPref && !(`${row.prefecture.name}${row.prefecture.slug}`.includes(qPref))) return false;
    if (qStatus && row.status !== qStatus) return false;
    return true;
  });
  $("url-count").textContent = `${rows.length} / ${PREFECTURES.length}`;
  $("url-table").innerHTML = rows.map((row) => {
    const url = publicHref(row.prefecture.slug, row.content.id);
    return `<tr>
      <td>${row.prefecture.name}</td>
      <td>${row.content.name}</td>
      <td><span class="pill" data-status="${row.status}">${row.status === "published" ? "公開済み" : "下書き"}</span></td>
      <td class="url-cell"><code>${url}</code></td>
      <td><button type="button" data-copy="${url}">URLをコピー</button></td>
    </tr>`;
  }).join("");
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => { el.hidden = true; }, 2400);
}

function bind() {
  fillSelect($("pref-select"), PREFECTURES, (p) => p.slug, (p) => p.name, state.prefecture);
  fillPoints();
  syncCommonInputs();
  syncContentInputs();
  statusLabel();

  $("pref-select").addEventListener("change", () => {
    state.prefecture = $("pref-select").value;
    fillPoints();
    statusLabel();
    renderPreview();
  });
  $("point-select").addEventListener("change", () => {
    setPointId($("point-select").value);
    renderPreview();
  });

  document.querySelectorAll("[data-live]").forEach((el) => {
    el.addEventListener("input", () => {
      readCommonInputs();
      readContentInputs();
      pushPreviewDesign();
    });
    if (el.tagName === "INPUT" && el.type === "number") {
      el.addEventListener("change", () => {
        readContentInputs();
        renderPreview();
      });
    }
  });

  $("btn-save").addEventListener("click", () => {
    readCommonInputs();
    readContentInputs();
    state.store = saveDraft(state.store);
    statusLabel();
    toast("下書きを保存しました");
  });
  $("btn-publish").addEventListener("click", async () => {
    readCommonInputs();
    readContentInputs();
    const result = publishCombo(state.store, state.prefecture, state.content);
    state.store = result.draft;
    statusLabel();
    renderUrls();
    const persist = await persistPublishedFile(result.published);
    toast(persist.mode === "server" ? "この組み合わせを公開しました" : "公開しました（設定ファイルを保存してください）");
  });
  $("btn-publish-all").addEventListener("click", async () => {
    readCommonInputs();
    readContentInputs();
    state.store = publishDraft(state.store);
    statusLabel();
    renderUrls();
    await persistPublishedFile(state.store);
    toast("全件を公開設定に反映しました");
  });
  $("btn-open").addEventListener("click", () => {
    window.open(publicHref(state.prefecture, state.content), "_blank");
  });

  $("url-pref").addEventListener("input", renderUrls);
  $("url-status").addEventListener("change", renderUrls);
  $("url-table").addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-copy]");
    if (!btn) return;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      toast("URLをコピーしました");
    } catch {
      toast("コピーできませんでした");
    }
  });
}

bind();
renderPreview();
renderUrls();
window.addEventListener("resize", fitPreviewFrame);
$("preview-frame").addEventListener("load", () => {
  fitPreviewFrame();
  pushPreviewDesign();
});
