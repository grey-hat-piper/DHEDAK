import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE_URL, DEFAULT_VIEW, FALLBACK_COLOR, TYPE_COLORS } from "./constants";
import { bboxString } from "./filters";
import type { GeoCollection } from "./types";

interface Props {
  data: GeoCollection | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onViewport: (bbox: string | null) => void;
  onError: (message: string) => void;
  /** Fit the view to the data when it changes (off while viewport-driven refetching is active). */
  fit: boolean;
}

const SRC = "facilities";
const colorExpr: maplibregl.ExpressionSpecification = [
  "match", ["get", "facility_type"],
  ...Object.entries(TYPE_COLORS).flat(),
  FALLBACK_COLOR,
] as maplibregl.ExpressionSpecification;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EMPTY = { type: "FeatureCollection", features: [] } as const;

export default function LiveMapCanvas({ data, selectedId, onSelect, onViewport, onError, fit }: Props) {
  const [isReady, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const latest = useRef({ data, selectedId, onSelect, onViewport, onError });
  latest.current = { data, selectedId, onSelect, onViewport, onError };
  const fitted = useRef("");

  useEffect(() => {
    if (!box.current) return;
    const map = new maplibregl.Map({
      container: box.current,
      style: BASEMAP_STYLE_URL,
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource(SRC, { type: "geojson", data: EMPTY as never, cluster: true, clusterRadius: 46, clusterMaxZoom: 11 });
      map.addLayer({ id: "clusters", type: "circle", source: SRC, filter: ["has", "point_count"],
        paint: { "circle-color": "#0e7490", "circle-opacity": 0.85, "circle-stroke-color": "#67e8f9", "circle-stroke-width": 1.5,
          "circle-radius": ["step", ["get", "point_count"], 16, 25, 20, 100, 26] } });
      map.addLayer({ id: "cluster-count", type: "symbol", source: SRC, filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Open Sans Semibold"] },
        paint: { "text-color": "#ecfeff" } });
      map.addLayer({ id: "points", type: "circle", source: SRC, filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": colorExpr, "circle-radius": 7, "circle-stroke-color": "#06101f", "circle-stroke-width": 1.5 } });
      map.addLayer({ id: "selected", type: "circle", source: SRC, filter: ["==", ["get", "id"], -1],
        paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": 12, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 } });
      ready.current = true;
      setReady(true);
    });

    map.on("click", "clusters", async (e) => {
      const f = e.features?.[0] as MapGeoJSONFeature | undefined;
      if (!f) return;
      const src = map.getSource(SRC) as GeoJSONSource;
      try {
        const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number);
        map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom, duration: reducedMotion() ? 0 : 500 });
      } catch { /* cluster vanished mid-click; ignore */ }
    });
    map.on("click", "points", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "number") latest.current.onSelect(id);
    });
    for (const layer of ["clusters", "points"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }

    let timer: number | undefined;
    map.on("moveend", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const b = map.getBounds();
        latest.current.onViewport(bboxString(b.getWest(), b.getSouth(), b.getEast(), b.getNorth()));
      }, 350);
    });
    map.on("error", (e) => {
      // Only surface basemap failures once; the facility layer is independent of tiles.
      if (!ready.current) latest.current.onError(e.error?.message ?? "The map could not load.");
    });

    return () => { window.clearTimeout(timer); ready.current = false; map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    (map.getSource(SRC) as GeoJSONSource | undefined)?.setData((data ?? EMPTY) as never);
  }, [data, isReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current || !map.getLayer("selected")) return;
    map.setFilter("selected", ["==", ["get", "id"], selectedId ?? -1]);
    const feat = data?.features.find((f) => f.id === selectedId);
    if (feat) map.easeTo({ center: feat.geometry.coordinates, zoom: Math.max(map.getZoom(), 12), duration: reducedMotion() ? 0 : 600 });
  }, [selectedId, isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit to results when the filter set changes (not on every viewport refetch).
  useEffect(() => {
    const map = mapRef.current;
    if (!fit || !map || !ready.current || !data || data.features.length === 0) return;
    const key = data.features.map((f) => f.id).join(",");
    if (key === fitted.current) return;
    fitted.current = key;
    const b = new maplibregl.LngLatBounds();
    data.features.forEach((f) => b.extend(f.geometry.coordinates));
    map.fitBounds(b, { padding: 70, maxZoom: 13, duration: reducedMotion() ? 0 : 700 });
  }, [data, fit, isReady]);

  return <div ref={box} className="livemap-canvas" role="region" aria-label="Facility map" />;
}
