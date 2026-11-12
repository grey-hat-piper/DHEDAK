// Interactive double helix on <canvas>. Strands are depth-sorted with perspective; a travelling
// pulse runs along the base pairs ("data flowing through biology"). Responds to pointer and scroll.
// Static single frame under prefers-reduced-motion; pauses when off-screen or tab hidden.
const A = [56, 189, 248]; // cyan
const B = [45, 212, 191]; // teal
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;

export function initHelix(canvas, { reduced }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const N = 76;
  const TURNS = 3.4;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const motes = Array.from({ length: 48 }, () => ({
    x: Math.random(), y: Math.random(), z: Math.random(), s: 0.5 + Math.random() * 1.3, v: 0.012 + Math.random() * 0.03,
  }));
  let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
  let spin = 0, boost = 0, lastY = window.scrollY, last = performance.now();

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced) frame(performance.now(), 0);
  }

  function frame(now, dt) {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    const dy = window.scrollY - lastY; lastY = window.scrollY;
    boost = boost * 0.92 + dy * 0.0016;
    spin += dt * 0.00032 * (1 + pointer.x * 0.9) + boost;

    ctx.clearRect(0, 0, w, h);
    const wide = w > 900;
    const cx = w * (wide ? 0.74 : 0.5) + pointer.x * 18;
    const cy = h * 0.5 + pointer.y * 10;
    const tilt = (wide ? -0.34 : -0.2) + pointer.y * 0.05 + pointer.x * 0.03;
    const L = Math.hypot(w, h) * (wide ? 0.95 : 0.85);
    const R = Math.min(w, h) * (wide ? 0.15 : 0.13);
    const ax = Math.sin(tilt), ay = Math.cos(tilt); // axis direction
    const px = Math.cos(tilt), py = -Math.sin(tilt); // perpendicular
    const t = now;

    // motes: faint drifting particles with pointer parallax
    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      m.y -= m.v * (dt / 1000) * (reduced ? 0 : 1);
      if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
      const mx = m.x * w + pointer.x * 24 * m.z, my = m.y * h + pointer.y * 24 * m.z;
      ctx.fillStyle = rgba(m.z > 0.5 ? A : B, 0.18 + m.z * 0.25);
      ctx.beginPath(); ctx.arc(mx, my, m.s * (0.6 + m.z), 0, 6.283); ctx.fill();
    }

    const pts = [];
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1) - 0.5;
      const phase = spin + s * TURNS * Math.PI * 2;
      const env = Math.pow(Math.sin(Math.PI * (s + 0.5)), 0.55); // fade ends
      const bx = cx + ax * s * L, by = cy + ay * s * L;
      const wave = Math.pow(0.5 + 0.5 * Math.sin(s * 15 - t * 0.0016), 3); // travelling pulse
      const za = Math.sin(phase);
      const p = (z) => 1 + z * 0.24;
      pts.push({
        i, env, wave,
        a: { x: bx + px * Math.cos(phase) * R * p(za), y: by + py * Math.cos(phase) * R * p(za), z: za },
        b: { x: bx - px * Math.cos(phase) * R * p(-za), y: by - py * Math.cos(phase) * R * p(-za), z: -za },
      });
    }

    const node = (n, col, key) => {
      const q = n[key];
      const depth = (q.z + 1) / 2;
      const a = (0.25 + 0.75 * depth) * n.env * (0.65 + 0.7 * n.wave);
      const r = (1.6 + 2.6 * depth) * (0.6 + 0.4 * n.env);
      ctx.fillStyle = rgba(col, a * 0.14); ctx.beginPath(); ctx.arc(q.x, q.y, r * 3.4, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.283); ctx.fill();
    };
    const link = (n, m, col, key) => {
      const q = n[key], u = m[key];
      const depth = ((q.z + u.z) / 2 + 1) / 2;
      ctx.strokeStyle = rgba(col, (0.1 + 0.4 * depth) * n.env);
      ctx.lineWidth = 0.8 + 1.2 * depth;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(u.x, u.y); ctx.stroke();
    };

    // back layer, base pairs, then front layer so the strands weave through each other
    for (const front of [false, true]) {
      if (front) {
        for (const n of pts) {
          if (n.i % 3) continue;
          const g = ctx.createLinearGradient(n.a.x, n.a.y, n.b.x, n.b.y);
          const a = (0.1 + 0.55 * n.wave) * n.env;
          g.addColorStop(0, rgba(A, a)); g.addColorStop(1, rgba(B, a));
          ctx.strokeStyle = g; ctx.lineWidth = 1 + 1.4 * n.wave;
          ctx.beginPath(); ctx.moveTo(n.a.x, n.a.y); ctx.lineTo(n.b.x, n.b.y); ctx.stroke();
        }
      }
      for (let i = 0; i < N; i++) {
        const n = pts[i], m = pts[i + 1];
        for (const [key, col] of [["a", A], ["b", B]]) {
          if ((n[key].z >= 0) !== front) continue;
          if (m) link(n, m, col, key);
          node(n, col, key);
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function loop(now) {
    const dt = Math.min(now - last, 64); last = now;
    frame(now, dt);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  const start = () => { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);
  document.addEventListener("visibilitychange", start);
  resize();
  start();
}
