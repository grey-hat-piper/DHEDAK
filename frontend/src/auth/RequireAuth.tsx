import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const loc = useLocation();
  if (status === "loading") return <p role="status" className="p-8 text-slate-400">Checking your session…</p>;
  if (status === "anon") return <Navigate to="/signin" replace state={{ from: loc.pathname + loc.search }} />;
  return <>{children}</>;
}
