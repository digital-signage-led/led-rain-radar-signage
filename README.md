# 雨・レーダー サイネージ

47都道府県で使えるデジタルサイネージ用「雨・レーダー」カテゴリです。

## コンテンツ

- 雨の予報 `rain_forecast`
- 雨雲レーダー `rain_radar`
- 今後の雨 `future_rain`
- 降水ナウキャスト `precipitation_nowcast`

## 公開URL

共通テンプレートは `index.html` のみです。都道府県とコンテンツはURLパラメータで切り替えます。

```
index.html?prefecture=iwate&content=rain_forecast
index.html?prefecture=iwate&content=rain_radar
index.html?prefecture=iwate&content=future_rain
index.html?prefecture=iwate&content=precipitation_nowcast
```

188通り（47 × 4）を同じ画面で表示します。

## 管理画面

`admin.html`

都道府県 → コンテンツ → 観測地点の順で選び、プレビュー、下書き保存、公開ができます。

## 解像度

1920×1080 固定デザイン（天気予報サイネージと同じ）。

## データ

- 天気予報・降水確率：気象庁 `bosai/forecast`
- 雨雲・ナウキャスト：気象庁 高解像度降水ナウキャスト `hrpns`
- 今後の雨：気象庁 降水短時間予報 `rasrf`
- 地図：国土地理院 淡色地図タイル

## ローカル

```
npm start
```

- サイネージ http://127.0.0.1:5174/
- 管理画面 http://127.0.0.1:5174/admin.html
