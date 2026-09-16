/** 雨・レーダーは1つのコンテンツ。旧4IDは同じ画面へエイリアスする。 */

export const CONTENTS = [
  {
    id: "rain",
    name: "雨・レーダー",
    shortName: "雨",
    family: "rain",
    refreshMs: 60 * 1000,
    description: "雨の予報・雨雲レーダー・今後の雨・降水ナウキャストを1画面で表示します。"
  }
];

const ALIASES = {
  rain: "rain",
  rain_forecast: "rain",
  rain_radar: "rain",
  future_rain: "rain",
  precipitation_nowcast: "rain",
  forecast: "rain",
  radar: "rain",
  raincloud: "rain",
  future: "rain",
  rasrf: "rain",
  nowcast: "rain",
  nowc: "rain"
};

export function getContent(id) {
  const key = ALIASES[String(id || "").toLowerCase()] || String(id || "");
  return CONTENTS.find((item) => item.id === key) || CONTENTS[0];
}

export function canonicalContent(id) {
  return getContent(id).id;
}
