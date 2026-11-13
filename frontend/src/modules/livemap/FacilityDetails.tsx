import { useEffect } from "react";
import { ApiError } from "./api";
import { typeColor } from "./constants";
import { useFacilityDetail } from "./hooks";

// Only http(s) links are rendered as links; anything else is shown as text.
const safeUrl = (u: string): string | null => {
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:" ? x.href : null; } catch { return null; }
};

export default function FacilityDetails({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: f, loading, error } = useFacilityDetail(id);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const web = f ? safeUrl(f.website) : null;
  const demo = f?.data_source.startsWith("DEMO");
  return (
    <section aria-label="Facility details" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-3 md:p-4">
        <h2 className="text-lg font-medium leading-snug text-slate-50">{f?.name ?? (loading ? "Loading…" : "Facility")}</h2>
        <button type="button" onClick={onClose} aria-label="Close details" className="min-h-9 min-w-9 rounded-full border border-white/20 px-3 text-sm hover:bg-white/10">✕</button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm md:space-y-4 md:p-4 text-slate-300">
        {error && (
          <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-rose-100">
            {error instanceof ApiError && error.status === 404 ? "This facility is not available." : error.message}
          </p>
        )}
        {f && (
          <>
            {demo && <p className="rounded-lg border border-amber-300/40 bg-amber-400/10 p-3 text-amber-100">Demonstration record. Not a real facility.</p>}
            <p className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-full" style={{ background: typeColor(f.facility_type) }} />{f.facility_type_label}</p>
            <dl className="space-y-3">
              <Row label="Location">{[f.address, f.district, f.region, f.country].filter(Boolean).join(", ")}</Row>
              {f.phone && <Row label="Phone"><a className="text-cyan-300 underline" href={`tel:${f.phone.replace(/[^\d+]/g, "")}`}>{f.phone}</a></Row>}
              {f.email && <Row label="Email"><a className="text-cyan-300 underline" href={`mailto:${f.email}`}>{f.email}</a></Row>}
              {f.website && <Row label="Website">{web ? <a className="text-cyan-300 underline" href={web} target="_blank" rel="noopener noreferrer">{f.website}</a> : f.website}</Row>}
              {f.operating_hours && <Row label="Hours">{f.operating_hours}</Row>}
              <Row label="Services">{f.services.length ? f.services.map((s) => s.name).join(", ") : "None listed"}</Row>
              <Row label="Last verified">{f.last_verified ?? "Not yet verified"}</Row>
              <Row label="Data source">{f.data_source || "Not stated"}</Row>
            </dl>
          </>
        )}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-0.5">{children}</dd></div>;
}
