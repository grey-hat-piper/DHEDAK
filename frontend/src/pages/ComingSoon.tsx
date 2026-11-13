import { Link } from "react-router-dom";
import { Badge, ghostBtn, PageHeader } from "../components/ui";

interface Props { name: string; lead: string; planned: string[]; note: string }

// MedConnect and Education: deliberately non-functional. No forms, sign-ups or data of any kind.
export function ComingSoon({ name, lead, planned, note }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={name} intro={lead} badge={<Badge tone="soon">Coming soon</Badge>} />
      <section aria-labelledby="planned" className="rounded-2xl border border-white/10 p-6">
        <h2 id="planned" className="text-xs uppercase tracking-wider text-slate-400">Planned</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">{planned.map((p) => <li key={p}>{p}</li>)}</ul>
        <p className="mt-5 text-sm text-slate-500">{note}</p>
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/livemap" className={ghostBtn}>Open LiveMap</Link>
        <a href="/" className={ghostBtn}>Back to home</a>
      </div>
    </div>
  );
}

export const MedConnectPage = () => (
  <ComingSoon name="DHEDAK MedConnect" lead="Connecting healthcare providers with the medical suppliers they need."
    planned={["Provider and supplier directories", "Verified supplier profiles", "Connections between providers and suppliers"]}
    note="Not available yet. No accounts, procurement or transactions exist." />
);
export const EducationPage = () => (
  <ComingSoon name="DHEDAK Education" lead="Health education and awareness that reaches communities."
    planned={["Health education articles and learning materials", "Digital awareness campaigns", "Community programmes and campaign analytics"]}
    note="Not available yet. No courses or campaigns exist." />
);
