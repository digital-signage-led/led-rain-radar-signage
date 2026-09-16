/**
 * 地理院タイル + 気象庁降水タイル。
 * 親要素の CSS transform は Leaflet タイル欠けの原因になるため使わない。
 */

const GSI_PALE = "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png";
const GSI_ATTR = "地理院タイル";
const TRANSPARENT = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

let leafletPromise = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-leaflet]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.dataset.leaflet = "1";
      css.href = new URL("../../vendor/leaflet/leaflet.css", import.meta.url).href;
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = new URL("../../vendor/leaflet/leaflet.js", import.meta.url).href;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet を読み込めませんでした"));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function waitSize(el) {
  return new Promise((resolve) => {
    let n = 0;
    const tick = () => {
      n += 1;
      if ((el.clientWidth >= 80 && el.clientHeight >= 80) || n > 40) {
        resolve();
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}

function zoomForPoint(pref, point) {
  if (!point) return pref.defaultZoom;
  const dLat = Math.abs(point.latitude - pref.centerLatitude);
  const dLng = Math.abs(point.longitude - pref.centerLongitude);
  if (dLat > 1.4 || dLng > 1.6) return Math.min(10, Math.max(8, pref.defaultZoom + 1));
  return pref.defaultZoom;
}

export function mapCenter(pref, point) {
  if (!point) return [pref.centerLatitude, pref.centerLongitude];
  const dLat = Math.abs(point.latitude - pref.centerLatitude);
  const dLng = Math.abs(point.longitude - pref.centerLongitude);
  if (dLat > 1.4 || dLng > 1.6) return [point.latitude, point.longitude];
  return [pref.centerLatitude, pref.centerLongitude];
}

function clampRainZoom(zoom) {
  return Math.min(10, Math.max(6, Math.round(zoom)));
}

export async function createMap(container, { prefecture, point, interactive = false }) {
  const L = await loadLeaflet();
  await waitSize(container);
  if (container._leaflet_id) {
    try {
      container._leaflet?.remove?.();
    } catch {
      /* ignore */
    }
    container._leaflet_id = null;
    container.innerHTML = "";
  }
  const center = mapCenter(prefecture, point);
  const zoom = clampRainZoom(zoomForPoint(prefecture, point));
  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    boxZoom: false,
    keyboard: false,
    tap: false,
    zoomSnap: 1,
    zoomDelta: 1,
    fadeAnimation: false,
    zoomAnimation: false,
    markerZoomAnimation: false
  });
  map.createPane("rainPane");
  map.getPane("rainPane").style.zIndex = 450;
  map.getPane("rainPane").style.pointerEvents = "none";

  L.tileLayer(GSI_PALE, {
    maxZoom: 14,
    maxNativeZoom: 18,
    minZoom: 5,
    tileSize: 256,
    detectRetina: false,
    updateWhenZooming: false,
    keepBuffer: 4,
    errorTileUrl: TRANSPARENT,
    className: "gsi-base"
  }).addTo(map);
  map.setView(center, zoom, { animate: false });
  container._leaflet = map;

  let overlay = null;
  let marker = null;
  let overlayUrl = "";

  const refresh = () => {
    map.invalidateSize(false);
    map.setView(map.getCenter(), map.getZoom(), { animate: false });
    if (overlay) overlay.redraw();
  };

  const api = {
    map,
    L,
    setView(nextPref, nextPoint) {
      map.setView(mapCenter(nextPref, nextPoint), clampRainZoom(zoomForPoint(nextPref, nextPoint)), { animate: false });
      api.setMarker(nextPoint);
      refresh();
    },
    setMarker(nextPoint) {
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
      if (!nextPoint) return;
      marker = L.circleMarker([nextPoint.latitude, nextPoint.longitude], {
        radius: 8,
        color: "#0a2f7a",
        weight: 2,
        fillColor: "#ffd166",
        fillOpacity: 0.95
      }).addTo(map);
    },
    setOverlay(urlTemplate) {
      if (!urlTemplate || urlTemplate === overlayUrl) return;
      overlayUrl = urlTemplate;
      if (overlay) {
        overlay.setUrl(urlTemplate);
        overlay.redraw();
        return;
      }
      overlay = L.tileLayer(urlTemplate, {
        pane: "rainPane",
        opacity: 0.82,
        maxZoom: 12,
        maxNativeZoom: 10,
        minZoom: 4,
        minNativeZoom: 5,
        tileSize: 256,
        detectRetina: false,
        updateWhenIdle: false,
        updateWhenZooming: false,
        keepBuffer: 6,
        className: "rain-overlay",
        errorTileUrl: TRANSPARENT
      }).addTo(map);
    },
    invalidate() {
      refresh();
    },
    destroy() {
      map.remove();
    }
  };
  api.setMarker(point);
  requestAnimationFrame(refresh);
  setTimeout(refresh, 120);
  setTimeout(refresh, 400);
  return api;
}

export const MAP_ATTRIBUTION = `${GSI_ATTR} © 国土地理院 ／ 降水ナウキャスト・短時間予報 © 気象庁`;
