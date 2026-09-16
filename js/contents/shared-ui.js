import { formatClock, formatStamp } from "../services/jma-common.js";

export const INTENSITY_STEPS = [
  { color: "#f2f2ff", label: "1" },
  { color: "#a0d2ff", label: "5" },
  { color: "#4196ff", label: "10" },
  { color: "#3ddb4a", label: "20" },
  { color: "#f8f200", label: "30" },
  { color: "#ff9600", label: "50" },
  { color: "#ff2800", label: "80" },
  { color: "#c800c8", label: "80+" }
];

export function intensityLegend() {
  return INTENSITY_STEPS.map((step) => (
    `<span class="legend-step"><i style="background:${step.color}"></i>${step.label}</span>`
  )).join("");
}

export function popCell(value) {
  if (value == null) return "—";
  return `${value}<small>%</small>`;
}

export function popTone(value) {
  if (value == null) return "is-empty";
  if (value >= 70) return "is-high";
  if (value >= 40) return "is-mid";
  return "is-low";
}

export function timesBlock({ dataUpdatedAt, displayUpdatedAt, fromCache }) {
  return `
    <div class="time-grid">
      <div>
        <span class="k">データ更新</span>
        <strong>${formatStamp(dataUpdatedAt)}</strong>
      </div>
      <div>
        <span class="k">画面更新</span>
        <strong>${formatClock(displayUpdatedAt)}</strong>
      </div>
      ${fromCache ? `<div class="cache-note">前回取得データを表示</div>` : ""}
    </div>
  `;
}

export function errorPanel(message) {
  return `<div class="data-error">${message || "気象データを取得できませんでした"}</div>`;
}

export function playController({ frames, playMs, onFrame, holdMs = 2400 }) {
  let index = 0;
  let timer = 0;
  let stopped = false;

  const step = () => {
    if (stopped || !frames.length) return;
    onFrame(frames[index], index, frames.length);
    const frame = frames[index];
    const isLast = index === frames.length - 1;
    const delay = isLast ? holdMs : (playMs || 1800);
    index = (index + 1) % frames.length;
    timer = window.setTimeout(step, Math.max(1200, delay));
    return frame;
  };

  step();
  return {
    stop() {
      stopped = true;
      window.clearTimeout(timer);
    },
    setFrames(next) {
      frames = next;
      index = 0;
    }
  };
}
