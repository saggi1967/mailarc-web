// Typen der mailarc-server client-API (/api).

export interface SearchItem {
  id: string;
  date: string | null;
  from_addr: string | null;
  from_name: string | null;
  subject: string | null;
  mailbox: string | null;
  uid: number | null;
  uidvalidity: number | null;
  has_attachment: boolean | null;
  attachment_count: number | null;
  snippet: string | null;
}

export interface SearchResult {
  total: number;
  count: number;
  offset: number;
  items: SearchItem[];
}

export interface AttachmentMeta {
  filename: string | null;
  content_type: string | null;
  size: number;
  has_text?: boolean;
}

export interface EmailDetail {
  mailbox: string;
  uid: number;
  uidvalidity: number;
  message_id: string | null;
  subject: string | null;
  from_addr: string | null;
  from_name: string | null;
  to: string[];
  cc: string[];
  date: string | null;
  size: number | null;
  body: string | null;
  has_attachment: boolean;
  attachment_count: number;
  attachments: AttachmentMeta[];
}

export interface AttachmentList {
  count: number;
  attachments: { index: number; filename: string | null; content_type: string | null; size: number }[];
}

export interface StatsSummary {
  total: number;
  total_size: number;
  span_start: string | null;
  span_end: string | null;
  distinct_senders: number;
  per_year: Record<string, number>;
  per_month: Record<string, number>;
  per_weekday: Record<string, number>;
  top_senders: [string, number][];
}

export interface Account {
  name: string;
  imap_host: string;
  imap_port: number;
  imap_ssl: boolean;
  imap_ssl_verify: boolean;
  imap_user: string;
  folders: string;
  es_host: string | null;
  es_user: string | null;
  es_index: string | null;
  es_verify_certs: boolean | null;
  attachment_text: boolean | null;
  attachment_max_bytes: number | null;
  attachment_max_chars: number | null;
  es_password_set: boolean;
}

/** Felder für Anlegen (name + imap_password Pflicht) bzw. Teil-Update (alles optional). */
export interface AccountInput {
  name?: string;
  imap_host?: string;
  imap_port?: number;
  imap_ssl?: boolean;
  imap_ssl_verify?: boolean;
  imap_user?: string;
  imap_password?: string;
  folders?: string;
  es_host?: string | null;
  es_user?: string | null;
  es_password?: string | null;
  es_index?: string | null;
  es_verify_certs?: boolean | null;
}

export interface WebUser {
  username: string;
  role: string; // "admin" | "user"
  is_active: boolean;
}

export interface UserInput {
  username?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export interface SearchParams {
  q?: string;
  from?: string;
  to?: string;
  domain?: string;
  subject?: string;
  file?: string;
  mailbox?: string;
  since?: string;
  until?: string;
  last?: string;
  phrase?: boolean;
  attachments?: boolean;
  limit?: number;
  offset?: number;
}
