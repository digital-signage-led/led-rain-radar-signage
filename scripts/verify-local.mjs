import assert from "node:assert/strict";

const origin = process.env.VERIFY_ORIGIN || "http://127.0.0.1:5174";
const prefs = ["hokkaido", "iwate", "tokyo", "osaka", "fukuoka", "okinawa"];
const contents = ["rain_forecast", "rain_radar", "future_rain", "precipitation_nowcast"];
const offices = {
  hokkaido: "016000",
  iwate: "030000",
  tokyo: "130000",
  osaka: "270000",
  fukuoka: "400000",
  okinawa: "471000"
};

async function get(url) {
  const res = await fetch(url, { cache: "no-store" });
  return { url, status: res.status, text: await res.text() };
}

const pages = [];
for (const pref of prefs) {
  for (const content of contents) {
    pages.push(`${origin}/index.html?prefecture=${pref}&content=${content}`);
  }
}

const staticFiles = [
  `${origin}/index.html`,
  `${origin}/admin.html`,
  `${origin}/css/signage.css`,
  `${origin}/css/admin.css`,
  `${origin}/js/app.js`,
  `${origin}/js/admin.js`,
  `${origin}/js/signage-view.js`,
  `${origin}/vendor/leaflet/leaflet.js`,
  `${origin}/vendor/leaflet/leaflet.css`
];

const results = [];
for (const url of [...staticFiles, ...pages]) {
  const hit = await get(url);
  results.push(hit);
  assert.equal(hit.status, 200, url);
  if (url.includes("index.html")) {
    assert.match(hit.text, /js\/app\.js/);
    assert.doesNotMatch(hit.text, /Coming Soon|準備中|今後実装/);
  }
  if (url.includes("admin.html")) {
    assert.match(hit.text, /雨の予報/);
    assert.match(hit.text, /雨雲レーダー/);
    assert.match(hit.text, /今後の雨/);
    assert.match(hit.text, /降水ナウキャスト/);
    assert.match(hit.text, /公開URL一覧/);
  }
}

const jma = [];
for (const pref of prefs) {
  const url = `https://www.jma.go.jp/bosai/forecast/data/forecast/${offices[pref]}.json`;
  const res = await fetch(url, { cache: "no-store" });
  jma.push({ pref, status: res.status });
  assert.equal(res.status, 200, url);
  const json = await res.json();
  assert.ok(json[0]?.reportDatetime, `${pref} missing reportDatetime`);
}

const tiles = await Promise.all([
  fetch("https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json", { cache: "no-store" }),
  fetch("https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N2.json", { cache: "no-store" }),
  fetch("https://www.jma.go.jp/bosai/jmatile/data/rasrf/targetTimes.json", { cache: "no-store" })
]);
for (const res of tiles) assert.equal(res.status, 200);
const n1 = await tiles[0].json();
assert.ok(Array.isArray(n1) && n1.length > 0, "nowcast frames empty");

console.log(JSON.stringify({
  pages: pages.length,
  staticOk: staticFiles.length,
  jma,
  nowcFrames: n1.length,
  origin
}, null, 2));
