import { Link } from "react-router-dom";

export default function Placeholder({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-4 text-ink-600">This page is not built yet. It is scheduled in a later development phase.</p>
      <Link to="/" className="mt-8 inline-block rounded-full bg-navy-900 px-6 py-2.5 text-white hover:bg-navy-700">Back to home</Link>
    </section>
  );
}
