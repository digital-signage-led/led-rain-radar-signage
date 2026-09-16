/**
 * 県境のシンプルな白地図 + 気象庁降水タイル。
 * 親要素の CSS transform は Leaflet タイル欠けの原因になるため使わない。
 */

const PREF_GEOJSON = new URL("../../data/japan-prefectures.geojson", import.meta.url).href;
const TRANSPARENT = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const SEA = "#6e9bb8";

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

let prefGeoPromise = null;

function loadPrefGeo() {
  if (!prefGeoPromise) {
    prefGeoPromise = fetch(PREF_GEOJSON)
      .then((res) => {
        if (!res.ok) throw new Error("県境データを読み込めませんでした");
        return res.json();
      })
      .catch((err) => {
        prefGeoPromise = null;
        throw err;
      });
  }
  return prefGeoPromise;
}

function featurePrefId(feature) {
  return String(feature?.properties?.id || "").padStart(2, "0");
}

function fillStyle(feature, currentId, national) {
  const focus = national || featurePrefId(feature) === currentId;
  return {
    stroke: false,
    fillColor: focus ? "#d5d8dc" : "#b4b8be",
    fillOpacity: focus ? 0.96 : 0.7
  };
}

function strokeStyle(feature, currentId, national) {
  const focus = national || featurePrefId(feature) === currentId;
  return {
    fill: false,
    color: focus ? "#3d424a" : "#7a8088",
    weight: national ? 1.4 : (focus ? 3.4 : 1.5),
    opacity: 1,
    lineJoin: "round",
    lineCap: "round"
  };
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

function isRemotePoint(pref, point) {
  if (!point) return false;
  const dLat = Math.abs(point.latitude - pref.centerLatitude);
  const dLng = Math.abs(point.longitude - pref.centerLongitude);
  return dLat > 1.4 || dLng > 1.6;
}

function prefMaxZoom(pref) {
  if (pref?.national) return 6;
  return Math.min(10, Math.round(9.5 + (Number(pref?.zoomBoost) || 0)));
}

function zoomForPoint(pref, point) {
  if (isRemotePoint(pref, point)) return clampRainZoom(Math.max(7, pref.defaultZoom || 8), pref);
  return clampRainZoom(pref.defaultZoom, pref);
}

export function mapCenter(pref, point) {
  if (isRemotePoint(pref, point)) return [point.latitude, point.longitude];
  return [pref.centerLatitude, pref.centerLongitude];
}

function snapRainZoom(zoom) {
  return Math.round((Number(zoom) || 8) * 4) / 4;
}

function clampRainZoom(zoom, pref) {
  return Math.min(prefMaxZoom(pref), Math.max(5, snapRainZoom(zoom)));
}

function prefLatLngBounds(L, pref) {
  const b = pref?.bounds;
  if (!b) return null;
  return L.latLngBounds([b.south, b.west], [b.north, b.east]);
}

function largestRingBounds(L, feature) {
  const geom = feature?.geometry;
  if (!geom) return null;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let best = null;
  let bestArea = -1;
  for (const poly of polys || []) {
    const ring = poly?.[0];
    if (!ring || ring.length < 4) continue;
    let minX = 180;
    let minY = 90;
    let maxX = -180;
    let maxY = -90;
    for (const pt of ring) {
      const x = pt[0];
      const y = pt[1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area > bestArea) {
      bestArea = area;
      best = L.latLngBounds([minY, minX], [maxY, maxX]);
    }
  }
  return best;
}

function featureBoundsForPref(L, fillLayer, pref) {
  if (!fillLayer || !pref) return null;
  if (pref.national) {
    let acc = null;
    fillLayer.eachLayer((layer) => {
      const b = layer.getBounds?.();
      if (!b || !b.isValid()) return;
      acc = acc ? acc.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
    });
    return acc;
  }
  let found = null;
  fillLayer.eachLayer((layer) => {
    if (found || featurePrefId(layer.feature) !== pref.id) return;
    found = largestRingBounds(L, layer.feature);
  });
  return found;
}

function applyPrefView(map, L, pref, point, fillLayer) {
  if (!pref?.national && isRemotePoint(pref, point)) {
    map.setView([point.latitude, point.longitude], clampRainZoom(zoomForPoint(pref, point), pref), { animate: false });
    return;
  }
  const bounds = pref.national
    ? (prefLatLngBounds(L, pref) || featureBoundsForPref(L, fillLayer, pref))
    : (featureBoundsForPref(L, fillLayer, pref) || prefLatLngBounds(L, pref));
  if (bounds) {
    map.fitBounds(bounds, {
      padding: pref.national ? [10, 10] : [6, 6],
      maxZoom: prefMaxZoom(pref),
      animate: false
    });
    map.setZoom(clampRainZoom(map.getZoom(), pref), { animate: false });
    return;
  }
  map.setView(mapCenter(pref, point), clampRainZoom(pref.defaultZoom, pref), { animate: false });
}

export async function createMap(container, { prefecture, point, interactive = false }) {
  const L = await loadLeaflet();
  const prefGeo = await loadPrefGeo().catch(() => null);
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
  let currentPref = prefecture;
  let currentPoint = point;
  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    boxZoom: false,
    keyboard: false,
    tap: false,
    minZoom: 5,
    maxZoom: 10,
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    fadeAnimation: false,
    zoomAnimation: false,
    markerZoomAnimation: false
  });
  map.getContainer().style.background = SEA;
  map.createPane("prefFillPane");
  map.getPane("prefFillPane").style.zIndex = 350;
  map.createPane("rainPane");
  map.getPane("rainPane").style.zIndex = 450;
  map.getPane("rainPane").style.pointerEvents = "none";
  map.createPane("prefStrokePane");
  map.getPane("prefStrokePane").style.zIndex = 460;
  map.getPane("prefStrokePane").style.pointerEvents = "none";

  let fillLayer = null;
  let strokeLayer = null;
  const paintPrefs = () => {
    const currentId = currentPref?.id;
    const national = !!currentPref?.national;
    if (fillLayer) fillLayer.setStyle((feature) => fillStyle(feature, currentId, national));
    if (strokeLayer) {
      strokeLayer.setStyle((feature) => strokeStyle(feature, currentId, national));
      if (!national) {
        strokeLayer.eachLayer((layer) => {
          if (featurePrefId(layer.feature) === currentId) layer.bringToFront();
        });
      }
    }
  };
  if (prefGeo) {
    fillLayer = L.geoJSON(prefGeo, {
      pane: "prefFillPane",
      interactive: false,
      style: (feature) => fillStyle(feature, prefecture.id, !!prefecture.national)
    }).addTo(map);
    strokeLayer = L.geoJSON(prefGeo, {
      pane: "prefStrokePane",
      interactive: false,
      style: (feature) => strokeStyle(feature, prefecture.id, !!prefecture.national)
    }).addTo(map);
  }
  applyPrefView(map, L, prefecture, point, fillLayer);
  container._leaflet = map;

  let overlay = null;
  let incoming = null;
  let marker = null;
  let overlayUrl = "";

  let lastLayout = { w: 0, h: 0 };
  const refresh = () => {
    const box = map.getContainer();
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    if (w < 80 || h < 80) return;
    const sizeChanged = Math.abs(w - lastLayout.w) > 2 || Math.abs(h - lastLayout.h) > 2;
    lastLayout = { w, h };
    if (sizeChanged) {
      map.invalidateSize({ animate: false, pan: false });
      if (currentPref) applyPrefView(map, L, currentPref, currentPoint, fillLayer);
    }
    if (overlay) overlay.redraw();
  };

  const api = {
    map,
    L,
    setView(nextPref, nextPoint) {
      currentPref = nextPref;
      currentPoint = nextPoint;
      paintPrefs();
      applyPrefView(map, L, nextPref, nextPoint, fillLayer);
      api.setMarker(nextPoint);
      refresh();
    },
    setMarker(nextPoint) {
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
      if (currentPref?.national || !nextPoint) return;
      marker = L.circleMarker([nextPoint.latitude, nextPoint.longitude], {
        radius: 8,
        color: "#0a2f7a",
        weight: 2,
        fillColor: "#ffd166",
        fillOpacity: 0.95
      }).addTo(map);
    },
    setOverlay(urlTemplate) {
      if (!urlTemplate) return Promise.resolve();
      if (/\/rasrf\//.test(urlTemplate)) return Promise.resolve();
      if (urlTemplate === overlayUrl && overlay) return Promise.resolve();
      const nativeZoom = 10;
      if (incoming) {
        incoming.cancel();
        incoming = null;
      }
      return new Promise((resolve) => {
        const layer = L.tileLayer(urlTemplate, {
          pane: "rainPane",
          opacity: overlay ? 0 : 0.88,
          maxZoom: 10,
          maxNativeZoom: nativeZoom,
          minZoom: 5,
          minNativeZoom: 5,
          zoomOffset: 0,
          zoomReverse: false,
          tileSize: 256,
          detectRetina: false,
          updateWhenIdle: false,
          updateWhenZooming: false,
          keepBuffer: 6,
          className: "rain-overlay",
          errorTileUrl: TRANSPARENT
        });
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          incoming = null;
          layer.setOpacity(0.88);
          if (overlay && overlay !== layer) {
            try { map.removeLayer(overlay); } catch { /* ignore */ }
          }
          overlay = layer;
          overlayUrl = urlTemplate;
          resolve();
        };
        incoming = {
          cancel() {
            if (done) return;
            done = true;
            try { map.removeLayer(layer); } catch { /* ignore */ }
            resolve();
          }
        };
        layer.once("load", finish);
        layer.addTo(map);
        window.setTimeout(finish, 1100);
      });
    },
    invalidate() {
      refresh();
    },
    destroy() {
      incoming?.cancel();
      map.remove();
    }
  };
  api.setMarker(point);
  requestAnimationFrame(refresh);
  setTimeout(refresh, 120);
  setTimeout(refresh, 400);
  return api;
}

export const MAP_ATTRIBUTION = "都道府県界 ／ 降水ナウキャスト・短時間予報 © 気象庁";
