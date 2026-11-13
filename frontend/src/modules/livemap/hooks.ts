import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getJson } from "./api";
import { apiParams, type Filters } from "./filters";
import type { Facility, GeoCollection, Meta, NamedItem, Paginated } from "./types";

interface FetchState<T> { data: T | null; error: Error | null; loading: boolean }

// Minimal server-state hook: refetches when `key` changes (null = disabled), aborts stale requests,
// and keeps the previous data on screen while the next request is in flight (no map flicker).
export function useFetch<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, loading: key !== null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (key === null) { setState({ data: null, error: null, loading: false }); return; }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef.current(ctrl.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error: Error) => { if (!ctrl.signal.aborted) setState({ data: null, error, loading: false }); });
    return () => ctrl.abort();
  }, [key, tick]);

  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) };
}

export const useMeta = () => useFetch<Meta>("meta", (s) => getJson("/facilities/meta/", undefined, s));

export const useRegions = (country: string) =>
  useFetch<NamedItem[]>(country ? `regions:${country}` : null, (s) => getJson("/geography/regions/", new URLSearchParams({ country }), s));

export const useDistricts = (region: string) =>
  useFetch<NamedItem[]>(region ? `districts:${region}` : null, (s) => getJson("/geography/districts/", new URLSearchParams({ region }), s));

export const useFacilityDetail = (id: number | null) =>
  useFetch<Facility>(id ? `facility:${id}` : null, (s) => getJson(`/facilities/${id}/`, undefined, s));

export function useGeo(filters: Filters, bbox: string | null) {
  const params = apiParams(filters, bbox ? { bbox } : {});
  return useFetch<GeoCollection>(`geo:${params.toString()}`, (s) => getJson("/facilities/geojson/", params, s));
}

interface ListState { items: Facility[]; count: number; page: number; loading: boolean; error: Error | null; hasMore: boolean }

// Paginated, accumulating list for the sidebar ("Load more").
export function useFacilityList(filters: Filters) {
  const key = apiParams(filters).toString();
  const [state, setState] = useState<ListState>({ items: [], count: 0, page: 0, loading: true, error: null, hasMore: false });
  const ctrlRef = useRef<AbortController | null>(null);

  const load = useCallback((page: number, reset: boolean) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const params = new URLSearchParams(key);
    params.set("page", String(page));
    setState((s) => ({ ...s, loading: true, error: null, ...(reset ? { items: [], count: 0, page: 0, hasMore: false } : {}) }));
    getJson<Paginated<Facility>>("/facilities/", params, ctrl.signal)
      .then((res) => setState((s) => ({
        items: reset ? res.results : [...s.items, ...res.results],
        count: res.count, page, loading: false, error: null, hasMore: res.next !== null,
      })))
      .catch((error: Error) => { if (!ctrl.signal.aborted) setState((s) => ({ ...s, loading: false, error })); });
  }, [key]);

  useEffect(() => { load(1, true); return () => ctrlRef.current?.abort(); }, [load]);

  return {
    ...state,
    loadMore: () => { if (!state.loading && state.hasMore) load(state.page + 1, false); },
    reload: () => load(1, true),
  };
}

export const isForbidden = (e: Error | null): boolean => e instanceof ApiError && e.status === 403;
