import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Field, inputClass, primaryBtn } from "../components/ui";
import { ApiError } from "../lib/http";

const COUNTRIES = [["GH", "Ghana"], ["CM", "Cameroon"], ["UG", "Uganda"]];
const ACCOUNT_TYPES = [
  ["individual", "Individual"], ["facility", "Healthcare facility"], ["ngo", "NGO or foundation"],
  ["government", "Government institution"], ["research", "Research organisation"],
  ["supplier", "Medical supplier"], ["employer", "Employer"],
];

function Card({ title, intro, children, footer }: { title: string; intro: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-light tracking-tight text-slate-50">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{intro}</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-5 md:p-6">{children}</div>
      <p className="mt-5 text-center text-sm text-slate-400">{footer}</p>
    </div>
  );
}

function useAfterAuth() {
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from;
  return from && from.startsWith("/") ? from : "/management";
}

export function SignInPage() {
  const { login, status } = useAuth();
  const nav = useNavigate();
  const dest = useAfterAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (status === "authed") return <Navigate to={dest} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await login(email.trim(), password); nav(dest, { replace: true }); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Sign in failed. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <Card title="Sign in" intro="Access your organisation's DHEDAK Management workspace."
      footer={<>New to DHEDAK? <Link to="/register" className="text-cyan-300 underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email"><input className={inputClass} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-100">{error}</p>}
        <button className={`${primaryBtn} w-full`} disabled={busy || !email || !password}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </Card>
  );
}

export function RegisterPage() {
  const { register, status } = useAuth();
  const nav = useNavigate();
  const dest = useAfterAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", country_code: "GH", account_type: "individual", primary_reason: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (status === "authed") return <Navigate to={dest} replace />;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(""); setErrors({});
    try { await register({ ...form, email: form.email.trim() }); nav(dest, { replace: true }); }
    catch (err) {
      if (err instanceof ApiError) { setErrors(err.fields); if (!Object.keys(err.fields).length) setError(err.message); }
      else setError("Registration failed. Please try again.");
    } finally { setBusy(false); }
  };
  return (
    <Card title="Create your account" intro="Free to start. Your organisation's data stays private to your organisation."
      footer={<>Already registered? <Link to="/signin" className="text-cyan-300 underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.full_name}><input className={inputClass} autoComplete="name" required value={form.full_name} onChange={set("full_name")} /></Field>
        <Field label="Email" error={errors.email}><input className={inputClass} type="email" autoComplete="email" required value={form.email} onChange={set("email")} /></Field>
        <Field label="Password" error={errors.password}><input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={set("password")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country" error={errors.country_code}>
            <select className={inputClass} value={form.country_code} onChange={set("country_code")}>{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
          </Field>
          <Field label="I am registering as" error={errors.account_type}>
            <select className={inputClass} value={form.account_type} onChange={set("account_type")}>{ACCOUNT_TYPES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
          </Field>
        </div>
        <Field label="What will you use DHEDAK for? (optional)" error={errors.primary_reason}>
          <input className={inputClass} maxLength={300} value={form.primary_reason} onChange={set("primary_reason")} />
        </Field>
        {error && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-3 text-sm text-rose-100">{error}</p>}
        <button className={`${primaryBtn} w-full`} disabled={busy || !form.email || !form.password || !form.full_name}>{busy ? "Creating account…" : "Create account"}</button>
        <p className="text-xs text-slate-500">By continuing you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy policy</Link>.</p>
      </form>
    </Card>
  );
}
