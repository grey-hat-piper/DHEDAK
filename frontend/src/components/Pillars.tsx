import { Link } from "react-router-dom";

interface Pillar {
  name: string;
  blurb: string;
  active: boolean;
  to?: string;
  accent: string;
}

const pillars: Pillar[] = [
  { name: "DHEDAK LiveMap", blurb: "Healthcare facility discovery and geographical health intelligence.", active: true, to: "/livemap", accent: "border-t-brand-600" },
  { name: "DHEDAK Management", blurb: "Health data intelligence, programme monitoring and reporting.", active: true, to: "/management", accent: "border-t-teal-brand" },
  { name: "DHEDAK MedConnect", blurb: "Healthcare provider and medical supplier connections.", active: false, accent: "border-t-slate-300" },
  { name: "DHEDAK Education", blurb: "Health education, awareness campaigns and community engagement.", active: false, accent: "border-t-slate-300" },
];

export default function Pillars() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-5 py-20">
      <h2 className="text-3xl font-semibold">Our services</h2>
      <p className="mt-2 max-w-2xl text-ink-600">Four connected pillars. Two are in development for the first release; two are planned.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => {
          const body = (
            <>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${p.active ? "bg-teal-brand/10 text-teal-brand" : "bg-slate-200 text-slate-600"}`}>
                {p.active ? "ACTIVE" : "COMING SOON"}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm text-ink-600">{p.blurb}</p>
            </>
          );
          const base = `rounded-xl border border-line border-t-4 ${p.accent} p-6`;
          return p.active && p.to ? (
            <Link key={p.name} to={p.to} className={`${base} bg-white shadow-sm transition hover:shadow-md`}>{body}</Link>
          ) : (
            <div key={p.name} className={`${base} bg-surface opacity-80`} aria-disabled="true">{body}</div>
          );
        })}
      </div>
    </section>
  );
}
