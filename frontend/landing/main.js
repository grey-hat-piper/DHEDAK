document.documentElement.classList.add("js"); // gates reveal animations so content stays visible without JS
import "./landing.css";
import { initEffects } from "./effects.js";
import { createHelix } from "./helix.js";
import { initScroll } from "./scroll.js";
import { initPillars } from "./pillars.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Each feature initialises independently so one failure never takes down the page.
const safe = (name, fn) => { try { return fn(); } catch (err) { console.warn(`[dhedak] ${name} failed`, err); } };

safe("effects", () => initEffects({ reduced }));
const helix = safe("helix", () => createHelix(document.getElementById("helix"), { reduced }));
const aboutHelix = safe("about helix", () => createHelix(document.querySelector("[data-about-helix]"), {
  reduced, follow: false, marks: [0.125, 0.375, 0.625, 0.875],
}));

if (aboutHelix) {
  Object.assign(aboutHelix.target, { cx: 0.5, cy: 0.5, tilt: 0, len: 0.92, r: 0.16, alpha: 1, lit: 0 });
  aboutHelix.snap();
}
safe("scroll", () => initScroll({ helix, aboutHelix, reduced }));
safe("pillars", () => initPillars({ reduced }));

// The globe (MapLibre) is loaded only when its section approaches the viewport.
const section = document.querySelector("[data-globe-section]");
const io = new IntersectionObserver((entries) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  io.disconnect();
  import("./globe.js")
    .then((m) => m.initGlobe(section, { reduced }))
    .catch((err) => {
      console.warn("globe failed", err);
      const s = section.querySelector("[data-globe-status]");
      if (s) s.textContent = "The interactive globe is unavailable on this device.";
    });
}, { rootMargin: "500px" });
io.observe(section);
