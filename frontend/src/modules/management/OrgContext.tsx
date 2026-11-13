import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getJson } from "../../lib/http";

export interface Org { id: number; name: string; org_type: string; country_code: string; my_role: string }
interface Page<T> { results: T[] }

interface OrgValue {
  orgs: Org[];
  current: Org | null;
  loading: boolean;
  error: string;
  select: (id: number) => void;
  reload: () => void;
}
const Ctx = createContext<OrgValue | null>(null);
const KEY = "dhedak.org";

// Which organisation the person is working in. Only a convenience: every API call is still
// checked against the person's real memberships on the backend.
export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selected, setSelected] = useState<number | null>(() => {
    try { const v = Number(localStorage.getItem(KEY)); return v || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setError("");
    getJson<Page<Org>>("/organisations/", undefined, ctrl.signal)
      .then((p) => setOrgs(p.results))
      .catch((e: Error) => { if (!ctrl.signal.aborted) setError(e.message); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [tick]);

  const current = orgs.find((o) => o.id === selected) ?? orgs[0] ?? null;
  const select = useCallback((id: number) => {
    setSelected(id);
    try { localStorage.setItem(KEY, String(id)); } catch { /* storage unavailable */ }
  }, []);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const value = useMemo(() => ({ orgs, current, loading, error, select, reload }), [orgs, current, loading, error, select, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrg(): OrgValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrg must be used inside OrgProvider");
  return v;
}
