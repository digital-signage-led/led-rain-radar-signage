import assert from "node:assert/strict";
import { CONTENTS, canonicalContent } from "../js/data/contents.js";
import { PREFECTURES, canonicalPrefecture, regionOf } from "../js/data/prefectures.js";
import { OBSERVATION_POINTS, defaultPoint, pointsForPrefecture } from "../js/data/observation-points.js";

assert.equal(PREFECTURES.length, 47);
assert.equal(CONTENTS.length, 4);
assert.deepEqual(CONTENTS.map((c) => c.id), [
  "rain_forecast",
  "rain_radar",
  "future_rain",
  "precipitation_nowcast"
]);
assert.equal(new Set(PREFECTURES.map((p) => p.slug)).size, 47);

for (const pref of PREFECTURES) {
  assert.ok(pref.id && pref.slug && pref.name && pref.region);
  assert.ok(Number.isFinite(pref.centerLatitude));
  assert.ok(Number.isFinite(pref.centerLongitude));
  assert.ok(pref.defaultZoom >= 6 && pref.defaultZoom <= 11);
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
assert.equal(canonicalContent("radar"), "rain_radar");
assert.equal(PREFECTURES.length * CONTENTS.length, 188);

const zooms = Object.fromEntries(PREFECTURES.map((p) => [p.slug, p.defaultZoom]));
assert.ok(zooms.hokkaido < zooms.tokyo, "Hokkaido must be more zoomed out than Tokyo");
assert.ok(zooms.hokkaido < zooms.osaka);
assert.ok(Math.abs(zooms.tokyo - zooms.osaka) < 1);

console.log("catalog ok: 47 prefectures, 4 contents, 188 URLs, observation points filtered");
