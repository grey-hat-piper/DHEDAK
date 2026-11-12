// Small shared helpers for the canvas scenes. No dependencies.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
export const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a)})`;

export function hexToRgb(hex) {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Seeded RNG so scenes look identical on every load (and in tests).
export function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sizes the canvas backing store to its CSS box at device pixel ratio (max 2).
export function setupCanvas(canvas, onResize) {
  const ctx = canvas.getContext("2d");
  const view = { ctx, w: 0, h: 0, dpr: 1 };
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = r.width; view.h = r.height;
    canvas.width = Math.max(1, Math.round(r.width * view.dpr));
    canvas.height = Math.max(1, Math.round(r.height * view.dpr));
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (onResize) onResize(view);
  };
  new ResizeObserver(fit).observe(canvas);
  fit();
  return view;
}

export function trackPointer(canvas, onMove) {
  const p = { x: -999, y: -999, inside: false, moved: 0 };
  const set = (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    p.moved += Math.hypot(nx - p.x, ny - p.y) < 400 ? Math.hypot(nx - p.x, ny - p.y) : 0;
    p.x = nx; p.y = ny; p.inside = true;
    if (onMove) onMove(p, e);
  };
  canvas.addEventListener("pointermove", set, { passive: true });
  canvas.addEventListener("pointerdown", (e) => { set(e); if (onMove) onMove(p, e, true); }, { passive: true });
  canvas.addEventListener("pointerleave", () => { p.inside = false; });
  return p;
}

// Runs `frame(now, dt)` only while the canvas is on screen. Under reduced motion it renders only
// briefly after an interaction (wake) instead of looping.
export function runScene(canvas, { reduced, frame }) {
  let raf = 0, visible = false, awakeUntil = 0, last = performance.now();
  const step = (now) => {
    const dt = Math.min(now - last, 64); last = now;
    frame(now, dt);
    raf = 0;
    if (!visible || document.hidden) return;
    if (!reduced || now < awakeUntil) raf = requestAnimationFrame(step);
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { awakeUntil = performance.now() + 1200; kick(); }
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) kick(); });
  return { wake(ms = 1500) { awakeUntil = performance.now() + ms; if (visible) kick(); } };
}
