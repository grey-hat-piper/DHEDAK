import { useEffect, useState, type FormEvent } from "react";
import HelixLoader from "../../components/loader/HelixLoader";
import { useAuth } from "../../auth/AuthContext";
import { Badge, EmptyState, Field, inputClass, PageHeader, primaryBtn } from "../../components/ui";
import { ApiError, getJson, sendJson } from "../../lib/http";
import { type Org, useOrg } from "./OrgContext";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Organisation administrator", data_manager: "Data manager",
  programme_manager: "Programme manager", reviewer: "Reviewer", member: "Member",
};
const TYPE_LABELS: Record<string, string> = {
  facility: "Healthcare facility", ngo: "NGO or foundation", government: "Government institution",
  research: "Research organisation", supplier: "Medical supplier", employer: "Employer",
};
const COUNTRIES: [string, string][] = [["GH", "Ghana"], ["CM", "Cameroon"], ["UG", "Uganda"]];

function CreateOrgForm({ onCreated }: { onCreated: (o: Org) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(user?.country_code || "GH");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // The backend enforces this too; the form just avoids a pointless failed request.
  if (user?.account_type === "individual") {
    return <EmptyState title="Organisation workspaces">Individual accounts cannot create organisations. Register an organisation account, or ask an administrator to add you to theirs.</EmptyState>;
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setError("");
    try {
      const org = await sendJson<Org>("POST", "/organisations/", { name: name.trim(), org_type: user?.account_type, country_code: country });
      onCreated(org); setName("");
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fields); if (!Object.keys(err.fields).length) setError(err.message); }
      else setError("Could not create the organisation.");
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4 rounded-2xl border border-white/10 p-5" noValidate>
      <h2 className="text-lg text-slate-100">Create an organisation</h2>
      <Field label="Organisation name" error={errors.name}><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} /></Field>
      <Field label="Country" error={errors.country_code}>
        <select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
      </Field>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <button className={primaryBtn} disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create organisation"}</button>
    </form>
  );
}

export function OverviewPage() {
  const { user } = useAuth();
  const { orgs, current, loading, error, reload, select } = useOrg();
  return (
    <>
      <PageHeader title={`Welcome${user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}`}
        intro="Your organisation's private workspace for facility data, imports and programmes." />
      {loading && <HelixLoader variant="panel" label="Loading your organisations" />}
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-100">{error} <button className="underline" onClick={reload}>Try again</button></p>}
      {!loading && !error && orgs.length > 0 && (
        <>
          <h2 className="mb-3 text-xs uppercase tracking-wider text-slate-400">Your organisations</h2>
          <ul className="mb-8 grid gap-3 sm:grid-cols-2">
            {orgs.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => select(o.id)} aria-pressed={o.id === current?.id}
                  className={`w-full rounded-xl border p-4 text-left transition ${o.id === current?.id ? "border-cyan-300 bg-cyan-400/10" : "border-white/10 hover:border-white/30"}`}>
                  <span className="block font-medium text-slate-100">{o.name}</span>
                  <span className="mt-1 block text-xs text-slate-400">{TYPE_LABELS[o.org_type] ?? o.org_type} · {o.country_code} · {ROLE_LABELS[o.my_role] ?? o.my_role}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!loading && !error && orgs.length === 0 && <div className="mb-6"><EmptyState title="No organisation yet">Create an organisation to start working in Management.</EmptyState></div>}
      {!loading && !error && <CreateOrgForm onCreated={() => reload()} />}
    </>
  );
}

// Sections that are structured but not yet built. They say so plainly and show no placeholder data.
function Planned({ title, intro, items }: { title: string; intro: string; items: string[] }) {
  const { current } = useOrg();
  return (
    <>
      <PageHeader title={title} intro={intro} badge={<Badge tone="build">In development</Badge>} />
      <section className="rounded-2xl border border-white/10 p-6">
        <h2 className="text-xs uppercase tracking-wider text-slate-400">What this section will do</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">{items.map((i) => <li key={i}>{i}</li>)}</ul>
        <p className="mt-5 text-sm text-slate-500">{current ? `Working in ${current.name}.` : "Create an organisation from the overview to begin."}</p>
      </section>
    </>
  );
}

export const FacilitiesPage = () => (
  <Planned title="Facilities" intro="Your organisation's facility records, from draft to published."
    items={["Add and edit facility records for your organisation", "Submit records for review", "See which records are approved, need updates or are rejected", "Publication to LiveMap is a separate permission"]} />
);
export const ImportsPage = () => (
  <Planned title="Data imports" intro="Turn spreadsheets into reviewed, trustworthy data."
    items={["Upload CSV or Excel files", "Validation and duplicate checks with a downloadable error report", "Nothing is used until an authorised reviewer approves it"]} />
);
export const IndicatorsPage = () => (
  <Planned title="Indicators" intro="Health indicators with a stated source, reference year and limitations."
    items={["Record indicators only with a declared source", "Attach reference year and known limitations", "Feeds the LiveMap health intelligence mode once reviewed"]} />
);
export const ProgrammesPage = () => (
  <Planned title="Programmes" intro="Keep health programmes on track."
    items={["Programme activities and targets", "Progress reports for your organisation", "Private to your organisation"]} />
);

interface Member { id: number; email: string; full_name: string; role: string }

export function TeamPage() {
  const { current } = useOrg();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState("");
  const orgId = current?.id;

  useEffect(() => {
    if (!orgId) { setMembers(null); return; }
    const ctrl = new AbortController();
    setMembers(null); setError("");
    getJson<Member[]>(`/organisations/${orgId}/members/`, undefined, ctrl.signal)
      .then(setMembers)
      .catch((e: Error) => { if (!ctrl.signal.aborted) setError(e.message); });
    return () => ctrl.abort();
  }, [orgId]);

  return (
    <>
      <PageHeader title="Team" intro="People with access to this organisation's workspace." />
      {!current && <EmptyState title="No organisation selected">Create or join an organisation first.</EmptyState>}
      {current && error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-100">{error}</p>}
      {current && !error && !members && <HelixLoader variant="panel" label="Loading team" />}
      {members && (
        <ul className="divide-y divide-white/10 rounded-2xl border border-white/10">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span><span className="block text-slate-100">{m.full_name || m.email}</span><span className="text-sm text-slate-400">{m.email}</span></span>
              <Badge>{ROLE_LABELS[m.role] ?? m.role}</Badge>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-slate-500">Adding and managing members arrives in a later step.</p>
    </>
  );
}
