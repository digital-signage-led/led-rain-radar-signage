/**
 * 地理院タイル + 気象庁降水タイル。
 * 天気予報サイネージの地図データ方針（国土地理院）を踏襲し、
 * 雨雲表示は既存雨レーダーと同じ JMA jmatile を使う。
 */

const GSI_PALE = "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png";
const GSI_ATTR = "地理院タイル";

let leafletPromise = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("../../vendor/leaflet/leaflet.css", import.meta.url).href;
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = new URL("../../vendor/leaflet/leaflet.js", import.meta.url).href;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet を読み込めませんでした"));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function zoomForPoint(pref, point) {
  if (!point) return pref.defaultZoom;
  const dLat = Math.abs(point.latitude - pref.centerLatitude);
  const dLng = Math.abs(point.longitude - pref.centerLongitude);
  if (dLat > 1.4 || dLng > 1.6) return Math.min(10.2, Math.max(8.6, pref.defaultZoom + 1.4));
  return pref.defaultZoom;
}

export function mapCenter(pref, point) {
  if (!point) return [pref.centerLatitude, pref.centerLongitude];
  const dLat = Math.abs(point.latitude - pref.centerLatitude);
  const dLng = Math.abs(point.longitude - pref.centerLongitude);
  if (dLat > 1.4 || dLng > 1.6) return [point.latitude, point.longitude];
  return [pref.centerLatitude, pref.centerLongitude];
}

export async function createMap(container, { prefecture, point, interactive = false }) {
  const L = await loadLeaflet();
  if (container._leaflet_id) {
    container._leaflet_id = null;
    container.innerHTML = "";
  }
  const center = mapCenter(prefecture, point);
  const zoom = Math.round(zoomForPoint(prefecture, point));
  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    boxZoom: false,
    keyboard: false,
    tap: false,
    zoomSnap: 0.5,
    zoomDelta: 0.5
  });
  L.tileLayer(GSI_PALE, {
    maxZoom: 14,
    minZoom: 5,
    opacity: 1
  }).addTo(map);
  map.setView(center, zoom, { animate: false });
  let overlay = null;
  let marker = null;

  const api = {
    map,
    L,
    setView(nextPref, nextPoint) {
      map.setView(mapCenter(nextPref, nextPoint), zoomForPoint(nextPref, nextPoint), { animate: false });
      api.setMarker(nextPoint);
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
      if (!urlTemplate) return;
      const next = L.tileLayer(urlTemplate, {
        opacity: 0.72,
        maxZoom: 12,
        minZoom: 5,
        className: "rain-overlay"
      });
      next.addTo(map);
      if (overlay) {
        const prev = overlay;
        setTimeout(() => {
          map.removeLayer(prev);
        }, 280);
      }
      overlay = next;
    },
    invalidate() {
      map.invalidateSize(false);
    },
    destroy() {
      map.remove();
    }
  };
  api.setMarker(point);
  requestAnimationFrame(() => api.invalidate());
  return api;
}

export const MAP_ATTRIBUTION = `${GSI_ATTR} © 国土地理院 ／ 降水ナウキャスト・短時間予報 © 気象庁`;
