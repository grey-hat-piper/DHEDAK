// Pure filter logic: URL <-> filter state <-> API query. No React, so it is unit-testable.
export interface Filters {
  q: string;
  country: string;
  region: string;
  district: string;
  types: string[];
  services: string[];
}

export const EMPTY_FILTERS: Filters = { q: "", country: "", region: "", district: "", types: [], services: [] };

const csv = (v: string | null): string[] => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

export function filtersFromParams(p: URLSearchParams): Filters {
  return {
    q: p.get("q") ?? "",
    country: (p.get("country") ?? "").toUpperCase(),
    region: /^\d+$/.test(p.get("region") ?? "") ? (p.get("region") as string) : "",
    district: /^\d+$/.test(p.get("district") ?? "") ? (p.get("district") as string) : "",
    types: csv(p.get("type")),
    services: csv(p.get("service")),
  };
}

function write(p: URLSearchParams, key: string, value: string) {
  if (value) p.set(key, value);
  else p.delete(key);
}

// Writes filters into a copy of `base`, preserving unrelated params (e.g. the selected facility `f`).
export function filtersToParams(f: Filters, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const p = new URLSearchParams(base);
  write(p, "q", f.q.trim());
  write(p, "country", f.country);
  write(p, "region", f.region);
  write(p, "district", f.district);
  write(p, "type", f.types.join(","));
  write(p, "service", f.services.join(","));
  return p;
}

// Query for the public API. Fixed key order so the string doubles as a stable cache/effect key.
export function apiParams(f: Filters, extra: Record<string, string> = {}): URLSearchParams {
  const p = new URLSearchParams();
  write(p, "country", f.country);
  write(p, "region", f.region);
  write(p, "district", f.district);
  write(p, "type", f.types.join(","));
  write(p, "service", f.services.join(","));
  write(p, "q", f.q.trim());
  for (const [k, v] of Object.entries(extra)) write(p, k, v);
  return p;
}

export const activeFilterCount = (f: Filters): number =>
  [f.q.trim(), f.country, f.region, f.district].filter(Boolean).length + f.types.length + f.services.length;

export function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Selecting a country invalidates region/district; selecting a region invalidates district.
export function withChange(current: Filters, change: Partial<Filters>): Filters {
  const next = { ...current, ...change };
  if ("country" in change && change.country !== current.country) { next.region = ""; next.district = ""; }
  if ("region" in change && change.region !== current.region) next.district = "";
  return next;
}

// Viewport -> the API's bbox=west,south,east,north. Clamped to valid ranges and rounded for stable keys.
export function bboxString(west: number, south: number, east: number, north: number): string | null {
  const r = (n: number) => Math.round(n * 1e4) / 1e4;
  const w = Math.max(-180, r(west)), e = Math.min(180, r(east)), s = Math.max(-85, r(south)), n = Math.min(85, r(north));
  return w < e && s < n ? `${w},${s},${e},${n}` : null;
}
