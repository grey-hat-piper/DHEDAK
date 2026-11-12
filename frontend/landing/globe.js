import { COUNTRIES, METRICS, SOURCE } from "./data.js";

// Development basemap. Layers are discovered and restyled at runtime, so no layer ids are hardcoded.
// Replace with a production basemap/tiles before launch.
const STYLE_URL = "https://demotiles.maplibre.org/style.json";
const CODES = COUNTRIES.map((c) => c.code);

const toVec = ([lng, lat]) => {
  const f = (lat * Math.PI) / 180, l = (lng * Math.PI) / 180;
  return [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)];
};
const toLngLat = ([x, y, z]) => [(Math.atan2(y, x) * 180) / Math.PI, (Math.asin(z) * 180) / Math.PI];
function arc(a, b, n = 64) {
  const u = toVec(a), v = toVec(b);
  const d = Math.acos(Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
    out.push(toLngLat([0, 1, 2].map((k) => s1 * u[k] + s2 * v[k])));
  }
  return out;
}

export async function initGlobe(root, { reduced }) {
  const mod = await import("maplibre-gl");
  await import("maplibre-gl/dist/maplibre-gl.css");
  const maplibregl = mod.default ?? mod;

  const stage = root.querySelector("[data-globe]");
  const panel = root.querySelector("[data-panel]");
  const picker = root.querySelector("[data-countries]");
  const resetBtn = root.querySelector("[data-reset]");
  const status = root.querySelector("[data-globe-status]");
  let metric = "adults";
  let selected = null;
  let pausedUntil = 0;
  let inView = true;
  let sway = 1;

  const home = { center: [12, 6], zoom: window.innerWidth < 700 ? 1.35 : 1.9 };
  const map = new maplibregl.Map({
    container: stage, style: STYLE_URL, center: home.center, zoom: home.zoom,
    attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, maxPitch: 0,
  });
  map.touchZoomRotate.disableRotation();

  // ---------- markers (DOM) ----------
  const hubs = COUNTRIES.map((c) => {
    const el = document.createElement("div");
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "hub";
    btn.setAttribute("aria-label", `${c.name}: show diabetes estimates`);
    btn.innerHTML = `<span class="hub-core"></span><span class="hub-label"><b>${c.name}</b><i></i></span>`;
    btn.addEventListener("click", () => select(c.code));
    el.appendChild(btn);
    const marker = new maplibregl.Marker({ element: el }).setLngLat(c.lngLat).addTo(map);
    return { c, btn, marker };
  });

  function sizeMarkers() {
    const max = Math.max(...COUNTRIES.map((c) => c[metric]));
    for (const { c, btn } of hubs) {
      const d = Math.max(30, 96 * Math.sqrt(c[metric] / max)); // area proportional to value
      btn.style.setProperty("--d", `${d.toFixed(1)}px`);
      btn.querySelector("i").textContent = METRICS[metric].fmt(c[metric]);
    }
  }

  // ---------- panel ----------
  function tween(el, to, fmt) {
    if (reduced) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Number.isInteger(to) ? Math.round(to * e) : +(to * e).toFixed(1));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function renderPanel() {
    const c = COUNTRIES.find((x) => x.code === selected);
    if (!c) {
      panel.innerHTML = `<p class="panel-kicker">${SOURCE.name} · ${SOURCE.year}</p>
        <h3>Select a country</h3>
        <p class="muted">Drag the globe, or choose Ghana, Cameroon or Uganda to see modelled diabetes estimates for ${SOURCE.population.toLowerCase()}.</p>
        <p class="caveat">${SOURCE.caveat}</p>`;
      return;
    }
    panel.innerHTML = `<p class="panel-kicker">${SOURCE.name} · ${SOURCE.year}</p>
      <h3>${c.name}</h3>
      ${Object.entries(METRICS).map(([k, m]) => `
        <div class="stat ${k === metric ? "is-active" : ""}">
          <span class="stat-label">${m.label}</span>
          <span class="stat-value" data-val="${k}">${m.fmt(0)}</span>
        </div>`).join("")}
      <p class="muted">${SOURCE.population}. National estimate.</p>
      <p class="caveat">${SOURCE.caveat}</p>`;
    for (const k of Object.keys(METRICS)) tween(panel.querySelector(`[data-val="${k}"]`), c[k], METRICS[k].fmt);
  }

  // ---------- selection ----------
  function select(code) {
    selected = code;
    const c = COUNTRIES.find((x) => x.code === code);
    hubs.forEach(({ c: h, btn }) => btn.classList.toggle("is-selected", h.code === code));
    picker.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.code === code)));
    if (map.getLayer("selected-fill")) map.setFilter("selected-fill", ["==", ["get", "ADM0_A3"], code]);
    const opts = { center: c.lngLat, zoom: 3.6 };
    reduced ? map.jumpTo(opts) : map.flyTo({ ...opts, duration: 1800, essential: true });
    resetBtn.hidden = false;
    renderPanel();
  }
  function reset() {
    selected = null;
    hubs.forEach(({ btn }) => btn.classList.remove("is-selected"));
    picker.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    if (map.getLayer("selected-fill")) map.setFilter("selected-fill", ["==", ["get", "ADM0_A3"], ""]);
    reduced ? map.jumpTo(home) : map.flyTo({ ...home, duration: 1600, essential: true });
    resetBtn.hidden = true;
    renderPanel();
  }

  picker.innerHTML = COUNTRIES.map((c) => `<button type="button" data-code="${c.code}" aria-pressed="false">${c.name}</button>`).join("");
  picker.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) select(b.dataset.code); });
  resetBtn.addEventListener("click", reset);
  root.querySelectorAll('input[name="metric"]').forEach((r) =>
    r.addEventListener("change", () => { metric = r.value; sizeMarkers(); if (selected) renderPanel(); }));

  sizeMarkers();
  renderPanel();

  // ---------- globe styling + network ----------
  let arcs = [];
  map.on("style.load", () => {
    try { map.setProjection({ type: "globe" }); } catch { /* older runtime: flat map still works */ }
    try {
      map.setSky({
        "sky-color": "#0a1a36", "horizon-color": "#1b6fae", "fog-color": "#060d1b",
        "sky-horizon-blend": 0.5, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.2,
        "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
      });
    } catch { /* sky unsupported */ }

    let country = null;
    for (const l of map.getStyle().layers) {
      try {
        if (l.type === "background") map.setPaintProperty(l.id, "background-color", "#0a1730");
        else if (l.type === "fill") {
          map.setPaintProperty(l.id, "fill-color", "#10264a");
          map.setPaintProperty(l.id, "fill-opacity", 1);
          if (!country && l.source && l["source-layer"]) country = { source: l.source, sourceLayer: l["source-layer"] };
        } else if (l.type === "line") {
          map.setPaintProperty(l.id, "line-color", "#2f6aa3");
          map.setPaintProperty(l.id, "line-opacity", 0.55);
        } else if (l.type === "symbol") map.setLayoutProperty(l.id, "visibility", "none");
      } catch { /* skip layers that reject overrides */ }
    }
    if (country) {
      try {
        map.addLayer({ id: "focus-fill", type: "fill", source: country.source, "source-layer": country.sourceLayer,
          filter: ["in", ["get", "ADM0_A3"], ["literal", CODES]], paint: { "fill-color": "#1b6fae", "fill-opacity": 0.8 } });
        map.addLayer({ id: "focus-line", type: "line", source: country.source, "source-layer": country.sourceLayer,
          filter: ["in", ["get", "ADM0_A3"], ["literal", CODES]], paint: { "line-color": "#67e8f9", "line-width": 1.2, "line-opacity": 0.9 } });
        map.addLayer({ id: "selected-fill", type: "fill", source: country.source, "source-layer": country.sourceLayer,
          filter: ["==", ["get", "ADM0_A3"], ""], paint: { "fill-color": "#2dd4bf", "fill-opacity": 0.55 } });
      } catch { /* highlight is an enhancement; markers still identify the countries */ }
    }

    const pairs = [[0, 1], [1, 2], [0, 2]];
    arcs = pairs.map(([a, b]) => arc(COUNTRIES[a].lngLat, COUNTRIES[b].lngLat));
    map.addSource("links", { type: "geojson", data: { type: "FeatureCollection",
      features: arcs.map((coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } })) } });
    map.addLayer({ id: "links", type: "line", source: "links", paint: { "line-color": "#22d3ee", "line-width": 1.4, "line-opacity": 0.5 } });
    map.addSource("pulses", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({ id: "pulse-glow", type: "circle", source: "pulses", paint: { "circle-radius": 9, "circle-color": "#67e8f9", "circle-opacity": 0.18, "circle-blur": 1 } });
    map.addLayer({ id: "pulse-core", type: "circle", source: "pulses", paint: { "circle-radius": 2.6, "circle-color": "#e0fbff" } });
    if (status) status.hidden = true;
    requestAnimationFrame(tick);
  });

  map.on("error", (e) => {
    if (status && !map.isStyleLoaded()) { status.hidden = false; status.textContent = "The basemap could not be loaded. Check your connection and reload."; }
    console.warn("map error", e && e.error);
  });

  // ---------- motion: idle rotation + travelling pulses ----------
  const pause = (ms = 6000) => { pausedUntil = performance.now() + ms; };
  ["pointerdown", "wheel", "touchstart", "keydown"].forEach((ev) => stage.addEventListener(ev, () => pause(), { passive: true }));
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(stage);

  let lastT = performance.now();
  function tick(now) {
    const dt = Math.min(now - lastT, 64); lastT = now;
    if (inView && !document.hidden && arcs.length) {
      if (!reduced) {
        const src = map.getSource("pulses");
        if (src) {
          src.setData({ type: "FeatureCollection", features: arcs.map((a, k) => {
            const t = (now * 0.00006 + k / arcs.length) % 1;
            return { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: a[Math.floor(t * (a.length - 1))] } };
          }) });
        }
        if (!selected && now > pausedUntil && !map.isMoving()) {
          // sway around Africa rather than spinning away from it
          const c = map.getCenter();
          const off = ((c.lng - home.center[0] + 540) % 360) - 180;
          if (off > 48) sway = -1; else if (off < -48) sway = 1;
          map.jumpTo({ center: [c.lng + sway * dt * 0.006, c.lat] });
        }
      }
    }
    requestAnimationFrame(tick);
  }
  return map;
}
