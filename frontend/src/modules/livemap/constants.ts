// Marker colours per facility type. Keep in sync with the landing-page illustration palette.
export const TYPE_COLORS: Record<string, string> = {
  hospital: "#38bdf8",
  clinic: "#2dd4bf",
  pharmacy: "#c4b5fd",
  laboratory: "#fbbf24",
  primary_healthcare: "#a3e635",
};
export const FALLBACK_COLOR = "#94a3b8";
export const typeColor = (type: string): string => TYPE_COLORS[type] ?? FALLBACK_COLOR;

// Development basemap (MapLibre demo tiles). Set VITE_BASEMAP_STYLE_URL to a production style before launch.
export const BASEMAP_STYLE_URL: string =
  (import.meta.env?.VITE_BASEMAP_STYLE_URL as string | undefined) ?? "https://demotiles.maplibre.org/style.json";
export const DEFAULT_VIEW = { center: [12, 6] as [number, number], zoom: 3 };
