export default function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-light tracking-tight">{title}</h1>
      <p className="mt-4 text-slate-400">This page is not built yet. It is scheduled for a later development phase.</p>
      <a href="/" className="mt-8 rounded-full border border-cyan-400/50 px-6 py-2.5 text-cyan-200 hover:bg-cyan-400/10">Back to home</a>
    </main>
  );
}
