import { Link, Outlet } from "react-router-dom";
import ServicesMenu from "../components/ServicesMenu";
import { useAuth } from "../auth/AuthContext";

// Shared chrome for non-map pages: top bar, account actions, footer. LiveMap is full-screen and has its own header.
export default function SiteLayout() {
  const { user, status, logout } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <a href="/" className="text-sm font-semibold tracking-[0.2em]">DHEDAK</a>
          <nav aria-label="Primary" className="order-3 flex w-full items-center gap-1 text-sm md:order-none md:w-auto">
            <a href="/#about" className="rounded-full px-3 py-1.5 text-slate-300 hover:text-white">About</a>
            <ServicesMenu />
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {status === "authed" && user ? (
              <>
                <span className="hidden max-w-40 truncate text-slate-400 sm:inline">{user.full_name || user.email}</span>
                <button type="button" onClick={() => void logout()} className="rounded-full border border-white/20 px-4 py-1.5 hover:bg-white/5">Sign out</button>
              </>
            ) : status === "anon" ? (
              <>
                <Link to="/signin" className="px-3 py-1.5 text-slate-300 hover:text-white">Sign in</Link>
                <Link to="/register" className="rounded-full bg-cyan-400 px-4 py-1.5 font-medium text-slate-950 hover:bg-cyan-300">Get started</Link>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12"><Outlet /></main>
      <footer className="border-t border-white/10 px-4 py-6 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2">
          <Link to="/methodology" className="hover:text-slate-300">Data and methodology</Link>
          <Link to="/privacy" className="hover:text-slate-300">Privacy policy</Link>
          <Link to="/terms" className="hover:text-slate-300">Terms of service</Link>
        </div>
      </footer>
    </div>
  );
}
