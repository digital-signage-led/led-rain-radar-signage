import { loadTileSet } from "./jma-tiles.js";

export function fetchFutureRain(options) {
  return loadTileSet("future_rain", {
    prefecture: options.prefecture,
    pointId: options.pointId,
    futureMinutes: options.futureMinutes ?? 180
  });
}
