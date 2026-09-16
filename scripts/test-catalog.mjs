import assert from "node:assert/strict";
import { CONTENTS, canonicalContent } from "../js/data/contents.js";
import { PREFECTURES, canonicalPrefecture, regionOf } from "../js/data/prefectures.js";
import { OBSERVATION_POINTS, defaultPoint, pointsForPrefecture } from "../js/data/observation-points.js";

const prefs = PREFECTURES.filter((p) => !p.national);
assert.equal(prefs.length, 47);
assert.equal(PREFECTURES.length, 48);
assert.equal(PREFECTURES.filter((p) => p.national).length, 1);
assert.equal(canonicalPrefecture("zenkoku"), "japan");
assert.equal(CONTENTS.length, 1);
assert.equal(CONTENTS[0].id, "rain");
assert.equal(CONTENTS[0].name, "雨・レーダー");
assert.equal(canonicalContent("rain_forecast"), "rain");
assert.equal(canonicalContent("rain_radar"), "rain");
assert.equal(canonicalContent("future_rain"), "rain");
assert.equal(canonicalContent("precipitation_nowcast"), "rain");
assert.equal(canonicalContent("radar"), "rain");
assert.equal(new Set(PREFECTURES.map((p) => p.slug)).size, 48);

for (const pref of PREFECTURES) {
  assert.ok(pref.id && pref.slug && pref.name && pref.region);
  assert.ok(Number.isFinite(pref.centerLatitude));
  assert.ok(Number.isFinite(pref.centerLongitude));
  assert.ok(Number.isInteger(pref.defaultZoom));
  assert.ok(pref.defaultZoom >= 5 && pref.defaultZoom <= 10);
  assert.ok(pref.dataId);
  const points = pointsForPrefecture(pref.slug);
  assert.ok(points.length >= 1, `${pref.slug} has no observation points`);
  assert.ok(defaultPoint(pref.slug), `${pref.slug} missing default point`);
  assert.ok(regionOf(pref.slug).id === pref.region);
}

for (const point of OBSERVATION_POINTS) {
  assert.ok(PREFECTURES.some((pref) => pref.slug === point.prefecture), `${point.id} bad prefecture`);
  assert.ok(Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
}

assert.equal(canonicalPrefecture("IWATE"), "iwate");
assert.equal(PREFECTURES.length * CONTENTS.length, 48);

const zooms = Object.fromEntries(PREFECTURES.map((p) => [p.slug, p.defaultZoom]));
assert.ok(zooms.japan <= zooms.hokkaido, "Nationwide must not be closer than Hokkaido");
assert.ok(zooms.hokkaido < zooms.tokyo, "Hokkaido must be more zoomed out than Tokyo");
assert.ok(zooms.hokkaido < zooms.osaka);

console.log("catalog ok: nationwide + 47 prefectures, 1 combined rain content");
