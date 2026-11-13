import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import HelixLoader from "../components/loader/HelixLoader";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const loc = useLocation();
  if (status === "loading") return <HelixLoader label="Checking your session" />;
  if (status === "anon") return <Navigate to="/signin" replace state={{ from: loc.pathname + loc.search }} />;
  return <>{children}</>;
}
