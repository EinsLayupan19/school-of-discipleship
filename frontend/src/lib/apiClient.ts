import { supabase } from "./supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }
  // DELETE endpoints return 204 No Content — res.json() would throw on an empty body.
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/**
 * Thin fetch wrapper for calling our own Express backend. Every call
 * automatically reads the current Supabase session and attaches its
 * access token as a Bearer header — callers never handle tokens manually.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  Object.entries(authHeader).forEach(([key, value]) => headers.set(key, value));

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  return parseResponse<T>(res);
}

/**
 * Like apiFetch, but for multipart/form-data uploads (e.g. Excel import).
 * Deliberately never sets Content-Type — the browser must set it itself
 * so the multipart boundary is included correctly.
 */
export async function apiFetchFormData<T>(path: string, formData: FormData): Promise<T> {
  const authHeader = await getAuthHeader();
  const headers = new Headers(authHeader);

  const res = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: formData });
  return parseResponse<T>(res);
}
