const BASE = "/api/v1"; // same domain in production; Vite proxies /api to Django in development

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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
