import { loadTileSet } from "./jma-tiles.js";

export function fetchRadar(options) {
  return loadTileSet("rain_radar", {
    prefecture: options.prefecture,
    pointId: options.pointId,
    pastMinutes: options.pastMinutes ?? 60
  });
}
