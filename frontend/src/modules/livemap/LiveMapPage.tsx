import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FacilityDetails from "./FacilityDetails";
import FacilityList from "./FacilityList";
import FilterPanel from "./FilterPanel";
import LiveMapCanvas from "./LiveMapCanvas";
import { TYPE_COLORS } from "./constants";
import { activeFilterCount, filtersFromParams, filtersToParams, type Filters } from "./filters";
import { isForbidden, useFacilityList, useGeo, useMeta } from "./hooks";

export default function LiveMapPage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const selected = /^\d+$/.test(params.get("f") ?? "") ? Number(params.get("f")) : null;
  const [view, setView] = useState<"map" | "list">("map");
  const [bbox, setBbox] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false); // mobile only; filters are always visible on desktop

  const meta = useMeta();
  const list = useFacilityList(filters);
  // Viewport-limited fetching only kicks in once the unrestricted result was capped by the API.
  const geo = useGeo(filters, truncated ? bbox : null);
  const capped = geo.data?.truncated ?? false;

  const setFilters = useCallback((f: Filters) => {
    setTruncated(false);
    setParams((p) => filtersToParams(f, p), { replace: true });
  }, [setParams]);
  const select = useCallback((id: number | null) => {
    setParams((p) => { const n = new URLSearchParams(p); if (id) n.set("f", String(id)); else n.delete("f"); return n; }, { replace: true });
  }, [setParams]);
  const onViewport = useCallback((b: string | null) => setBbox(b), []);
  // Once a response is capped, switch to viewport mode; stays on until filters change.
  if (capped && !truncated && geo.data) setTruncated(true);

  const forbidden = isForbidden(list.error) || isForbidden(geo.error);

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <a href="/" className="text-sm font-semibold tracking-wide">DHEDAK</a>
          <nav aria-label="LiveMap modes" className="flex gap-1 text-sm">
            <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-cyan-100" aria-current="page">Facilities</span>
            <span className="hidden rounded-full px-3 py-1 text-slate-500 md:inline" aria-disabled="true" title="Coming next">Health intelligence · soon</span>
          </nav>
        </div>
        <div className="flex gap-1 md:hidden" role="group" aria-label="View">
          {(["map", "list"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={`min-h-9 rounded-full px-4 text-sm ${view === v ? "bg-cyan-400/20 text-cyan-50" : "text-slate-300"}`}>{v === "map" ? "Map" : "List"}</button>
          ))}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <aside className={`${view === "list" ? "flex" : "hidden"} w-full flex-col gap-4 overflow-y-auto border-r border-white/10 p-3 md:flex md:w-[22rem] md:shrink-0 md:gap-5 md:p-4`}>
          {meta.error && <p role="alert" className="text-sm text-rose-200">Filters could not load. {meta.error.message}</p>}
          <button type="button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} aria-controls="filters"
            className="flex min-h-11 items-center justify-between rounded-xl border border-white/15 px-4 text-sm md:hidden">
            <span>Filters{activeFilterCount(filters) ? ` (${activeFilterCount(filters)})` : ""}</span><span aria-hidden>{showFilters ? "−" : "+"}</span>
          </button>
          <div id="filters" className={`${showFilters ? "block" : "hidden"} md:block`}>
            <FilterPanel filters={filters} meta={meta.data} onChange={setFilters} />
          </div>
          <FacilityList items={list.items} count={list.count} loading={list.loading} error={list.error} forbidden={forbidden}
            hasMore={list.hasMore} selectedId={selected} onSelect={(id) => { select(id); setView("map"); }} onLoadMore={list.loadMore} onRetry={list.reload} />
        </aside>

        <main className={`${view === "map" ? "block" : "hidden"} relative min-w-0 flex-1 md:block`}>
          <LiveMapCanvas data={geo.data} selectedId={selected} onSelect={select} onViewport={onViewport} onError={setMapError} fit={!truncated} />
          <button type="button" onClick={() => { setView("list"); setShowFilters(true); }}
            className="absolute left-3 right-3 top-3 z-[5] flex min-h-11 items-center justify-between rounded-full border border-white/15 bg-slate-900/90 px-4 text-sm shadow-lg backdrop-blur md:hidden">
            <span>Search and filter</span>
            <span className="text-slate-400">{activeFilterCount(filters) ? `${activeFilterCount(filters)} active · ` : ""}{list.count.toLocaleString()} found</span>
          </button>
          {mapError && <p role="alert" className="absolute left-3 right-3 top-16 max-w-sm rounded-lg bg-rose-950/90 md:top-3 md:right-auto p-3 text-sm text-rose-100">Basemap problem: {mapError}</p>}
          {geo.error && !forbidden && <p role="alert" className="absolute left-3 right-3 top-16 rounded-lg bg-rose-950/90 p-3 text-sm text-rose-100 md:top-3 md:right-auto">{geo.error.message} <button className="underline" onClick={geo.reload}>Retry</button></p>}
          {geo.data && geo.data.features.length === 0 && !geo.loading && (
            <p className="pointer-events-none absolute left-1/2 top-[4.5rem] -translate-x-1/2 whitespace-nowrap md:top-4 rounded-full bg-slate-900/90 px-4 py-2 text-sm text-slate-200">No facilities in this view</p>
          )}
          {capped && <p className="absolute bottom-3 left-3 right-3 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-amber-100 md:right-auto">Showing facilities in view. Zoom in or add filters to see more.</p>}
          <ul aria-label="Legend" className="absolute bottom-8 left-3 hidden rounded-lg bg-slate-900/90 p-2 text-xs sm:block">
            {Object.entries(TYPE_COLORS).map(([k, c]) => (
              <li key={k} className="flex items-center gap-2 py-0.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{k.replace("_", " ")}</li>
            ))}
          </ul>
          {selected && (
            <div className="absolute inset-x-0 bottom-0 z-10 max-h-[55%] overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)] border border-white/10 bg-slate-950/95 shadow-2xl md:inset-y-3 md:left-auto md:right-3 md:max-h-none md:w-80 md:rounded-2xl">
              <FacilityDetails id={selected} onClose={() => select(null)} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
