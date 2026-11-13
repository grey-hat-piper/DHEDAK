import { typeColor } from "./constants";
import type { Facility } from "./types";

interface Props {
  items: Facility[]; count: number; loading: boolean; error: Error | null; forbidden: boolean;
  hasMore: boolean; selectedId: number | null;
  onSelect: (id: number) => void; onLoadMore: () => void; onRetry: () => void;
}

export default function FacilityList({ items, count, loading, error, forbidden, hasMore, selectedId, onSelect, onLoadMore, onRetry }: Props) {
  if (error && items.length === 0) {
    return (
      <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-4 text-sm text-rose-100">
        <p>{forbidden ? "You do not have permission to view this data." : error.message}</p>
        {!forbidden && <button onClick={onRetry} className="mt-3 rounded-full border border-rose-300/50 px-4 py-1.5 hover:bg-rose-400/10">Try again</button>}
      </div>
    );
  }
  if (!loading && items.length === 0) {
    return <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-300">No facilities match these filters. Try removing a filter or widening your search.</p>;
  }
  return (
    <div>
      <p className="mb-2 text-xs text-slate-400" aria-live="polite">{loading && items.length === 0 ? "Loading facilities…" : `${count.toLocaleString()} ${count === 1 ? "facility" : "facilities"}`}</p>
      <ul className="space-y-2">
        {items.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => onSelect(f.id)} aria-current={f.id === selectedId ? "true" : undefined}
              className={`w-full rounded-lg border p-3 text-left transition ${f.id === selectedId ? "border-cyan-300 bg-cyan-400/10" : "border-white/10 hover:border-white/30"}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-100">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: typeColor(f.facility_type) }} />{f.name}
              </span>
              <span className="mt-1 block text-xs text-slate-400">{f.facility_type_label}{f.district ? ` · ${f.district}` : f.region ? ` · ${f.region}` : ""}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-sm text-rose-200">{error.message}</p>}
      {hasMore && (
        <button type="button" onClick={onLoadMore} disabled={loading}
          className="mt-3 w-full rounded-full border border-white/20 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50">
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
