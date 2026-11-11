import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Approximate country centre points [lng, lat], used only to place highlight markers.
const HUBS: { name: string; lngLat: [number, number] }[] = [
  { name: "Ghana", lngLat: [-1.0, 7.9] },
  { name: "Cameroon", lngLat: [12.4, 5.7] },
  { name: "Uganda", lngLat: [32.3, 1.4] },
];

// Public MapLibre demo style: fine for development; replace with a production basemap before launch.
const STYLE_URL = "https://demotiles.maplibre.org/style.json";

export default function HeroGlobe() {
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: STYLE_URL,
        center: [14, 6],
        zoom: 2.1,
        interactive: false,
        attributionControl: { compact: true },
      });
    } catch {
      setFailed(true);
      return;
    }

    const markers: maplibregl.Marker[] = [];
    let raf = 0;

    map.on("error", () => undefined);
    map.on("style.load", () => {
      map.setProjection({ type: "globe" });

      map.addSource("links", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            [HUBS[0], HUBS[1]],
            [HUBS[1], HUBS[2]],
            [HUBS[0], HUBS[2]],
          ].map(([a, b]) => ({
            type: "Feature" as const,
            properties: {},
            geometry: { type: "LineString" as const, coordinates: [a.lngLat, b.lngLat] },
          })),
        },
      });
      map.addLayer({
        id: "links",
        type: "line",
        source: "links",
        paint: { "line-color": "#22b8cf", "line-width": 1.5, "line-opacity": 0.7, "line-dasharray": [2, 2] },
      });

      HUBS.forEach((hub) => {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center";
        el.innerHTML = `<span class="relative flex h-3 w-3"><span class="${
          reduced ? "" : "animate-ping "
        }absolute inline-flex h-full w-full rounded-full bg-cyan-brand opacity-60"></span><span class="relative inline-flex h-3 w-3 rounded-full bg-cyan-brand ring-2 ring-white"></span></span><span class="mt-1 rounded bg-navy-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">${hub.name}</span>`;
        markers.push(new maplibregl.Marker({ element: el }).setLngLat(hub.lngLat).addTo(map));
      });

      if (!reduced) {
        // Slow drift of the dash pattern; stops entirely under reduced motion.
        let t = 0;
        const tick = () => {
          t += 0.02;
          map.setPaintProperty("links", "line-opacity", 0.45 + 0.3 * Math.abs(Math.sin(t)));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, [reduced]);

  if (failed) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-600">Interactive globe unavailable on this device.</div>;
  }
  return (
    <div
      ref={container}
      className="h-full w-full"
      role="img"
      aria-label="Globe centred on Africa highlighting Ghana, Cameroon and Uganda"
    />
  );
}
