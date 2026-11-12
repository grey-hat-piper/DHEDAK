import { SCENES } from "./scenes.js";
import { clamp } from "./kit.js";

export function initPillars({ reduced }) {
  const panels = [...document.querySelectorAll("[data-pillar]")];
  for (const panel of panels) {
    const scene = SCENES[panel.dataset.pillar];
    const canvas = panel.querySelector("canvas");
    if (!scene || !canvas) continue;
    try { scene(canvas, panel, { reduced }); } catch (err) { console.warn(`[dhedak] scene ${panel.dataset.pillar} failed`, err); }
    // cursor spotlight on the copy side
    panel.addEventListener("pointermove", (e) => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${e.clientX - r.left}px`);
      panel.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  // Stacking: as the next panel slides over a pinned one, the pinned one recedes a little.
  if (reduced) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    if (window.innerWidth <= 820) { panels.forEach((p) => p.style.setProperty("--cover", "0")); return; }
    panels.forEach((p, i) => {
      const next = panels[i + 1];
      if (!next) return;
      const a = p.getBoundingClientRect(), b = next.getBoundingClientRect();
      const full = a.height + 40, dist = b.top - a.top;
      p.style.setProperty("--cover", clamp((full - dist) / (full - 18)).toFixed(3));
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}
