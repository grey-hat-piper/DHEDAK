import type { ReactNode } from "react";
import { Badge, PageHeader } from "../components/ui";

function Doc({ title, draft = true, children }: { title: string; draft?: boolean; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-slate-300">
      <PageHeader title={title} badge={draft ? <Badge>Draft</Badge> : undefined} />
      {children}
    </article>
  );
}
const H = ({ children }: { children: ReactNode }) => <h2 className="pt-4 text-lg text-slate-100">{children}</h2>;

export const MethodologyPage = () => (
  <Doc title="Data and methodology" draft={false}>
    <p>DHEDAK shows health facility information and, later, health intelligence indicators. This page explains how data is handled.</p>
    <H>Facility data</H>
    <p>Only records that have been reviewed and approved are shown publicly. Every record carries its data source and the date it was last verified. Some records are labelled demonstration data. These are not real facilities.</p>
    <H>Sensitive services</H>
    <p>Facilities offering sensitive services are hidden from public views until a reviewer has explicitly cleared them.</p>
    <H>Intelligence indicators</H>
    <p>Indicators will always show their source, reference year and limitations. DHEDAK does not publish figures without a stated source.</p>
    <H>Limits</H>
    <p>Data may be incomplete or out of date. Always confirm details with the facility before travelling or relying on a service.</p>
  </Doc>
);

export const PrivacyPage = () => (
  <Doc title="Privacy policy">
    <p>This policy is a draft and is pending legal review before launch. It will be replaced by the final text.</p>
    <H>What we aim to follow</H>
    <p>DHEDAK collects only the account details needed to run the service. Each organisation's workspace is private to its members. DHEDAK does not handle individual patient or survivor case records.</p>
  </Doc>
);

export const TermsPage = () => (
  <Doc title="Terms of service">
    <p>These terms are a draft and are pending legal review before launch. They will be replaced by the final text.</p>
    <H>Important</H>
    <p>DHEDAK provides information to support decisions. It does not provide medical advice, diagnosis or treatment. In an emergency, contact local emergency services.</p>
  </Doc>
);
