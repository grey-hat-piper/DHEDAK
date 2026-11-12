// Four interactive canvas scenes, one per DHEDAK pillar. Everything here is ILLUSTRATIVE: seeded,
// procedurally generated, and labelled as such in the UI. No real facilities, people or health data.
import { clamp, hexToRgb, lerp, mulberry32, rgba, runScene, setupCanvas, smooth, trackPointer } from "./kit.js";

const accentOf = (root) => hexToRgb(getComputedStyle(root).getPropertyValue("--accent") || "#38bdf8");
const FAMILY = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const FONT = `12px ${FAMILY}`;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ---------------------------------------------------------------- LiveMap */
export function livemap(canvas, root, { reduced }) {
  const accent = accentOf(root);
  const CATS = [
    { id: "hospital", label: "Hospital", color: [56, 189, 248] },
    { id: "clinic", label: "Clinic", color: [45, 212, 191] },
    { id: "pharmacy", label: "Pharmacy", color: [196, 181, 253] },
    { id: "lab", label: "Laboratory", color: [251, 191, 36] },
  ];
  const catById = Object.fromEntries(CATS.map((c) => [c.id, c]));
  const rnd = mulberry32(11);
  const BLOBS = [[0.3, 0.3, 0.2], [0.5, 0.45, 0.26], [0.42, 0.7, 0.2], [0.66, 0.6, 0.18], [0.62, 0.25, 0.14], [0.25, 0.55, 0.13]];
  const inLand = (x, y) => BLOBS.reduce((v, [cx, cy, r]) => v + Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r * 0.55)), 0) > 0.55;

  const weights = [0.18, 0.4, 0.3, 0.12];
  const pickCat = () => { let t = rnd(), i = 0; while (i < 3 && t > weights[i]) { t -= weights[i]; i++; } return CATS[i].id; };
  const pts = [];
  while (pts.length < 150) {
    const x = 0.06 + rnd() * 0.88, y = 0.06 + rnd() * 0.88;
    if (inLand(x, y)) pts.push({ x, y, cat: pickCat(), ph: rnd() * 6.28, v: 1, t: 1, cx: 0, cy: 0, n: 1 });
  }

  const active = new Set(CATS.map((c) => c.id));
  let cl = 0, clT = 0, land = [], clusters = [], view;
  const LENS = 92;

  function rebuild(v = view) {
    land = [];
    for (let x = 8; x < v.w; x += 13) for (let y = 8; y < v.h; y += 13) if (inLand(x / v.w, y / v.h)) land.push([x, y]);
    const cell = 76, map = new Map();
    for (const p of pts) {
      p.t = active.has(p.cat) ? 1 : 0;
      if (!p.t) continue;
      const key = `${Math.floor((p.x * v.w) / cell)}:${Math.floor((p.y * v.h) / cell)}`;
      if (!map.has(key)) map.set(key, { sx: 0, sy: 0, n: 0, list: [] });
      const c = map.get(key);
      c.sx += p.x * v.w; c.sy += p.y * v.h; c.n++; c.list.push(p);
    }
    clusters = [...map.values()].map((c) => ({ x: c.sx / c.n, y: c.sy / c.n, n: c.n, list: c.list }));
    for (const c of clusters) for (const p of c.list) { p.cx = c.x; p.cy = c.y; p.n = c.n; }
    status();
  }

  const statusEl = root.querySelector("[data-status]");
  function status() {
    if (!statusEl) return;
    const n = pts.filter((p) => active.has(p.cat)).length;
    statusEl.textContent = `${n} illustrative points shown across ${active.size} ${active.size === 1 ? "category" : "categories"}. Not real facilities.`;
  }

  view = setupCanvas(canvas, rebuild);
  const scene = runScene(canvas, { reduced, frame });
  const pointer = trackPointer(canvas, () => scene.wake());

  root.querySelectorAll("[data-cat]").forEach((btn) => btn.addEventListener("click", () => {
    const id = btn.dataset.cat;
    if (active.has(id) && active.size === 1) return; // always keep one category visible
    active.has(id) ? active.delete(id) : active.add(id);
    btn.setAttribute("aria-pressed", String(active.has(id)));
    rebuild(); scene.wake(2200);
  }));
  root.querySelectorAll("[data-zoom]").forEach((btn) => btn.addEventListener("click", () => {
    clT = btn.dataset.zoom === "cluster" ? 1 : 0;
    root.querySelectorAll("[data-zoom]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    scene.wake(2200);
  }));

  function frame(now, dt) {
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);
    cl += (clT - cl) * (reduced ? 1 : 1 - Math.exp(-dt / 170));
    const px = pointer.x, py = pointer.y, inside = pointer.inside;

    for (const [x, y] of land) {
      const f = inside ? smooth(LENS * 1.5, 0, Math.hypot(x - px, y - py)) : 0;
      ctx.fillStyle = rgba([148, 178, 220], 0.12 + 0.5 * f);
      ctx.fillRect(x - 0.8, y - 0.8, 1.6 + f, 1.6 + f);
    }

    let nearest = null, nd = 18;
    for (const p of pts) {
      p.v += (p.t - p.v) * (reduced ? 1 : 1 - Math.exp(-dt / 140));
      if (p.v < 0.02) continue;
      const ox = p.x * w, oy = p.y * h;
      const x = p.n > 1 ? lerp(ox, p.cx, cl) : ox, y = p.n > 1 ? lerp(oy, p.cy, cl) : oy;
      const f = inside ? smooth(LENS, LENS * 0.35, Math.hypot(x - px, y - py)) : 0;
      const col = catById[p.cat].color;
      const a = p.v * (p.n > 1 ? 1 - cl * 0.85 : 1) * (inside ? 0.55 + 0.45 * f : 1);
      const r = 2.6 + f * 3.2;
      ctx.fillStyle = rgba(col, 0.16 * a); ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      if (!reduced && p.cat === "hospital" && cl < 0.5) {
        const t = ((now / 2200) + p.ph) % 1;
        ctx.strokeStyle = rgba(col, (1 - t) * 0.5 * p.v); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, 3 + t * 14, 0, 6.283); ctx.stroke();
      }
      if (inside && cl < 0.4) { const d = Math.hypot(x - px, y - py); if (d < nd) { nd = d; nearest = { p, x, y }; } }
    }

    if (cl > 0.02) {
      ctx.font = `600 12px ${FAMILY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const c of clusters) {
        if (c.n < 2) continue;
        const r = 9 + Math.sqrt(c.n) * 3.4;
        ctx.fillStyle = rgba(accent, 0.16 * cl); ctx.beginPath(); ctx.arc(c.x, c.y, r + 5, 0, 6.283); ctx.fill();
        ctx.fillStyle = rgba([8, 20, 40], 0.9 * cl); ctx.strokeStyle = rgba(accent, 0.85 * cl); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = rgba([230, 244, 255], cl); ctx.fillText(String(c.n), c.x, c.y + 0.5);
      }
    }

    if (inside) {
      const g = ctx.createRadialGradient(px, py, LENS * 0.2, px, py, LENS);
      g.addColorStop(0, "rgba(255,255,255,0.05)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, LENS, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, LENS, 0, 6.283); ctx.stroke();
    }

    if (nearest) {
      const label = `${catById[nearest.p.cat].label} · illustrative`;
      ctx.font = FONT; const tw = ctx.measureText(label).width + 18;
      const tx = clamp(nearest.x - tw / 2, 6, w - tw - 6), ty = Math.max(8, nearest.y - 38);
      ctx.fillStyle = "rgba(6,13,27,0.92)"; ctx.strokeStyle = rgba(catById[nearest.p.cat].color, 0.8); ctx.lineWidth = 1;
      roundRect(ctx, tx, ty, tw, 24, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e6edf7"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, tx + 9, ty + 12.5);
    }
  }
  scene.wake(1500);
}

/* ------------------------------------------------------------- Management */
export function management(canvas, root, { reduced }) {
  const accent = accentOf(root);
  const rnd = mulberry32(5);
  const STAGES = ["Upload", "Validate", "Review", "Approve", "Publish"];
  let xs = [], cy = 0, view, recs = [], publicOn = false, lastSummary = "", started = false;
  const pulse = STAGES.map(() => 0);

  function layout(v) {
    const pad = Math.max(56, v.w * 0.09);
    xs = STAGES.map((_, i) => pad + ((v.w - 2 * pad) * i) / (STAGES.length - 1));
    cy = v.h * 0.38;
  }
  view = setupCanvas(canvas, layout);
  const scene = runScene(canvas, { reduced, frame });

  const BASE = {
    flag: () => ({ x: xs[1], y: cy + 44 }),
    hold: () => ({ x: xs[2], y: cy + 44 }),
    internal: () => ({ x: xs[4], y: cy + 44 }),
    public: () => ({ x: xs[4], y: cy - 98 }),
  };
  function setSlot(r, kind) {
    const k = recs.filter((o) => o !== r && o.state === kind).length;
    const b = BASE[kind]();
    r.state = kind; r.tx = b.x + ((k % 6) - 2.5) * 12; r.ty = b.y + Math.floor(k / 6) * 12;
  }

  function run() {
    recs = [];
    for (let i = 0; i < 28; i++) recs.push({ x: xs[0], y: cy, tx: 0, ty: 0, state: "wait", stage: 1, delay: i * 90, flagged: rnd() < 0.18, jit: (rnd() - 0.5) * 22 });
    scene.wake(9000); summarise();
  }
  function approve() {
    let k = 0;
    for (const r of recs) if (r.state === "hold") { r.state = "wait"; r.stage = 3; r.delay = k++ * 70; }
    scene.wake(6000); summarise();
  }
  function setPublic(on) {
    publicOn = on;
    for (const r of recs) {
      if (on && r.state === "internal") setSlot(r, "public");
      else if (!on && r.state === "public") setSlot(r, "internal");
    }
    scene.wake(3000); summarise();
  }
  function arrive(r) {
    pulse[r.stage] = 1;
    if (r.stage === 1) { if (r.flagged) setSlot(r, "flag"); else r.stage = 2; }
    else if (r.stage === 2) setSlot(r, "hold");
    else if (r.stage === 3) r.stage = 4;
    else if (r.stage === 4) setSlot(r, publicOn ? "public" : "internal");
    summarise();
  }

  const ui = {
    run: root.querySelector('[data-act="run"]'),
    approve: root.querySelector('[data-act="approve"]'),
    publish: root.querySelector('[data-act="publish"]'),
    status: root.querySelector("[data-status]"),
  };
  ui.run?.addEventListener("click", () => { started = true; run(); });
  ui.approve?.addEventListener("click", approve);
  ui.publish?.addEventListener("click", () => {
    const on = ui.publish.getAttribute("aria-checked") !== "true";
    ui.publish.setAttribute("aria-checked", String(on)); setPublic(on);
  });

  function summarise() {
    const n = (s) => recs.filter((r) => r.state === s).length;
    const total = recs.length, flag = n("flag"), hold = n("hold"), internal = n("internal"), pub = n("public");
    if (ui.approve) ui.approve.disabled = hold === 0;
    ui.approve?.classList.toggle("is-pulsing", hold > 0 && !reduced);
    const text = total
      ? `Simulated: ${total} records. ${flag} flagged for correction, ${hold} awaiting review, ${internal} approved (internal only), ${pub} published. No real data.`
      : "Simulated records for illustration. No real data. Run an import to begin.";
    if (text !== lastSummary && ui.status) { ui.status.textContent = text; lastSummary = text; }
  }

  function frame(now, dt) {
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);
    const spacing = xs[1] - xs[0], spd = spacing / 800;
    const ease = reduced ? 1 : 1 - Math.exp(-dt / 120);

    for (const r of recs) {
      if (r.state === "wait") { r.delay -= dt; if (r.delay <= 0) r.state = "flow"; }
      else if (r.state === "flow") {
        const tx = xs[r.stage];
        r.x += Math.min(tx - r.x, reduced ? 9999 : spd * dt);
        r.y += (cy + r.jit - r.y) * ease;
        if (Math.abs(tx - r.x) < 1.2) arrive(r);
      } else { r.x += (r.tx - r.x) * ease; r.y += (r.ty - r.y) * ease; }
    }
    for (let i = 0; i < pulse.length; i++) pulse[i] = Math.max(0, pulse[i] - dt / 700);

    ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]); ctx.lineDashOffset = reduced ? 0 : -now / 60;
    ctx.strokeStyle = rgba(accent, 0.3);
    ctx.beginPath(); ctx.moveTo(xs[0], cy); ctx.lineTo(xs[4], cy); ctx.stroke();
    ctx.setLineDash([]);

    const bucket = (kind, caption, rows, above) => {
      const b = BASE[kind](), bw = 92, bh = rows * 12 + 22;
      const top = above ? b.y - 14 : b.y - 14;
      ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba([148, 178, 220], 0.28); ctx.lineWidth = 1;
      roundRect(ctx, b.x - bw / 2, top, bw, bh, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = rgba([143, 163, 191], 0.9); ctx.font = `11px ${FAMILY}`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(caption, b.x, above ? top - 16 : top + bh + 5);
    };
    bucket("flag", "Validation report", 2);
    bucket("hold", recs.some((r) => r.state === "hold") ? "Awaiting reviewer" : "Review queue", 5);
    bucket("internal", "Internal only", 5);
    bucket("public", "Public map", 3, true);

    ctx.textAlign = "center";
    STAGES.forEach((name, i) => {
      const p = pulse[i];
      ctx.fillStyle = rgba(accent, 0.1 + 0.3 * p); ctx.beginPath(); ctx.arc(xs[i], cy, 16 + 10 * p, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#08142a"; ctx.strokeStyle = rgba(accent, 0.6 + 0.4 * p); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(xs[i], cy, 11, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e6edf7"; ctx.font = `600 11px ${FAMILY}`; ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), xs[i], cy + 0.5);
      ctx.fillStyle = "#b8c7dc"; ctx.font = FONT; ctx.textBaseline = "bottom";
      ctx.fillText(name, xs[i], cy - 22);
    });

    const colors = { wait: accent, flow: accent, flag: [251, 191, 36], hold: [148, 163, 184], internal: [196, 181, 253], public: [103, 232, 249] };
    for (const r of recs) {
      if (r.state === "wait") continue;
      const col = colors[r.state];
      ctx.fillStyle = rgba(col, 0.18); ctx.beginPath(); ctx.arc(r.x, r.y, 8, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(r.x, r.y, 4, 0, 6.283); ctx.fill();
    }

    if (!recs.length) {
      ctx.fillStyle = "#8fa3bf"; ctx.font = FONT; ctx.textBaseline = "middle";
      ctx.fillText("Run a simulated import to watch records move through review", w / 2, cy + 110);
    }
  }

  layout(view); summarise();
  // First visit: start a batch automatically so the pipeline is alive; it then waits at Review for you.
  if (!reduced) {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting && !started) { started = true; o.disconnect(); setTimeout(run, 600); } }, { threshold: 0.5 }).observe(canvas);
  }
  scene.wake(1200);
}

/* -------------------------------------------------------------- MedConnect */
// COMING SOON teaser: providers (left) and suppliers (right). The cursor acts like a torch that
// lights up potential connections. Purely atmospheric; no controls, nothing implies it works.
export function medconnect(canvas, root, { reduced }) {
  const accent = accentOf(root);
  const rnd = mulberry32(21);
  const mk = (side) => Array.from({ length: 11 }, () => ({
    side, ax: side === 0 ? 0.1 + rnd() * 0.26 : 0.64 + rnd() * 0.26, ay: 0.12 + rnd() * 0.66, ph: rnd() * 6.28, x: 0, y: 0,
  }));
  const providers = mk(0), suppliers = mk(1);
  const links = [];
  providers.forEach((p, i) => {
    // link each provider to the two suppliers at the most similar height, so lines fan out cleanly
    const order = suppliers.map((s, j) => [j, Math.abs(s.ay - p.ay) + rnd() * 0.04]).sort((a, b) => a[1] - b[1]);
    for (const [j] of order.slice(0, 2)) links.push([i, j, rnd()]);
  });
  const view = setupCanvas(canvas);
  const scene = runScene(canvas, { reduced, frame });
  const pointer = trackPointer(canvas, () => scene.wake());

  function place(n, now, w, h) {
    n.x = n.ax * w + Math.sin(now / 2600 + n.ph) * (reduced ? 0 : 9);
    n.y = n.ay * h + Math.cos(now / 3100 + n.ph) * (reduced ? 0 : 9);
    if (pointer.inside) {
      const dx = pointer.x - n.x, dy = pointer.y - n.y, d = Math.hypot(dx, dy);
      if (d < 170) { const f = 0.14 * (1 - d / 170); n.x += dx * f; n.y += dy * f; }
    }
  }

  function frame(now) {
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);
    [...providers, ...suppliers].forEach((n) => place(n, now, w, h));

    for (const [i, j, off] of links) {
      const p = providers[i], s = suppliers[j];
      const mx = (p.x + s.x) / 2, my = (p.y + s.y) / 2;
      const lit = pointer.inside ? smooth(260, 0, Math.hypot(mx - pointer.x, my - pointer.y)) : 0;
      ctx.strokeStyle = rgba(accent, 0.05 + 0.55 * lit); ctx.lineWidth = 0.8 + lit;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(s.x, s.y); ctx.stroke();
      if (lit > 0.15 && !reduced) {
        const t = (now / 1500 + off) % 1;
        ctx.fillStyle = rgba([233, 227, 255], lit); ctx.beginPath();
        ctx.arc(lerp(p.x, s.x, t), lerp(p.y, s.y, t), 2.2, 0, 6.283); ctx.fill();
      }
    }
    for (const n of [...providers, ...suppliers]) {
      const lit = pointer.inside ? smooth(180, 0, Math.hypot(n.x - pointer.x, n.y - pointer.y)) : 0;
      const a = 0.4 + 0.6 * lit;
      ctx.fillStyle = rgba(accent, 0.12 * a); ctx.beginPath(); ctx.arc(n.x, n.y, 12, 0, 6.283); ctx.fill();
      ctx.strokeStyle = rgba(accent, a); ctx.fillStyle = "#0a1226"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (n.side === 0) ctx.arc(n.x, n.y, 5.5, 0, 6.283);
      else { ctx.moveTo(n.x, n.y - 7); ctx.lineTo(n.x + 6, n.y); ctx.lineTo(n.x, n.y + 7); ctx.lineTo(n.x - 6, n.y); ctx.closePath(); }
      ctx.fill(); ctx.stroke();
    }
    ctx.font = `11px ${FAMILY}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = rgba([180, 170, 220], 0.75);
    ctx.fillText("Healthcare providers", w * 0.23, h - 16);
    ctx.fillText("Medical suppliers", w * 0.77, h - 16);
  }
  scene.wake(1500);
}

