import { renderRainCombined } from "./contents/rain-combined.js";
import { getContent } from "./data/contents.js";
import { defaultPoint, getPoint } from "./data/observation-points.js";
import { getPrefecture, regionOf } from "./data/prefectures.js";
import { createMap, MAP_ATTRIBUTION } from "./map/map-engine.js";
import { formatStamp, nextForecastRefreshDelay } from "./services/jma-common.js";
import { settingsForSignage } from "./store.js";
import { applyDesignTokens, fitFixedScreen, measureVisibleBox, FIXED_DESIGN } from "./viewport.js";

const RENDERERS = {
  rain: renderRainCombined,
  rain_forecast: renderRainCombined,
  rain_radar: renderRainCombined,
  future_rain: renderRainCombined,
  precipitation_nowcast: renderRainCombined
};

function screenHtml() {
  return `
    <article class="led-screen" data-ready="0">
      <header class="led-header">
        <div class="led-title-bar">
          <h1 class="led-title"></h1>
        </div>
        <div class="led-sub-bar">
          <div class="led-stamp"></div>
          <div class="led-point"></div>
        </div>
      </header>
      <div class="led-body">
        <div class="map-stage">
          <div class="map-canvas"></div>
          <div class="map-timebar">
            <div class="time-bar-head">
              <span data-kind>現在</span>
              <strong data-frame-clock>--</strong>
            </div>
            <div class="time-bar-track">
              <i data-timebar-fill></i>
              <b data-timebar-knob></b>
            </div>
            <div class="time-bar-axis">
              <span data-timebar-start>--</span>
              <span data-timebar-end>--</span>
            </div>
          </div>
        </div>
        <aside class="info-panel"></aside>
      </div>
      <div class="map-attribution"></div>
    </article>
  `;
}

export function buildScreen(root) {
  root.innerHTML = screenHtml();
  const screen = root.querySelector(".led-screen");
  return {
    root,
    screen,
    title: screen.querySelector(".led-title"),
    stamp: screen.querySelector(".led-stamp"),
    point: screen.querySelector(".led-point"),
    panel: screen.querySelector(".info-panel"),
    mapCanvas: screen.querySelector(".map-canvas"),
    timebar: screen.querySelector(".map-timebar"),
    attr: screen.querySelector(".map-attribution")
  };
}

export function applyVisibility(els, common) {
  els.stamp.hidden = common.showStamp === false;
  els.point.hidden = common.showPoint === false;
  els.panel.hidden = common.showPanel === false;
  els.attr.hidden = common.showAttribution === false;
  els.screen.classList.toggle("is-panel-off", common.showPanel === false);
  els.screen.classList.toggle("is-legend-off", common.showLegend === false);
  els.screen.classList.toggle("is-clock-off", common.showClock === false);
}

export async function mountSignage(root, options = {}) {
  const prefecture = getPrefecture(options.prefecture);
  const content = getContent(options.content);
  const published = options.settings || settingsForSignage(prefecture.slug, content.id);
  const point = options.point || getPoint(options.pointId || published.pointId, prefecture.slug) || defaultPoint(prefecture.slug);
  const common = published.common || {};
  const contentSettings = published.content || published.contents?.[content.id] || {};
  const cleanups = [];
  const reuseScreen = !!root.querySelector(".led-screen");
  const quiet = !!options.quiet && reuseScreen;
  const els = reuseScreen ? {
    root,
    screen: root.querySelector(".led-screen"),
    title: root.querySelector(".led-title"),
    stamp: root.querySelector(".led-stamp"),
    point: root.querySelector(".led-point"),
    panel: root.querySelector(".info-panel"),
    mapCanvas: root.querySelector(".map-canvas"),
    timebar: root.querySelector(".map-timebar"),
    attr: root.querySelector(".map-attribution")
  } : buildScreen(root);

  els.screen.dataset.prefecture = prefecture.slug;
  els.screen.dataset.content = content.id;
  els.title.textContent = `${prefecture.name}｜${content.name}`;
  if (!quiet) {
    els.stamp.textContent = "データ取得中";
    els.point.textContent = prefecture.national ? "" : (point ? `観測地点 ${point.name}` : "");
    els.attr.textContent = MAP_ATTRIBUTION;
    els.panel.innerHTML = `
      <div class="panel-kicker">${content.name}</div>
      <div class="panel-area">${prefecture.name}${!prefecture.national && point ? `／${point.name}` : ""}</div>
      <p class="wx-hint">${content.description}</p>
      <div class="time-grid"><div><span class="k">対象地域</span><strong>${regionOf(prefecture.slug).name}</strong></div></div>
    `;
    applyDesignTokens(els.screen, { common });
    applyVisibility(els, common);
  }
  if (prefecture.national) els.point.hidden = true;
  let map = options.map || null;
  const fitTo = () => {
    if (options.fit === false) return;
    const host = options.fitHost || els.root;
    const bounds = host && host !== document.body ? measureVisibleBox(host) : null;
    fitFixedScreen(els.screen, FIXED_DESIGN.width, FIXED_DESIGN.height, bounds);
    els.screen.style.maxWidth = "none";
    map?.invalidate();
  };
  fitTo();
  if (options.fitHost) {
    const ro = new ResizeObserver(fitTo);
    ro.observe(options.fitHost);
    cleanups.push(() => ro.disconnect());
  }
  window.addEventListener("resize", fitTo);
  cleanups.push(() => window.removeEventListener("resize", fitTo));

  if (!map) {
    map = await createMap(els.mapCanvas, {
      prefecture,
      point,
      interactive: !!options.interactive
    });
  }
  if (!quiet) fitTo();

  const ctx = {
    prefecture,
    content,
    point,
    common,
    contentSettings,
    map,
    els,
    quiet,
    player: options.player || null,
    addCleanup(fn) { cleanups.push(fn); }
  };

  const render = RENDERERS[content.id] || renderRainCombined;

  let refreshNow = null;
  ctx.onPlayLoopsDone = () => {
    refreshNow?.();
  };

  const applyData = async (isQuiet) => {
    ctx.quiet = isQuiet;
    ctx.map = map;
    const data = await render(ctx);
    const dataAt = data?.dataUpdatedAt || data?.reportAt || null;
    if (data?.ok) {
      els.stamp.textContent = dataAt
        ? `${formatStamp(dataAt)}更新${data.fromCache ? "（前回データ）" : ""}`
        : "更新時刻を確認中";
    } else if (!isQuiet) {
      els.stamp.textContent = "気象データを取得できませんでした";
    }
    return data;
  };

  const data = await applyData(quiet);
  const api = {
    prefecture,
    content,
    point,
    map,
    els,
    data,
    player: ctx.player || null,
    async refresh() {
      if (ctx.player && !ctx.player.loopsFinished()) return api;
      api.data = await applyData(true);
      api.player = ctx.player || api.player;
      return api;
    },
    destroy() {
      cleanups.forEach((fn) => {
        try { fn(); } catch { /* ignore */ }
      });
    }
  };
  refreshNow = () => {
    api.refresh();
  };
  return api;
}

export function bindAutoFit(screen) {
  const onResize = () => fitFixedScreen(screen, FIXED_DESIGN.width, FIXED_DESIGN.height);
  window.addEventListener("resize", onResize);
  onResize();
  return () => window.removeEventListener("resize", onResize);
}

export function refreshDelayFor(contentId) {
  if (contentId === "rain" || contentId === "rain_forecast") {
    return Math.min(60 * 1000, nextForecastRefreshDelay());
  }
  return 60 * 1000;
}
