import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-50";
export const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-400 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50";
export const ghostBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm text-slate-100 transition hover:bg-white/5";

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "soon" | "build"; children: ReactNode }) {
  const tones = {
    neutral: "border-white/20 text-slate-300",
    soon: "border-amber-300/50 bg-amber-400/10 text-amber-100",
    build: "border-cyan-300/40 bg-cyan-400/10 text-cyan-100",
  };
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs uppercase tracking-wider ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, intro, badge }: { title: string; intro?: string; badge?: ReactNode }) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-light tracking-tight text-slate-50 md:text-3xl">{title}</h1>
        {badge}
      </div>
      {intro && <p className="mt-2 max-w-2xl text-slate-400">{intro}</p>}
    </header>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
      <h2 className="text-lg text-slate-100">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-sm text-rose-300">{error}</span>}
    </label>
  );
}
