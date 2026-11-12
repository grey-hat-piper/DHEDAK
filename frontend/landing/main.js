document.documentElement.classList.add("js"); // gates reveal animations so content stays visible without JS
import "./landing.css";
import { initEffects } from "./effects.js";
import { initHelix } from "./helix.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initEffects({ reduced });
initHelix(document.getElementById("helix"), { reduced });

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
