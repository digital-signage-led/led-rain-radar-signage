/** 雨・レーダーカテゴリのコンテンツ定義。URL の content= と一致させる。 */

export const CONTENTS = [
  {
    id: "rain_forecast",
    name: "雨の予報",
    shortName: "予報",
    family: "rain",
    refreshMs: 30 * 60 * 1000,
    description: "気象庁の天気予報から、雨の有無と降水確率を表示します。"
  },
  {
    id: "rain_radar",
    name: "雨雲レーダー",
    shortName: "レーダー",
    family: "rain",
    refreshMs: 5 * 60 * 1000,
    description: "高解像度降水ナウキャストによる現在の雨雲分布です。"
  },
  {
    id: "future_rain",
    name: "今後の雨",
    shortName: "今後",
    family: "rain",
    refreshMs: 10 * 60 * 1000,
    description: "短時間予報で、これから雨がどう変わるかを表示します。"
  },
  {
    id: "precipitation_nowcast",
    name: "降水ナウキャスト",
    shortName: "ナウキャスト",
    family: "rain",
    refreshMs: 5 * 60 * 1000,
    description: "現在と1時間先までの降水強度を比較します。"
  }
];

const ALIASES = {
  rain: "rain_forecast",
  forecast: "rain_forecast",
  radar: "rain_radar",
  raincloud: "rain_radar",
  future: "future_rain",
  rasrf: "future_rain",
  nowcast: "precipitation_nowcast",
  nowc: "precipitation_nowcast"
};

export function getContent(id) {
  const key = ALIASES[String(id || "").toLowerCase()] || String(id || "");
  return CONTENTS.find((item) => item.id === key) || CONTENTS[0];
}

export function canonicalContent(id) {
  return getContent(id).id;
}
