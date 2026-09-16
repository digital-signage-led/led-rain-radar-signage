import assert from "node:assert/strict";

const origin = process.env.VERIFY_ORIGIN || "https://digital-signage-led.github.io/led-rain-radar-signage";
const prefs = ["hokkaido", "iwate", "tokyo", "osaka", "fukuoka", "okinawa"];
const contents = ["rain_forecast", "rain_radar", "future_rain", "precipitation_nowcast"];

async function get(url) {
  const res = await fetch(url, { cache: "no-store" });
  return { url, status: res.status, type: res.headers.get("content-type") || "", text: await res.text() };
}

const checks = [
  `${origin}/`,
  `${origin}/index.html`,
  `${origin}/admin.html`,
  `${origin}/css/signage.css`,
  `${origin}/js/app.js`,
  `${origin}/js/data/prefectures.js`,
  `${origin}/vendor/leaflet/leaflet.js`,
  `${origin}/missing-file-should-404.html`
];

for (const pref of prefs) {
  for (const content of contents) {
    checks.splice(-1, 0, `${origin}/index.html?prefecture=${pref}&content=${content}`);
  }
}

const report = [];
for (const url of checks) {
  const hit = await get(url);
  report.push({ url, status: hit.status, bytes: hit.text.length });
  if (url.endsWith("missing-file-should-404.html")) {
    assert.equal(hit.status, 404, url);
    continue;
  }
  assert.equal(hit.status, 200, url);
  if (url.includes("index.html") || url.endsWith("/")) {
    assert.match(hit.text, /js\/app\.js/);
    assert.doesNotMatch(hit.text, /Coming Soon|準備中|今後実装/);
  }
}

const admin = await get(`${origin}/admin.html`);
assert.match(admin.text, /雨の予報/);
assert.match(admin.text, /雨雲レーダー/);
assert.match(admin.text, /今後の雨/);
assert.match(admin.text, /降水ナウキャスト/);

console.log(JSON.stringify({ origin, pages: 24, reportCount: report.length, ok: true }, null, 2));
