/**
 * 観測地点マスター。都道府県 slug で絞り込み、関係ない地点は選べない。
 * 座標・気象庁コードは天気予報サイネージの locations.json を再利用。
 */

export const OBSERVATION_POINTS = [
  { id: "japan", name: "全国", prefecture: "japan", latitude: 37.6, longitude: 137.0, jmaOffice: "130000", priority: 1 },
  { id: "wakkanai", name: "稚内", prefecture: "hokkaido", latitude: 45.415, longitude: 141.6783, jmaOffice: "011000", priority: 2 },
  { id: "asahikawa", name: "旭川", prefecture: "hokkaido", latitude: 43.7567, longitude: 142.3717, jmaOffice: "012000", priority: 2 },
  { id: "abashiri", name: "網走", prefecture: "hokkaido", latitude: 44.0167, longitude: 144.2783, jmaOffice: "013000", priority: 2 },
  { id: "kitami", name: "北見", prefecture: "hokkaido", latitude: 43.7767, longitude: 143.8417, jmaOffice: "013000", jmaClass10: "013020", priority: 3 },
  { id: "nemuro", name: "根室", prefecture: "hokkaido", latitude: 43.33, longitude: 145.585, jmaOffice: "014100", jmaClass10: "014010", priority: 3 },
  { id: "kushiro", name: "釧路", prefecture: "hokkaido", latitude: 42.985, longitude: 144.3767, jmaOffice: "014100", priority: 2 },
  { id: "obihiro", name: "帯広", prefecture: "hokkaido", latitude: 42.9217, longitude: 143.2117, jmaOffice: "016000", jmaClass10: "014030", priority: 2 },
  { id: "sapporo", name: "札幌", prefecture: "hokkaido", latitude: 43.06, longitude: 141.3283, jmaOffice: "016000", priority: 1 },
  { id: "otaru", name: "小樽", prefecture: "hokkaido", latitude: 43.1817, longitude: 141.015, jmaOffice: "016000", jmaClass10: "016030", priority: 3 },
  { id: "muroran", name: "室蘭", prefecture: "hokkaido", latitude: 42.3117, longitude: 140.975, jmaOffice: "015000", priority: 2 },
  { id: "hakodate", name: "函館", prefecture: "hokkaido", latitude: 41.8167, longitude: 140.7533, jmaOffice: "017000", priority: 2 },

  { id: "aomori", name: "青森", prefecture: "aomori", latitude: 40.822, longitude: 140.74, jmaOffice: "020000", priority: 1 },
  { id: "hirosaki", name: "弘前", prefecture: "aomori", latitude: 40.6031, longitude: 140.4639, jmaOffice: "020000", priority: 2 },
  { id: "hachinohe", name: "八戸", prefecture: "aomori", latitude: 40.5123, longitude: 141.4883, jmaOffice: "020000", priority: 2 },

  { id: "morioka", name: "盛岡", prefecture: "iwate", latitude: 39.702, longitude: 141.153, jmaOffice: "030000", priority: 1 },
  { id: "miyako-iwate", name: "宮古", prefecture: "iwate", latitude: 39.6413, longitude: 141.9559, jmaOffice: "030000", priority: 2 },
  { id: "ichinoseki", name: "一関", prefecture: "iwate", latitude: 38.9347, longitude: 141.1267, jmaOffice: "030000", priority: 3 },

  { id: "sendai", name: "仙台", prefecture: "miyagi", latitude: 38.2682, longitude: 140.8694, jmaOffice: "040000", priority: 1 },
  { id: "ishinomaki", name: "石巻", prefecture: "miyagi", latitude: 38.4345, longitude: 141.3029, jmaOffice: "040000", priority: 2 },

  { id: "akita", name: "秋田", prefecture: "akita", latitude: 39.72, longitude: 140.103, jmaOffice: "050000", priority: 1 },
  { id: "yokote", name: "横手", prefecture: "akita", latitude: 39.3106, longitude: 140.5664, jmaOffice: "050000", priority: 2 },

  { id: "yamagata", name: "山形", prefecture: "yamagata", latitude: 38.241, longitude: 140.364, jmaOffice: "060000", priority: 1 },
  { id: "sakata", name: "酒田", prefecture: "yamagata", latitude: 38.9144, longitude: 139.8364, jmaOffice: "060000", priority: 2 },

  { id: "fukushima", name: "福島", prefecture: "fukushima", latitude: 37.75, longitude: 140.468, jmaOffice: "070000", priority: 1 },
  { id: "aizuwakamatsu", name: "会津若松", prefecture: "fukushima", latitude: 37.4949, longitude: 139.9298, jmaOffice: "070000", priority: 2 },
  { id: "iwaki", name: "いわき", prefecture: "fukushima", latitude: 37.0504, longitude: 140.8877, jmaOffice: "070000", priority: 2 },

  { id: "mito", name: "水戸", prefecture: "ibaraki", latitude: 36.342, longitude: 140.447, jmaOffice: "080000", priority: 1 },
  { id: "tsukuba", name: "つくば", prefecture: "ibaraki", latitude: 36.0835, longitude: 140.0764, jmaOffice: "080000", priority: 2 },

  { id: "utsunomiya", name: "宇都宮", prefecture: "tochigi", latitude: 36.566, longitude: 139.883, jmaOffice: "090000", priority: 1 },
  { id: "nikko", name: "日光", prefecture: "tochigi", latitude: 36.7198, longitude: 139.6982, jmaOffice: "090000", priority: 2 },

  { id: "maebashi", name: "前橋", prefecture: "gunma", latitude: 36.391, longitude: 139.061, jmaOffice: "100000", priority: 1 },
  { id: "takasaki", name: "高崎", prefecture: "gunma", latitude: 36.3219, longitude: 139.0033, jmaOffice: "100000", priority: 2 },

  { id: "saitama", name: "さいたま", prefecture: "saitama", latitude: 35.862, longitude: 139.649, jmaOffice: "110000", priority: 1 },
  { id: "kumagaya", name: "熊谷", prefecture: "saitama", latitude: 36.1473, longitude: 139.3886, jmaOffice: "110000", priority: 2 },

  { id: "chiba", name: "千葉", prefecture: "chiba", latitude: 35.605, longitude: 140.123, jmaOffice: "120000", priority: 1 },
  { id: "choshi", name: "銚子", prefecture: "chiba", latitude: 35.7346, longitude: 140.8268, jmaOffice: "120000", priority: 2 },
  { id: "tateyama", name: "館山", prefecture: "chiba", latitude: 34.9965, longitude: 139.87, jmaOffice: "120000", priority: 3 },

  { id: "tokyo", name: "東京", prefecture: "tokyo", latitude: 35.6812, longitude: 139.7671, jmaOffice: "130000", priority: 1 },
  { id: "hachioji", name: "八王子", prefecture: "tokyo", latitude: 35.6559, longitude: 139.3239, jmaOffice: "130000", priority: 2 },
  { id: "ome", name: "青梅", prefecture: "tokyo", latitude: 35.7879, longitude: 139.2758, jmaOffice: "130000", priority: 3 },

  { id: "yokohama", name: "横浜", prefecture: "kanagawa", latitude: 35.444, longitude: 139.638, jmaOffice: "140000", priority: 1 },
  { id: "odawara", name: "小田原", prefecture: "kanagawa", latitude: 35.2646, longitude: 139.1522, jmaOffice: "140000", priority: 2 },

  { id: "niigata", name: "新潟", prefecture: "niigata", latitude: 37.9161, longitude: 139.0364, jmaOffice: "150000", priority: 1 },
  { id: "nagaoka", name: "長岡", prefecture: "niigata", latitude: 37.4462, longitude: 138.8513, jmaOffice: "150000", priority: 2 },
  { id: "sado", name: "佐渡", prefecture: "niigata", latitude: 38.018, longitude: 138.368, jmaOffice: "150000", priority: 3 },

  { id: "toyama", name: "富山", prefecture: "toyama", latitude: 36.696, longitude: 137.213, jmaOffice: "160000", priority: 1 },
  { id: "kanazawa", name: "金沢", prefecture: "ishikawa", latitude: 36.5613, longitude: 136.6562, jmaOffice: "170000", priority: 1 },
  { id: "wajima", name: "輪島", prefecture: "ishikawa", latitude: 37.3906, longitude: 136.8992, jmaOffice: "170000", priority: 2 },
  { id: "fukui", name: "福井", prefecture: "fukui", latitude: 36.065, longitude: 136.222, jmaOffice: "180000", priority: 1 },

  { id: "kofu", name: "甲府", prefecture: "yamanashi", latitude: 35.664, longitude: 138.568, jmaOffice: "190000", priority: 1 },
  { id: "kawaguchiko", name: "河口湖", prefecture: "yamanashi", latitude: 35.4972, longitude: 138.7633, jmaOffice: "190000", priority: 2 },

  { id: "nagano", name: "長野", prefecture: "nagano", latitude: 36.649, longitude: 138.181, jmaOffice: "200000", priority: 1 },
  { id: "matsumoto", name: "松本", prefecture: "nagano", latitude: 36.238, longitude: 137.972, jmaOffice: "200000", priority: 2 },
  { id: "iida", name: "飯田", prefecture: "nagano", latitude: 35.5148, longitude: 137.8218, jmaOffice: "200000", priority: 3 },

  { id: "gifu", name: "岐阜", prefecture: "gifu", latitude: 35.423, longitude: 136.723, jmaOffice: "210000", priority: 1 },
  { id: "takayama", name: "高山", prefecture: "gifu", latitude: 36.146, longitude: 137.252, jmaOffice: "210000", priority: 2 },

  { id: "shizuoka", name: "静岡", prefecture: "shizuoka", latitude: 34.977, longitude: 138.383, jmaOffice: "220000", priority: 1 },
  { id: "hamamatsu", name: "浜松", prefecture: "shizuoka", latitude: 34.7108, longitude: 137.7261, jmaOffice: "220000", priority: 2 },
  { id: "mishima", name: "三島", prefecture: "shizuoka", latitude: 35.1185, longitude: 138.9185, jmaOffice: "220000", priority: 3 },

  { id: "nagoya", name: "名古屋", prefecture: "aichi", latitude: 35.1815, longitude: 136.9066, jmaOffice: "230000", priority: 1 },
  { id: "toyohashi", name: "豊橋", prefecture: "aichi", latitude: 34.7692, longitude: 137.3915, jmaOffice: "230000", priority: 2 },

  { id: "tsu", name: "津", prefecture: "mie", latitude: 34.73, longitude: 136.509, jmaOffice: "240000", priority: 1 },
  { id: "yokkaichi", name: "四日市", prefecture: "mie", latitude: 34.9652, longitude: 136.6245, jmaOffice: "240000", priority: 2 },

  { id: "otsu", name: "大津", prefecture: "shiga", latitude: 35.004, longitude: 135.868, jmaOffice: "250000", priority: 1 },
  { id: "hikone", name: "彦根", prefecture: "shiga", latitude: 35.2744, longitude: 136.2597, jmaOffice: "250000", priority: 2 },

  { id: "kyoto", name: "京都", prefecture: "kyoto", latitude: 35.012, longitude: 135.768, jmaOffice: "260000", priority: 1 },
  { id: "maizuru", name: "舞鶴", prefecture: "kyoto", latitude: 35.4747, longitude: 135.3859, jmaOffice: "260000", priority: 2 },

  { id: "osaka", name: "大阪", prefecture: "osaka", latitude: 34.6937, longitude: 135.5023, jmaOffice: "270000", priority: 1 },
  { id: "kansai-airport", name: "関空島", prefecture: "osaka", latitude: 34.4356, longitude: 135.2441, jmaOffice: "270000", priority: 2 },

  { id: "kobe", name: "神戸", prefecture: "hyogo", latitude: 34.69, longitude: 135.195, jmaOffice: "280000", priority: 1 },
  { id: "himeji", name: "姫路", prefecture: "hyogo", latitude: 34.8154, longitude: 134.6853, jmaOffice: "280000", priority: 2 },
  { id: "toyooka", name: "豊岡", prefecture: "hyogo", latitude: 35.5445, longitude: 134.8203, jmaOffice: "280000", priority: 3 },

  { id: "nara", name: "奈良", prefecture: "nara", latitude: 34.685, longitude: 135.805, jmaOffice: "290000", priority: 1 },
  { id: "wakayama", name: "和歌山", prefecture: "wakayama", latitude: 34.226, longitude: 135.17, jmaOffice: "300000", priority: 1 },
  { id: "shingu", name: "新宮", prefecture: "wakayama", latitude: 33.7247, longitude: 135.9926, jmaOffice: "300000", priority: 2 },

  { id: "tottori", name: "鳥取", prefecture: "tottori", latitude: 35.501, longitude: 134.238, jmaOffice: "310000", priority: 1 },
  { id: "yonago", name: "米子", prefecture: "tottori", latitude: 35.4281, longitude: 133.3308, jmaOffice: "310000", priority: 2 },

  { id: "matsue", name: "松江", prefecture: "shimane", latitude: 35.472, longitude: 133.048, jmaOffice: "320000", priority: 1 },
  { id: "hamada", name: "浜田", prefecture: "shimane", latitude: 34.8992, longitude: 132.0798, jmaOffice: "320000", priority: 2 },

  { id: "okayama", name: "岡山", prefecture: "okayama", latitude: 34.655, longitude: 133.935, jmaOffice: "330000", priority: 1 },
  { id: "kurashiki", name: "倉敷", prefecture: "okayama", latitude: 34.585, longitude: 133.772, jmaOffice: "330000", priority: 2 },

  { id: "hiroshima", name: "広島", prefecture: "hiroshima", latitude: 34.3853, longitude: 132.4553, jmaOffice: "340000", priority: 1 },
  { id: "fukuyama", name: "福山", prefecture: "hiroshima", latitude: 34.4859, longitude: 133.3623, jmaOffice: "340000", priority: 2 },

  { id: "yamaguchi", name: "山口", prefecture: "yamaguchi", latitude: 34.186, longitude: 131.471, jmaOffice: "350000", priority: 1 },
  { id: "shimonoseki", name: "下関", prefecture: "yamaguchi", latitude: 33.9578, longitude: 130.9415, jmaOffice: "350000", priority: 2 },

  { id: "tokushima", name: "徳島", prefecture: "tokushima", latitude: 34.07, longitude: 134.559, jmaOffice: "360000", priority: 1 },
  { id: "takamatsu", name: "高松", prefecture: "kagawa", latitude: 34.343, longitude: 134.047, jmaOffice: "370000", priority: 1 },
  { id: "matsuyama", name: "松山", prefecture: "ehime", latitude: 33.839, longitude: 132.766, jmaOffice: "380000", priority: 1 },
  { id: "uwajima", name: "宇和島", prefecture: "ehime", latitude: 33.2233, longitude: 132.5606, jmaOffice: "380000", priority: 2 },
  { id: "kochi", name: "高知", prefecture: "kochi", latitude: 33.5597, longitude: 133.5311, jmaOffice: "390000", priority: 1 },
  { id: "sukumo", name: "宿毛", prefecture: "kochi", latitude: 32.9389, longitude: 132.7261, jmaOffice: "390000", priority: 2 },

  { id: "fukuoka", name: "福岡", prefecture: "fukuoka", latitude: 33.5904, longitude: 130.4017, jmaOffice: "400000", priority: 1 },
  { id: "kitakyushu", name: "北九州", prefecture: "fukuoka", latitude: 33.8834, longitude: 130.8752, jmaOffice: "400000", priority: 2 },
  { id: "kurume", name: "久留米", prefecture: "fukuoka", latitude: 33.3192, longitude: 130.5084, jmaOffice: "400000", priority: 3 },

  { id: "saga", name: "佐賀", prefecture: "saga", latitude: 33.249, longitude: 130.299, jmaOffice: "410000", priority: 1 },
  { id: "nagasaki", name: "長崎", prefecture: "nagasaki", latitude: 32.75, longitude: 129.874, jmaOffice: "420000", priority: 1 },
  { id: "sasebo", name: "佐世保", prefecture: "nagasaki", latitude: 33.1799, longitude: 129.7151, jmaOffice: "420000", priority: 2 },
  { id: "kumamoto", name: "熊本", prefecture: "kumamoto", latitude: 32.79, longitude: 130.742, jmaOffice: "430000", priority: 1 },
  { id: "yatsushiro", name: "八代", prefecture: "kumamoto", latitude: 32.5074, longitude: 130.6018, jmaOffice: "430000", priority: 2 },
  { id: "oita", name: "大分", prefecture: "oita", latitude: 33.238, longitude: 131.613, jmaOffice: "440000", priority: 1 },
  { id: "beppu", name: "別府", prefecture: "oita", latitude: 33.2846, longitude: 131.4913, jmaOffice: "440000", priority: 2 },
  { id: "miyazaki", name: "宮崎", prefecture: "miyazaki", latitude: 31.911, longitude: 131.424, jmaOffice: "450000", priority: 1 },
  { id: "nobeoka", name: "延岡", prefecture: "miyazaki", latitude: 32.5823, longitude: 131.6651, jmaOffice: "450000", priority: 2 },
  { id: "kagoshima", name: "鹿児島", prefecture: "kagoshima", latitude: 31.5966, longitude: 130.5571, jmaOffice: "460100", priority: 1 },
  { id: "naze", name: "名瀬", prefecture: "kagoshima", latitude: 28.3772, longitude: 129.4937, jmaOffice: "460040", priority: 3 },

  { id: "nago", name: "名護", prefecture: "okinawa", latitude: 26.592, longitude: 127.978, jmaOffice: "471000", priority: 2 },
  { id: "naha", name: "那覇", prefecture: "okinawa", latitude: 26.2124, longitude: 127.6792, jmaOffice: "471000", priority: 1 },
  { id: "miyako", name: "宮古", prefecture: "okinawa", latitude: 24.805, longitude: 125.281, jmaOffice: "474000", priority: 2 },
  { id: "ishigaki", name: "石垣", prefecture: "okinawa", latitude: 24.344, longitude: 124.157, jmaOffice: "476000", priority: 2 }
];

export function pointsForPrefecture(slug) {
  return OBSERVATION_POINTS
    .filter((item) => item.prefecture === slug)
    .slice()
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, "ja"));
}

export function getPoint(id, prefectureSlug) {
  const list = prefectureSlug ? pointsForPrefecture(prefectureSlug) : OBSERVATION_POINTS;
  return list.find((item) => item.id === id) || list[0] || null;
}

export function defaultPoint(prefectureSlug) {
  const list = pointsForPrefecture(prefectureSlug);
  return list.find((item) => item.priority === 1) || list[0] || null;
}

export function comboKey(prefectureSlug, contentId) {
  return `${prefectureSlug}:${contentId}`;
}
