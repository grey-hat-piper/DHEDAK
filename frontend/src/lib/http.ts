const BASE = "/api/v1"; // same domain in production; Vite proxies /api to Django in development

export class ApiError extends Error {
  status: number;
  /** Per-field validation messages from DRF (400 responses), keyed by field name. */
  fields: Record<string, string>;
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function fieldErrors(body: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (body && typeof body === "object" && !Array.isArray(body)) {
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      const msg = Array.isArray(v) ? v[0] : v;
      if (typeof msg === "string" && k !== "detail") out[k] = msg;
    }
  }
  return out;
}

async function messageFrom(res: Response): Promise<string> {
  if (res.status === 429) return "Too many requests. Please wait a moment and try again.";
  if (res.status === 403) return "You do not have permission to view this.";
  if (res.status === 404) return "This item could not be found. It may no longer be available.";
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    const first = body && typeof body === "object" ? Object.values(body)[0] : null;
    if (typeof first === "string") return first;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  } catch { /* not JSON */ }
  return res.status >= 500 ? "The service is temporarily unavailable. Please try again." : `Request failed (${res.status}).`;
}

export async function getJson<T>(path: string, params?: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const qs = params && params.toString() ? `?${params.toString()}` : "";
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs}`, { signal, headers: { Accept: "application/json" } });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new ApiError(res.status, await messageFrom(res));
  return (await res.json()) as T;
}

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

let csrfReady = false;
async function ensureCsrf(): Promise<void> {
  if (csrfReady && csrfToken()) return;
  await fetch(`${BASE}/auth/csrf/`, { credentials: "same-origin" });
  csrfReady = true;
}

// POST/PATCH/DELETE with the Django CSRF token. Returns undefined for 204 responses.
export async function sendJson<T>(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    await ensureCsrf();
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json", "X-CSRFToken": csrfToken() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    let fields: Record<string, string> = {};
    let message = "";
    try { const clone = res.clone(); fields = fieldErrors(await clone.json()); } catch { /* not JSON */ }
    message = await messageFrom(res);
    throw new ApiError(res.status, message, fields);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
