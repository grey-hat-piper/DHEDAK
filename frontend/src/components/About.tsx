const steps = [
  ["EDUCATE", "Make reliable health information easier to understand."],
  ["CONNECT", "Help people find verified healthcare services."],
  ["RESOURCE", "Strengthen links between providers and suppliers."],
  ["TRACK & IMPROVE", "Organise data, monitor programmes and learn from results."],
];

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-5 py-20">
      <h2 className="text-3xl font-semibold">About DHEDAK</h2>
      <p className="mt-3 max-w-3xl text-ink-600">
        Health information creates impact when people can understand it, find the right service and access support. DHEDAK aims to close that gap across Ghana, Cameroon and Uganda, with an architecture ready for more African countries.
      </p>
      <ol className="mt-10 grid gap-4 md:grid-cols-4">
        {steps.map(([title, text], i) => (
          <li key={title} className="rounded-xl border border-line p-5">
            <span className="text-xs font-semibold text-teal-brand">{i + 1}</span>
            <h3 className="mt-1 font-semibold tracking-wide">{title}</h3>
            <p className="mt-2 text-sm text-ink-600">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
