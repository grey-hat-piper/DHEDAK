import { useEffect, useState } from "react";
import { activeFilterCount, EMPTY_FILTERS, toggle, withChange, type Filters } from "./filters";
import { useDistricts, useRegions } from "./hooks";
import { typeColor } from "./constants";
import type { Meta } from "./types";

interface Props { filters: Filters; meta: Meta | null; onChange: (f: Filters) => void }

const field = "w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 disabled:opacity-50";

export default function FilterPanel({ filters, meta, onChange }: Props) {
  const regions = useRegions(filters.country);
  const districts = useDistricts(filters.region);
  const [q, setQ] = useState(filters.q);

  useEffect(() => setQ(filters.q), [filters.q]);
  useEffect(() => {
    if (q.trim() === filters.q.trim()) return;
    const t = window.setTimeout(() => onChange({ ...filters, q }), 300);
    return () => window.clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const count = activeFilterCount(filters);
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Filter facilities">
      <label className="block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Search</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or address" className={field} maxLength={100} />
      </label>

      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Country</span>
          <select className={field} value={filters.country} onChange={(e) => onChange(withChange(filters, { country: e.target.value }))}>
            <option value="">All countries</option>
            {meta?.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Region</span>
          <select className={field} value={filters.region} disabled={!filters.country || !regions.data?.length}
            onChange={(e) => onChange(withChange(filters, { region: e.target.value }))}>
            <option value="">{!filters.country ? "Choose a country first" : regions.loading ? "Loading…" : "All regions"}</option>
            {regions.data?.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">District</span>
          <select className={field} value={filters.district} disabled={!filters.region || !districts.data?.length}
            onChange={(e) => onChange(withChange(filters, { district: e.target.value }))}>
            <option value="">{!filters.region ? "Choose a region first" : districts.loading ? "Loading…" : districts.data?.length ? "All districts" : "No districts recorded"}</option>
            {districts.data?.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-wider text-slate-400">Facility type</legend>
        <div className="flex flex-wrap gap-2">
          {meta?.facility_types.map((t) => {
            const on = filters.types.includes(t.value);
            return (
              <button key={t.value} type="button" aria-pressed={on} onClick={() => onChange({ ...filters, types: toggle(filters.types, t.value) })}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-cyan-300 bg-cyan-400/15 text-cyan-50" : "border-white/15 text-slate-300 hover:border-white/40"}`}>
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: typeColor(t.value) }} />{t.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-wider text-slate-400">Services</legend>
        <div className="flex flex-wrap gap-2">
          {meta?.services.map((s) => {
            const on = filters.services.includes(s.slug);
            return (
              <button key={s.slug} type="button" aria-pressed={on} onClick={() => onChange({ ...filters, services: toggle(filters.services, s.slug) })}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-cyan-300 bg-cyan-400/15 text-cyan-50" : "border-white/15 text-slate-300 hover:border-white/40"}`}>
                {s.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button type="button" disabled={count === 0} onClick={() => { setQ(""); onChange(EMPTY_FILTERS); }}
        className="text-sm text-cyan-300 underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline">
        Clear all filters{count ? ` (${count})` : ""}
      </button>
    </form>
  );
}
