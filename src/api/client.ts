// Schlanker Fetch-Wrapper für die client-API.
// Cookie-basierte Session → immer `credentials: "include"`. Kein Token im JS.

import type {
  Account,
  AccountInput,
  AttachmentList,
  EmailDetail,
  SearchParams,
  SearchResult,
  StatsSummary,
  UserInput,
  WebUser,
} from "./types";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* kein JSON-Body */
    }
    throw new ApiError(res.status, detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // -- Auth --
  login: (username: string, password: string) =>
    request<{ user: string; role: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ user: string; role: string }>("/api/auth/me"),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  changePassword: (current_password: string, new_password: string) =>
    request<{ ok: boolean }>("/api/auth/password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),

  // -- Suche --
  search: (p: SearchParams) => request<SearchResult>(`/api/search${qs(p as Record<string, unknown>)}`),
  count: (p: SearchParams) => request<{ count: number }>(`/api/search/count${qs(p as Record<string, unknown>)}`),

  // -- Einzelmail --
  email: (id: string) => request<EmailDetail>(`/api/emails/${encodeURIComponent(id)}`),
  attachments: (id: string) => request<AttachmentList>(`/api/emails/${encodeURIComponent(id)}/attachments`),

  // -- Statistik --
  stats: () => request<StatsSummary>("/api/stats/summary"),

  // -- Konten --
  accounts: {
    list: () => request<Account[]>("/api/accounts"),
    create: (body: AccountInput) =>
      request<Account>("/api/accounts", { method: "POST", body: JSON.stringify(body) }),
    update: (name: string, body: AccountInput) =>
      request<Account>(`/api/accounts/${encodeURIComponent(name)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (name: string) =>
      request<{ deleted: string }>(`/api/accounts/${encodeURIComponent(name)}`, { method: "DELETE" }),
  },

  // -- Benutzer (nur Admin) --
  users: {
    list: () => request<WebUser[]>("/api/users"),
    create: (body: UserInput) =>
      request<WebUser>("/api/users", { method: "POST", body: JSON.stringify(body) }),
    update: (username: string, body: UserInput) =>
      request<WebUser>(`/api/users/${encodeURIComponent(username)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (username: string) =>
      request<{ deleted: string }>(`/api/users/${encodeURIComponent(username)}`, { method: "DELETE" }),
  },
};

/** Direkt-URLs für Downloads/Anzeige (Navigation sendet das Session-Cookie mit). */
export const urls = {
  pdf: (id: string) => `${API_BASE}/api/emails/${encodeURIComponent(id)}/pdf`,
  attachment: (id: string, index: number) =>
    `${API_BASE}/api/emails/${encodeURIComponent(id)}/attachments/${index}`,
};
