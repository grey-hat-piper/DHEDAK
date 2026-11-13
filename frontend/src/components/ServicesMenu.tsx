import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const SERVICES = [
  { to: "/livemap", name: "LiveMap", blurb: "Find verified health facilities", color: "#38bdf8" },
  { to: "/management", name: "Management", blurb: "Reviewed data and programmes", color: "#2dd4bf" },
  { to: "/medconnect", name: "MedConnect", blurb: "Providers and suppliers", color: "#a78bfa", soon: true },
  { to: "/education", name: "Education", blurb: "Health awareness for communities", color: "#fbbf24", soon: true },
];

// The four pillars, reachable from every page's header. Opens on click or keyboard; closes on outside click, Escape or navigation.
export default function ServicesMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={root} className="services-menu relative" data-open={open} onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls="services-panel" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-300 hover:text-white">
        Our Services
        <svg className="services-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div id="services-panel" className="services-panel absolute left-0 top-full z-30 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl">
        <ul>
          {SERVICES.map((s, i) => (
            <li key={s.to} style={{ "--i": i } as React.CSSProperties}>
              <Link to={s.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5">
                <i aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }} />
                <span>
                  <b className="block text-sm font-medium text-slate-100">
                    {s.name}
                    {s.soon && <em className="ml-2 rounded-full border border-amber-300/40 px-2 py-px align-[1px] text-[10px] font-normal uppercase not-italic tracking-wider text-amber-200">Soon</em>}
                  </b>
                  <small className="block text-xs text-slate-400">{s.blurb}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <a href="/#services" className="mt-1 block border-t border-white/10 px-3 py-2.5 text-xs text-cyan-300">See all services</a>
      </div>
    </div>
  );
}
