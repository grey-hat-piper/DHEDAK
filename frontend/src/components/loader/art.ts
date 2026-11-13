// Canvas art for the loader: a rotating DNA helix with floating, tumbling 3D-ish red blood cells
// and X-shaped chromosomes drifting around it. Everything is projected with a simple perspective
// camera and depth-sorted, so cells pass in front of and behind the helix.
// No dependencies. Under prefers-reduced-motion it draws one still frame.

type RGB = [number, number, number];
const CYAN: RGB = [56, 189, 248];
const TEAL: RGB = [45, 212, 191];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, Math.max(0, a))})`;

// Deterministic randomness so the loader looks the same every time.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Body {
  kind: "cell" | "chromo";
  x: number; y: number; z: number;      // world units, roughly -1..1
  vx: number; vy: number;               // slow drift
  size: number;
  rot: number; vrot: number;            // spin in the screen plane
  tilt: number; vtilt: number;          // tumble about the horizontal axis (changes the apparent width)
  hue: RGB;
}

function makeBodies(): Body[] {
  const r = rng(7);
  const out: Body[] = [];
  const cellTints: RGB[] = [[244, 63, 94], [225, 29, 72], [251, 113, 133]];
  for (let i = 0; i < 9; i++) {
    out.push({
      kind: "cell", x: (r() * 2 - 1) * 1.25, y: (r() * 2 - 1) * 1.0, z: r() * 2 - 1,
      vx: (r() - 0.5) * 0.05, vy: -0.015 - r() * 0.04, size: 0.1 + r() * 0.07,
      rot: r() * 6.28, vrot: (r() - 0.5) * 0.5, tilt: r() * 6.28, vtilt: 0.35 + r() * 0.6, hue: cellTints[i % 3],
    });
  }
  const chromoTints: RGB[] = [[167, 139, 250], [251, 191, 36], [129, 140, 248], [45, 212, 191]];
  for (let i = 0; i < 4; i++) {
    out.push({
      kind: "chromo", x: (r() * 2 - 1) * 1.15, y: (r() * 2 - 1) * 0.9, z: r() * 2 - 1,
      vx: (r() - 0.5) * 0.04, vy: 0.01 + r() * 0.035, size: 0.13 + r() * 0.05,
      rot: r() * 6.28, vrot: (r() - 0.5) * 0.4, tilt: r() * 6.28, vtilt: 0.2 + r() * 0.4, hue: chromoTints[i],
    });
  }
  return out;
}

export interface LoaderArt { destroy(): void }

export function createLoaderArt(canvas: HTMLCanvasElement, opts: { reduced?: boolean } = {}): LoaderArt | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const reduced = !!opts.reduced;
  const bodies = makeBodies();
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let w = 0, h = 0, raf = 0, t = 0, last = performance.now();

  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  // Perspective camera: world (x, y, z) -> screen. z in -1..1 (negative = nearer).
  const project = (x: number, y: number, z: number) => {
    const unit = Math.min(w, h) * 0.5;
    const s = 1 / (1 + z * 0.22);
    return { sx: w / 2 + (x + ptr.x * 0.06 * (1 - z)) * unit * s, sy: h / 2 + (y + ptr.y * 0.04 * (1 - z)) * unit * s, s, unit };
  };

  function drawCell(b: Body) {
    const p = project(b.x, b.y, b.z);
    const R = b.size * p.unit * p.s;
    const squash = Math.max(0.22, Math.abs(Math.cos(b.tilt))); // apparent thickness as it tumbles
    const depthAlpha = 0.35 + 0.6 * (1 - (b.z + 1) / 2);
    ctx!.save();
    ctx!.translate(p.sx, p.sy);
    ctx!.rotate(b.rot);
    ctx!.scale(1, squash);
    // body: soft radial, darker dimple in the middle (biconcave disc)
    const g = ctx!.createRadialGradient(0, 0, R * 0.05, 0, 0, R);
    g.addColorStop(0, rgba([120, 14, 40], 0.85 * depthAlpha));
    g.addColorStop(0.45, rgba(b.hue, 0.9 * depthAlpha));
    g.addColorStop(0.85, rgba([253, 164, 175], 0.95 * depthAlpha));
    g.addColorStop(1, rgba([190, 18, 60], 0.0));
    ctx!.fillStyle = g;
    ctx!.beginPath(); ctx!.arc(0, 0, R, 0, 6.2832); ctx!.fill();
    // rim light
    ctx!.strokeStyle = rgba([255, 228, 230], 0.35 * depthAlpha);
    ctx!.lineWidth = Math.max(1, R * 0.05);
    ctx!.beginPath(); ctx!.arc(0, 0, R * 0.92, -2.4, -0.7); ctx!.stroke();
    ctx!.restore();
  }

  function drawChromosome(b: Body) {
    const p = project(b.x, b.y, b.z);
    const L = b.size * p.unit * p.s;
    const depthAlpha = 0.3 + 0.6 * (1 - (b.z + 1) / 2);
    const squash = 0.55 + 0.45 * Math.abs(Math.cos(b.tilt));
    ctx!.save();
    ctx!.translate(p.sx, p.sy);
    ctx!.rotate(b.rot);
    ctx!.scale(squash, 1);
    ctx!.lineCap = "round";
    const arms: [number, number][] = [[-0.34, -1], [0.34, -1], [-0.3, 1], [0.3, 1]]; // two chromatids crossing at the centromere
    arms.forEach(([spread, dir], i) => {
      const len = L * (dir < 0 ? 0.85 : 1.05);
      const ex = spread * len * 0.9, ey = dir * len;
      ctx!.strokeStyle = rgba(b.hue, (0.75 - i * 0.04) * depthAlpha);
      ctx!.lineWidth = L * 0.3;
      ctx!.beginPath(); ctx!.moveTo(spread * 0.12 * L, 0); ctx!.quadraticCurveTo(spread * len * 0.75, dir * len * 0.45, ex, ey); ctx!.stroke();
      // banding
      ctx!.strokeStyle = rgba([255, 255, 255], 0.22 * depthAlpha);
      ctx!.lineWidth = Math.max(1, L * 0.05);
      for (const f of [0.45, 0.7]) {
        const bx = spread * len * 0.9 * f, by = dir * len * f;
        ctx!.beginPath(); ctx!.moveTo(bx - L * 0.12, by); ctx!.lineTo(bx + L * 0.12, by); ctx!.stroke();
      }
    });
    ctx!.fillStyle = rgba([255, 255, 255], 0.5 * depthAlpha);
    ctx!.beginPath(); ctx!.arc(0, 0, L * 0.12, 0, 6.2832); ctx!.fill();
    ctx!.restore();
  }

  // The helix is drawn as a list of depth-tagged primitives so bodies can interleave with it.
  function helixItems() {
    const N = 30, turns = 2.4, halfH = 0.8, R = 0.3;
    const items: { z: number; add?: boolean; draw: () => void }[] = [];
    const spin = t * 0.9;
    let prev: { x: number; z: number; p: ReturnType<typeof project> }[] | null = null;
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1);
      const y = -halfH + f * 2 * halfH;
      const a = f * turns * 6.2832 + spin;
      const pulse = (Math.sin(t * 2.2 - f * 7) + 1) / 2;
      const pts = [0, Math.PI].map((off) => {
        const x = Math.cos(a + off) * R, z = Math.sin(a + off) * R * 1.0;
        return { x, z, p: project(x, y, z) };
      });
      const zMid = (pts[0].z + pts[1].z) / 2;
      const before = prev; prev = pts;
      // Both ends of a rung share one height, so rungs stay level instead of slanting with perspective.
      const level = project(0, y, 0).sy;
      pts.forEach((q) => { q.p.sy = level; });
      // backbone: joins each node to the one above so the two strands read as continuous, twisting ribbons
      if (before) pts.forEach((q, k) => items.push({ z: (q.z + before[k].z) / 2, add: true, draw: () => {
        const col = k === 0 ? CYAN : TEAL;
        ctx!.strokeStyle = rgba(col, 0.3 + 0.35 * (1 - (q.z + 0.45) / 0.9));
        ctx!.lineWidth = Math.max(1.5, q.p.unit * 0.016);
        ctx!.beginPath(); ctx!.moveTo(before[k].p.sx, before[k].p.sy); ctx!.lineTo(q.p.sx, q.p.sy); ctx!.stroke();
      } }));
      items.push({ z: zMid, add: true, draw: () => {
        ctx!.strokeStyle = rgba([180, 215, 255], 0.14 + pulse * 0.3);
        ctx!.lineWidth = Math.max(1, pts[0].p.unit * 0.012);
        ctx!.beginPath(); ctx!.moveTo(pts[0].p.sx, pts[0].p.sy); ctx!.lineTo(pts[1].p.sx, pts[1].p.sy); ctx!.stroke();
      } });
      pts.forEach((q, k) => items.push({ z: q.z, add: true, draw: () => {
        const col = k === 0 ? CYAN : TEAL;
        const rad = q.p.unit * 0.028 * q.p.s * (1 + pulse * 0.5);
        const al = 0.45 + 0.5 * (1 - (q.z + 0.45) / 0.9);
        const g = ctx!.createRadialGradient(q.p.sx, q.p.sy, 0, q.p.sx, q.p.sy, rad * 3);
        g.addColorStop(0, rgba(col, al)); g.addColorStop(0.35, rgba(col, al * 0.55)); g.addColorStop(1, rgba(col, 0));
        ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(q.p.sx, q.p.sy, rad * 3, 0, 6.2832); ctx!.fill();
      } }));
    }
    return items;
  }

  function draw() {
    if (!w) return;
    ctx!.clearRect(0, 0, w, h);
    const items = helixItems();
    for (const b of bodies) items.push({ z: b.z, draw: () => (b.kind === "cell" ? drawCell(b) : drawChromosome(b)) });
    items.sort((a, c) => c.z - a.z); // far (positive z) first
    // helix glow is additive; cells and chromosomes are drawn normally so they keep their colour
    for (const it of items) { ctx!.globalCompositeOperation = it.add ? "lighter" : "source-over"; it.draw(); }
    ctx!.globalCompositeOperation = "source-over";
  }

  function step(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    t += dt;
    ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
    for (const b of bodies) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vrot * dt; b.tilt += b.vtilt * dt;
      // wrap around so bodies keep floating through the frame
      if (b.x > 1.4) b.x = -1.4; if (b.x < -1.4) b.x = 1.4;
      if (b.y > 1.15) b.y = -1.15; if (b.y < -1.15) b.y = 1.15;
    }
    draw();
    if (!document.hidden) raf = requestAnimationFrame(step);
  }
  const onVis = () => { if (!document.hidden && !raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(step); } if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ptr.tx = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    ptr.ty = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
  };

  const ro = new ResizeObserver(fit);
  ro.observe(canvas);
  fit();
  if (!reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(step);
  }
  return {
    destroy() {
      cancelAnimationFrame(raf); raf = 0;
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    },
  };
}
