import { getContent } from "./data/contents.js";
import { getPrefecture } from "./data/prefectures.js";
import { applyVisibility, mountSignage, refreshDelayFor } from "./signage-view.js";
import { settingsForPreview } from "./store.js";
import { applyDesignTokens } from "./viewport.js";

const params = new URLSearchParams(location.search);
const prefecture = getPrefecture(params.get("prefecture") || params.get("pref") || "tokyo");
const content = getContent(params.get("content") || "rain");
const pointId = params.get("point") || "";
const isPreview = params.get("preview") === "1";
const isEmbed = params.get("embed") === "1" || isPreview || window.self !== window.top;

document.title = `${prefecture.name}｜${content.name}`;
document.documentElement.classList.remove("is-boot");

function installStageFrame() {
  const url = new URL(location.href);
  url.searchParams.set("embed", "1");
  const frame = document.createElement("iframe");
  frame.id = "stage-frame";
  frame.title = document.title;
  frame.src = url.href;
  frame.setAttribute("scrolling", "no");
  document.body.replaceChildren(frame);
  const fit = () => {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const ox = (window.innerWidth - 1920 * scale) / 2;
    const oy = (window.innerHeight - 1080 * scale) / 2;
    frame.style.cssText = [
      "position:absolute",
      "left:0",
      "top:0",
      "width:1920px",
      "height:1080px",
      "border:0",
      "transform-origin:0 0",
      `transform:translate(${ox}px,${oy}px) scale(${scale})`
    ].join(";");
  };
  fit();
  window.addEventListener("resize", fit);
}

if (!isEmbed) {
  installStageFrame();
} else {
  const root = document.getElementById("app");
  let session = null;

  async function render(quiet = false) {
    if (quiet && session?.refresh) {
      await session.refresh();
      return;
    }
    if (session) session.destroy();
    session = await mountSignage(root, {
      prefecture: prefecture.slug,
      content: content.id,
      pointId,
      settings: isPreview ? settingsForPreview(prefecture.slug, content.id) : undefined,
      fit: false
    });
    session.map?.invalidate();
    window.setTimeout(() => session.map?.invalidate(), 240);
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type !== "rain-preview-design" || !session?.els) return;
    const common = event.data.common || {};
    applyDesignTokens(session.els.screen, { common });
    applyVisibility(session.els, common);
  });

  await render();

  function schedule() {
    if (isPreview) return;
    const delay = refreshDelayFor(content.id);
    window.setTimeout(async () => {
      await render(true);
      schedule();
    }, delay);
  }
  schedule();
}
