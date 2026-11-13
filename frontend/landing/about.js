// About section: the stage list and the translucent image carousel are two views of one state
// (the active stage). Scrolling, clicking a stage, using the carousel arrows or dots, swiping and
// the keyboard all end in goTo(i), which scrolls the pinned track to that stage's position.
import { clamp } from "./kit.js";

export const STAGES = 4;
// The pinned track maps scroll progress p (0..1) to a stage; each stage owns a quarter, and we jump to its middle.
export const stageFromProgress = (p) => Math.min(STAGES - 1, Math.floor(clamp(p) * STAGES));
export const progressOfStage = (i) => (i + 0.5) / STAGES;

export function initAbout({ track, reduced }) {
  const items = [...document.querySelectorAll("[data-stage-item]")];
  const slides = [...document.querySelectorAll("[data-slide]")];
  const dots = [...document.querySelectorAll("[data-dot]")];
  const deck = document.querySelector("[data-deck]");
  let active = 0;
  let lockUntil = 0; // ignore scroll-driven updates while our own smooth scroll is travelling

  function setActive(i, { done = true } = {}) {
    active = i;
    items.forEach((li, idx) => {
      li.classList.toggle("is-active", idx === i);
      li.classList.toggle("is-done", done && idx < i);
      const b = li.querySelector("[data-stage-btn]");
      if (b) idx === i ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current");
    });
    slides.forEach((sl, idx) => {
      sl.classList.toggle("is-active", idx === i);
      sl.classList.toggle("is-before", idx < i);
      sl.setAttribute("aria-hidden", String(idx !== i));
    });
    dots.forEach((d, idx) => { d.setAttribute("aria-selected", String(idx === i)); d.tabIndex = idx === i ? 0 : -1; });
  }

  function goTo(i) {
    const n = clamp(i, 0, STAGES - 1);
    if (reduced || !track || getComputedStyle(track.querySelector(".about-sticky")).position !== "sticky") { setActive(n, { done: false }); return; }
    const top = track.getBoundingClientRect().top + window.scrollY;
    const y = top + progressOfStage(n) * Math.max(1, track.offsetHeight - window.innerHeight);
    lockUntil = performance.now() + 1100;
    window.scrollTo({ top: Math.round(y), behavior: "smooth" });
    setActive(n); // respond immediately; scroll handler agrees once it lands
  }

  items.forEach((li, idx) => li.querySelector("[data-stage-btn]")?.addEventListener("click", () => goTo(idx)));
  dots.forEach((d, idx) => d.addEventListener("click", () => goTo(idx)));
  document.querySelector("[data-deck-prev]")?.addEventListener("click", () => goTo(active - 1));
  document.querySelector("[data-deck-next]")?.addEventListener("click", () => goTo(active + 1));

  if (deck) {
    deck.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
    });
    // swipe / drag
    let x0 = null;
    deck.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    deck.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 48) goTo(active + (dx < 0 ? 1 : -1));
    });
    deck.addEventListener("pointercancel", () => { x0 = null; });
    // gentle tilt toward the pointer (skipped for reduced motion)
    if (!reduced) {
      const glass = deck.querySelector(".deck-glass");
      deck.addEventListener("pointermove", (e) => {
        const r = deck.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        glass.style.transform = `perspective(900px) rotateY(${nx * 7}deg) rotateX(${-ny * 6}deg)`;
      });
      deck.addEventListener("pointerleave", () => { glass.style.transform = ""; });
    }
  }

  setActive(0);
  return { setActive, goTo, get active() { return active; }, get locked() { return performance.now() < lockUntil; } };
}
