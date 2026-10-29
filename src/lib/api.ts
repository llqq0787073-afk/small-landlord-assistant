// Minimal API client for the local Express backend (proxied as /api by Vite).
// The JWT is stored in localStorage under sla_token. Clearing it is logout.
const TOKEN_KEY = 'sla_token';
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
}
export class ApiError extends Error {
  status: number; body: any;
  constructor(status: number, body: any) {
    super(body?.error || 'apiError');
    this.status = status; this.body = body;
  }
}
export async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...opts, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}
