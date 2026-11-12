// Scroll choreography: (1) the page-long background helix glides between per-section poses,
// (2) the About section pins and "sequences" a second helix, lighting its four stages in order.
import { clamp, lerp, smooth } from "./kit.js";

const POSES = {
  wide: {
    hero:     { cx: 0.74, cy: 0.5, tilt: -0.34, len: 0.95, r: 0.15, alpha: 1,    spin: 1 },
    intel:    { cx: 0.035, cy: 0.5, tilt: 0,    len: 1.05, r: 0.05, alpha: 0.38, spin: 0.6 },
    services: { cx: 0.965, cy: 0.5, tilt: 0,    len: 1.05, r: 0.05, alpha: 0.3,  spin: 0.6 },
    about:    { cx: 0.5,  cy: 0.5, tilt: 0,     len: 1,    r: 0.1,  alpha: 0,    spin: 0.6 }, // hand-off to the sequencer
    footer:   { cx: 0.5,  cy: 0.6, tilt: -0.2,  len: 1,    r: 0.1,  alpha: 0.14, spin: 0.5 },
  },
  narrow: {
    hero:     { cx: 0.5, cy: 0.62, tilt: -0.2, len: 0.85, r: 0.13, alpha: 0.6,  spin: 1 },
    intel:    { cx: 0.5, cy: 0.5,  tilt: 0,    len: 1,    r: 0.1,  alpha: 0.08, spin: 0.6 },
    services: { cx: 0.5, cy: 0.5,  tilt: 0,    len: 1,    r: 0.1,  alpha: 0.06, spin: 0.6 },
    about:    { cx: 0.5, cy: 0.5,  tilt: 0,    len: 1,    r: 0.1,  alpha: 0,    spin: 0.6 },
    footer:   { cx: 0.5, cy: 0.6,  tilt: -0.2, len: 1,    r: 0.1,  alpha: 0.1,  spin: 0.5 },
  },
};
const ORDER = ["hero", "intel", "services", "about", "footer"];

export function initScroll({ helix, aboutHelix, reduced }) {
  const sections = ORDER.map((id) => document.querySelector(`[data-section="${id}"]`));
  const track = document.querySelector("[data-about-track]");
  const stageItems = [...document.querySelectorAll("[data-stage-item]")];
  let ticking = false;

  function poseKeys() { return window.innerWidth > 900 ? POSES.wide : POSES.narrow; }

  function updateBackground() {
    if (!helix) return;
    const poses = poseKeys();
    const y = window.scrollY + window.innerHeight * 0.55;
    const offs = sections.map((el) => (el ? el.getBoundingClientRect().top + window.scrollY : Infinity));
    let i = 0;
    for (let k = 0; k < offs.length; k++) if (offs[k] <= y) i = k;
    const next = Math.min(i + 1, ORDER.length - 1);
    const span = offs[next] - offs[i];
    // hold the pose through the first part of a section, then glide to the next one
    const f = i === next || !isFinite(span) || span <= 0 ? 0 : smooth(0.35, 1, (y - offs[i]) / span);
    const a = poses[ORDER[i]], b = poses[ORDER[next]];
    for (const key of Object.keys(a)) helix.target[key] = lerp(a[key], b[key], f);
    helix.wake();
  }

  function updateAbout() {
    if (!track || !aboutHelix) return;
    if (reduced) {
      aboutHelix.target.lit = 1;
      stageItems.forEach((li) => li.classList.add("is-active"));
      aboutHelix.wake();
      return;
    }
    const r = track.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
    aboutHelix.target.lit = p;
    aboutHelix.target.spin = 0.7 + p * 1.6;
    aboutHelix.target.r = 0.16 + p * 0.03;
    track.style.setProperty("--p", p.toFixed(3));
    const active = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
    stageItems.forEach((li, idx) => {
      li.classList.toggle("is-active", idx === active);
      li.classList.toggle("is-done", idx < active);
    });
    aboutHelix.wake();
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateBackground(); updateAbout(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateBackground();
  updateAbout();
  if (helix) helix.snap();
}
