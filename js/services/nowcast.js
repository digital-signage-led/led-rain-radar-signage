import { loadTileSet } from "./jma-tiles.js";

export function fetchNowcast(options) {
  return loadTileSet("precipitation_nowcast", {
    prefecture: options.prefecture,
    pointId: options.pointId,
    horizonMinutes: options.horizonMinutes ?? 60
  });
}
