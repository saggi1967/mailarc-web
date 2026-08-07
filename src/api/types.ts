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

export interface SearchParams {
  q?: string;
  from?: string;
  domain?: string;
  mailbox?: string;
  since?: string;
  until?: string;
  phrase?: boolean;
  attachments?: boolean;
  limit?: number;
  offset?: number;
}
