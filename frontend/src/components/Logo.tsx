export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="DHEDAK">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#0B1F3A" />
        <path d="M20 12c0 14 24 14 24 28s-24 14-24 14" fill="none" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
        <path d="M44 12c0 14-24 14-24 28s24 14 24 14" fill="none" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" opacity=".9" />
        <circle cx="32" cy="32" r="4" fill="#fff" />
      </svg>
      <span className={`text-lg font-semibold tracking-[0.18em] ${light ? "text-white" : "text-navy-900"}`}>DHEDAK</span>
    </span>
  );
}
