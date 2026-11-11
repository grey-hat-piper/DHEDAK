import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import Footer from "../components/Footer";

const links: [string, string][] = [
  ["/#about", "About DHEDAK"],
  ["/#services", "Our Services"],
  ["/livemap", "LiveMap"],
  ["/management", "Management"],
  ["/#contact", "Contact"],
];

export default function SiteLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link to="/"><Logo /></Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium text-ink-600 lg:flex">
            {links.map(([to, label]) => (
              <Link key={to} to={to} className="hover:text-navy-900">{label}</Link>
            ))}
            <Link to="/signin" className="hover:text-navy-900">Sign In</Link>
            <Link to="/register" className="rounded-full bg-navy-900 px-5 py-2 text-white hover:bg-navy-700">Get Started</Link>
          </nav>
          <button className="rounded-md border border-line px-3 py-2 text-sm lg:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="flex flex-col gap-1 border-t border-line px-5 py-3 lg:hidden">
            {[...links, ["/signin", "Sign In"], ["/register", "Get Started"]].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 text-ink-600 hover:bg-surface">{label}</Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
