import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getJson, sendJson } from "../lib/http";

export interface User { id: number; email: string; full_name: string; country_code: string; account_type: string }
export interface RegisterInput { email: string; password: string; full_name: string; country_code: string; account_type: string; primary_reason?: string }

interface AuthValue {
  user: User | null;
  status: "loading" | "anon" | "authed";
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

// Session auth: the browser holds the session cookie; this only mirrors "who am I" for the UI.
// The backend still enforces every permission, so hiding a page here is a convenience, not security.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthValue["status"]>("loading");

  useEffect(() => {
    const ctrl = new AbortController();
    getJson<User>("/auth/me/", undefined, ctrl.signal)
      .then((u) => { setUser(u); setStatus("authed"); })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        // 401/403 = not signed in. Anything else (network, 5xx) also falls back to anonymous;
        // protected pages then send the person to sign in, where the real error is shown.
        setUser(null); setStatus("anon");
      });
    return () => ctrl.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await sendJson<User>("POST", "/auth/login/", { email, password });
    setUser(u); setStatus("authed");
  }, []);
  const register = useCallback(async (input: RegisterInput) => {
    const u = await sendJson<User>("POST", "/auth/register/", input);
    setUser(u); setStatus("authed");
  }, []);
  const logout = useCallback(async () => {
    try { await sendJson<void>("POST", "/auth/logout/"); } finally { setUser(null); setStatus("anon"); }
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
