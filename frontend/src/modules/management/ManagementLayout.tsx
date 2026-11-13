import { NavLink, Outlet } from "react-router-dom";
import { Badge } from "../../components/ui";
import { OrgProvider, useOrg } from "./OrgContext";

const sections = [
  { to: "", label: "Overview", end: true },
  { to: "facilities", label: "Facilities" },
  { to: "imports", label: "Data imports" },
  { to: "indicators", label: "Indicators" },
  { to: "programmes", label: "Programmes" },
  { to: "team", label: "Team" },
];

function OrgSwitcher() {
  const { orgs, current, select } = useOrg();
  if (orgs.length === 0) return <p className="text-sm text-slate-500">No organisation yet</p>;
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-slate-500">Organisation</span>
      <select value={current?.id ?? ""} onChange={(e) => select(Number(e.target.value))}
        className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100">
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

function Shell() {
  return (
    <div className="grid gap-6 md:grid-cols-[14rem_1fr] md:gap-10">
      <aside className="space-y-4">
        <div className="flex items-center gap-2"><h2 className="text-sm font-semibold tracking-wide">Management</h2><Badge tone="build">Early access</Badge></div>
        <OrgSwitcher />
        <nav aria-label="Management sections" className="-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:flex-col md:overflow-visible">
          {sections.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.end}
              className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? "bg-cyan-400/15 text-cyan-50" : "text-slate-300 hover:bg-white/5"}`}>
              {s.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0"><Outlet /></section>
    </div>
  );
}

export default function ManagementLayout() {
  return <OrgProvider><Shell /></OrgProvider>;
}
