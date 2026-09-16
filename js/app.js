import { getContent } from "./data/contents.js";
import { getPrefecture } from "./data/prefectures.js";
import { bindAutoFit, mountSignage, refreshDelayFor } from "./signage-view.js";

const params = new URLSearchParams(location.search);
const prefecture = getPrefecture(params.get("prefecture") || params.get("pref") || "tokyo");
const content = getContent(params.get("content") || "rain_forecast");
const pointId = params.get("point") || "";

document.title = `${prefecture.name}｜${content.name}`;
document.documentElement.classList.remove("is-boot");

const root = document.getElementById("app");
let session = null;
let fitOff = null;

async function render() {
  if (session) session.destroy();
  session = await mountSignage(root, {
    prefecture: prefecture.slug,
    content: content.id,
    pointId
  });
  if (fitOff) fitOff();
  fitOff = bindAutoFit(session.els.screen);
  session.map?.invalidate();
  window.setTimeout(() => session.map?.invalidate(), 200);
}

await render();

function schedule() {
  const delay = refreshDelayFor(content.id);
  window.setTimeout(async () => {
    await render();
    schedule();
  }, delay);
}
schedule();
