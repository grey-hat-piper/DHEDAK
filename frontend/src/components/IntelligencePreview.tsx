import { diabetesIndicator as d } from "../content/indicators";

export default function IntelligencePreview() {
  const max = Math.max(...d.rows.map((r) => r.adults));
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-20">
        <h2 className="text-3xl font-semibold">Health intelligence preview</h2>
        <p className="mt-2 max-w-2xl text-ink-600">{d.name}, {d.referenceYear}.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          <div className="rounded-xl border border-line bg-white p-6 lg:col-span-3">
            <ul className="space-y-5">
              {d.rows.map((r) => (
                <li key={r.country}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{r.country}</span>
                    <span>{r.adults.toLocaleString("en-GB")} adults (estimated)</span>
                  </div>
                  <div className="mt-1.5 h-3 rounded-full bg-slate-100" role="img" aria-label={`${r.country}: ${r.adults.toLocaleString("en-GB")} estimated adults`}>
                    <div className="h-3 rounded-full bg-brand-600" style={{ width: `${(r.adults / max) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-ink-600">Age-standardised prevalence {r.prevalence}% · estimated undiagnosed share {r.undiagnosed}%</p>
                </li>
              ))}
            </ul>
          </div>
          <dl className="rounded-xl border border-line bg-white p-6 text-sm lg:col-span-2">
            {[
              ["Source", d.source],
              ["Reference year", String(d.referenceYear)],
              ["Geographic scope", d.scope],
              ["Population", d.population],
              ["Definition", d.definition],
              ["Limitations", d.limitations],
            ].map(([k, v]) => (
              <div key={k} className="mb-3 last:mb-0">
                <dt className="font-semibold">{k}</dt>
                <dd className="text-ink-600">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-4 text-xs text-ink-600">Static example from the DHEDAK briefing. Live indicators will come from approved, sourced datasets.</p>
      </div>
    </section>
  );
}
