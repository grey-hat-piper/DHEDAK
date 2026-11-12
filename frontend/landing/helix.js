// Double-helix engine on <canvas>. One engine, several uses: the page-long background helix
// (scroll-choreographed through `target`) and the About "sequencer" helix (`lit` + `marks`).
// Depth-sorted strands with perspective, a travelling pulse along the base pairs, pointer parallax,
// scroll-velocity spin. Renders on demand under prefers-reduced-motion.
import { clamp, smooth } from "./kit.js";

const A = [56, 189, 248];
const B = [45, 212, 191];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a)})`;

export function createHelix(canvas, { reduced = false, follow = true, nodes = 76, turns = 3.4, marks = [] } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // cx, cy: centre (0..1 of canvas). tilt: radians from vertical. len: axis length (x diagonal).
  // r: strand radius (x min side). alpha: master opacity. spin: speed multiplier. lit: 0..1 energised
  // portion along the helix (top to bottom), or -1 for the free-running pulse.
  const cur = { cx: 0.74, cy: 0.5, tilt: -0.34, len: 0.95, r: 0.15, alpha: 1, spin: 1, lit: -1 };
  const target = { ...cur };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const motes = follow
    ? Array.from({ length: 48 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), s: 0.5 + Math.random() * 1.3, v: 0.012 + Math.random() * 0.03 }))
    : [];
  let w = 0, h = 0, raf = 0, visible = true, spinAngle = 0, boost = 0, lastY = window.scrollY, last = performance.now(), pending = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wake();
  }

  function frame(now, dt) {
    const k = reduced ? 1 : 1 - Math.exp(-dt / 170);
    for (const key of Object.keys(cur)) cur[key] += (target[key] - cur[key]) * k;

    const dy = window.scrollY - lastY; lastY = window.scrollY;
    boost = boost * 0.92 + dy * 0.0016;
    if (!reduced) spinAngle += dt * 0.00032 * cur.spin * (1 + pointer.x * 0.9) + boost;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    ctx.clearRect(0, 0, w, h);
    const master = cur.alpha;
    if (master < 0.01 || !w) return;

    const cx = w * cur.cx + pointer.x * 18, cy = h * cur.cy + pointer.y * 10;
    const tilt = cur.tilt + pointer.y * 0.05 + pointer.x * 0.03;
    const L = Math.hypot(w, h) * cur.len;
    const R = Math.min(w, h) * cur.r;
    const ax = Math.sin(tilt), ay = Math.cos(tilt);
    const px = Math.cos(tilt), py = -Math.sin(tilt);
    const lit = cur.lit;

    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      m.y -= m.v * (dt / 1000) * (reduced ? 0 : 1);
      if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
      ctx.fillStyle = rgba(m.z > 0.5 ? A : B, (0.18 + m.z * 0.25) * master);
      ctx.beginPath(); ctx.arc(m.x * w + pointer.x * 24 * m.z, m.y * h + pointer.y * 24 * m.z, m.s * (0.6 + m.z), 0, 6.283); ctx.fill();
    }

    const pts = [];
    for (let i = 0; i < nodes; i++) {
      const s = i / (nodes - 1) - 0.5;
      const phase = spinAngle + s * turns * Math.PI * 2;
      const env = Math.pow(Math.sin(Math.PI * (s + 0.5)), 0.55);
      const bx = cx + ax * s * L, by = cy + ay * s * L;
      let energy;
      if (lit < 0) energy = Math.pow(0.5 + 0.5 * Math.sin(s * 15 - now * 0.0016), 3);
      else {
        const s01 = s + 0.5;
        energy = s01 <= lit ? 0.85 : 0.1;
        energy += 0.9 * Math.exp(-Math.pow((s01 - lit) / 0.035, 2)); // bright front
      }
      const za = Math.sin(phase), pa = 1 + za * 0.24;
      pts.push({
        i, env, energy, bx, by,
        a: { x: bx + px * Math.cos(phase) * R * pa, y: by + py * Math.cos(phase) * R * pa, z: za },
        b: { x: bx - px * Math.cos(phase) * R * (1 - za * 0.24), y: by - py * Math.cos(phase) * R * (1 - za * 0.24), z: -za },
      });
    }

    const node = (n, col, key) => {
      const q = n[key], depth = (q.z + 1) / 2;
      const a = (0.25 + 0.75 * depth) * n.env * (0.55 + 0.7 * n.energy) * master;
      const r = (1.6 + 2.6 * depth) * (0.6 + 0.4 * n.env);
      ctx.fillStyle = rgba(col, a * 0.14); ctx.beginPath(); ctx.arc(q.x, q.y, r * 3.4, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.283); ctx.fill();
    };
    const link = (n, m, col, key) => {
      const q = n[key], u = m[key], depth = ((q.z + u.z) / 2 + 1) / 2;
      ctx.strokeStyle = rgba(col, (0.1 + 0.4 * depth) * n.env * master);
      ctx.lineWidth = 0.8 + 1.2 * depth;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(u.x, u.y); ctx.stroke();
    };

    const rungEvery = lit < 0 ? 3 : 2;
    for (const front of [false, true]) {
      if (front) {
        for (const n of pts) {
          if (n.i % rungEvery) continue;
          const g = ctx.createLinearGradient(n.a.x, n.a.y, n.b.x, n.b.y);
          const a = (0.08 + 0.6 * n.energy) * n.env * master;
          g.addColorStop(0, rgba(A, a)); g.addColorStop(1, rgba(B, a));
          ctx.strokeStyle = g; ctx.lineWidth = 1 + 1.4 * Math.min(1, n.energy);
          ctx.beginPath(); ctx.moveTo(n.a.x, n.a.y); ctx.lineTo(n.b.x, n.b.y); ctx.stroke();
        }
      }
      for (let i = 0; i < nodes; i++) {
        const n = pts[i], m = pts[i + 1];
        for (const [key, col] of [["a", A], ["b", B]]) {
          if ((n[key].z >= 0) !== front) continue;
          if (m) link(n, m, col, key);
          node(n, col, key);
        }
      }
    }

    // stage markers: rings on the rung that the energised front has reached
    if (lit >= 0) {
      for (const mk of marks) {
        const n = pts[Math.round(mk * (nodes - 1))];
        if (!n) continue;
        const reached = smooth(mk - 0.02, mk + 0.02, lit);
        const mx = (n.a.x + n.b.x) / 2, my = (n.a.y + n.b.y) / 2;
        ctx.strokeStyle = rgba([103, 232, 249], (0.25 + 0.75 * reached) * master);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(mx, my, 9 + 4 * reached, 0, 6.283); ctx.stroke();
        ctx.fillStyle = rgba([224, 251, 255], reached * master);
        ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, 6.283); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function loop(now) {
    const dt = Math.min(now - last, 64); last = now;
    frame(now, dt);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  // Reduced motion: render a single frame on demand (resize, scroll) instead of looping.
  function wake() {
    if (!reduced) return start();
    if (pending) return;
    pending = true;
    requestAnimationFrame((t) => { pending = false; frame(t, 16); });
  }

  if (follow) {
    window.addEventListener("pointermove", (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(canvas);
  document.addEventListener("visibilitychange", wake);
  resize();

  return { target, cur, wake, snap() { Object.assign(cur, target); wake(); } };
}