/* --------------------------------------------------------------- Education */
// COMING SOON teaser: awareness spreading through a community. Move over it to send ripples;
// dots that a ripple reaches light up and pass a fading glow to their neighbours.
export function education(canvas, root, { reduced }) {
  const accent = accentOf(root);
  const rnd = mulberry32(33);
  let dots = [], ripples = [], lastEmit = 0, nextAuto = 900;
  const view = setupCanvas(canvas, build);
  const scene = runScene(canvas, { reduced, frame });
  const pointer = trackPointer(canvas, (p, e, down) => {
    const now = performance.now();
    if (down || (now - lastEmit > 420 && p.moved > 14)) { emit(p.x, p.y, now, down ? 1.25 : 1); lastEmit = now; p.moved = 0; }
    scene.wake(2600);
  });

  function build(v) {
    const g = 27; dots = [];
    for (let y = g; y < v.h - 20; y += g) for (let x = g; x < v.w - 10; x += g)
      dots.push({ x: x + (rnd() - 0.5) * g * 0.7, y: y + (rnd() - 0.5) * g * 0.7, a: 0, adj: [] });
    dots.forEach((d, i) => dots.forEach((o, j) => { if (i !== j && Math.hypot(d.x - o.x, d.y - o.y) < g * 1.45) d.adj.push(j); }));
  }
  function emit(x, y, now, size = 1) { ripples.push({ x, y, t0: now, size }); if (ripples.length > 6) ripples.shift(); }

  function frame(now, dt) {
    const { ctx, w, h } = view;
    ctx.clearRect(0, 0, w, h);
    if (!reduced && now > nextAuto && !pointer.inside) { emit(w * (0.2 + rnd() * 0.6), h * (0.2 + rnd() * 0.6), now); nextAuto = now + 2800 + rnd() * 1400; }
    // age is clamped: event timestamps (performance.now) can be slightly ahead of the rAF frame timestamp
    const age = (r) => Math.max(0, now - r.t0) / 1000;
    ripples = ripples.filter((r) => age(r) * 150 < 330 * r.size);
    for (const d of dots) {
      d.a = Math.max(0, d.a - dt * 0.00045);
      for (const r of ripples) {
        const rad = age(r) * 150;
        if (Math.abs(Math.hypot(d.x - r.x, d.y - r.y) - rad) < 14) d.a = 1;
      }
    }
    const lit = dots.filter((d) => d.a > 0.7);
    for (const d of lit) for (const j of d.adj) if (dots[j].a < 0.5) dots[j].a += dt * 0.0006;

    ctx.lineWidth = 1;
    for (let i = 0; i < dots.length; i++) for (const j of dots[i].adj) {
      if (j < i) continue;
      const a = Math.min(dots[i].a, dots[j].a);
      if (a < 0.18) continue;
      ctx.strokeStyle = rgba(accent, a * 0.55);
      ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
    }
    for (const d of dots) {
      ctx.fillStyle = rgba(accent, 0.05 + 0.22 * d.a); ctx.beginPath(); ctx.arc(d.x, d.y, 3 + d.a * 9, 0, 6.283); ctx.fill();
      ctx.fillStyle = rgba(d.a > 0.05 ? accent : [120, 140, 170], 0.3 + 0.7 * d.a); ctx.beginPath(); ctx.arc(d.x, d.y, 1.7 + d.a * 2.4, 0, 6.283); ctx.fill();
    }
    for (const r of ripples) {
      const k = (age(r) * 150) / (330 * r.size);
      ctx.strokeStyle = rgba(accent, (1 - k) * 0.45); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(r.x, r.y, age(r) * 150, 0, 6.283); ctx.stroke();
    }
    ctx.font = `11px ${FAMILY}`; ctx.textAlign = "center"; ctx.fillStyle = rgba([226, 190, 110], 0.7);
    ctx.fillText("Awareness spreading through a community", w / 2, h - 14);
  }
  scene.wake(1500);
}

export const SCENES = { livemap, management, medconnect, education };
