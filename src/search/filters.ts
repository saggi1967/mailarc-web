// Gemeinsame Such-Filter-Logik: UI-Zustand ⇄ URL ⇄ API-Parameter.
//
// Die URL ist die Quelle der Wahrheit (→ „Zurück" stellt die Suche wieder her).
// Diese Funktionen werden von der Suche (SearchPage) und der Favoritenverwaltung
// (SearchesPage) geteilt, damit ein gespeicherter Favorit exakt dieselbe Suche
// erzeugt wie das manuelle Formular.

import type { SearchParams } from "../api/types";

export interface Filters {
  q: string;
  from: string;
  to: string;
  domain: string;
  subject: string;
  file: string;
  mailbox: string;
  range: string; // "" | "24h" | "7d" | "30d" | "365d" | "custom"
  since: string;
  until: string;
  attachments: string; // "" | "yes" | "no"
  phrase: boolean;
}

export const EMPTY: Filters = {
  q: "", from: "", to: "", domain: "", subject: "", file: "", mailbox: "",
  range: "", since: "", until: "", attachments: "", phrase: false,
};

export const RANGES: [string, string][] = [
  ["", "Alle"],
  ["24h", "Letzte 24 h"],
  ["7d", "Letzte 7 Tage"],
  ["30d", "Letzte 30 Tage"],
  ["365d", "Letztes Jahr"],
  ["custom", "Benutzerdefiniert"],
];

export const DEFAULT_PAGE_SIZE = 25;

export function parseFilters(sp: URLSearchParams): Filters {
  return {
    q: sp.get("q") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    domain: sp.get("domain") ?? "",
    subject: sp.get("subject") ?? "",
    file: sp.get("file") ?? "",
    mailbox: sp.get("mailbox") ?? "",
    range: sp.get("range") ?? "",
    since: sp.get("since") ?? "",
    until: sp.get("until") ?? "",
    attachments: sp.get("attachments") ?? "",
    phrase: sp.get("phrase") === "1",
  };
}

export function serialize(f: Filters, page: number, pageSize: number): URLSearchParams {
  const sp = new URLSearchParams();
  const add = (k: string, v: string) => {
    if (v) sp.set(k, v);
  };
  add("q", f.q);
  add("from", f.from);
  add("to", f.to);
  add("domain", f.domain);
  add("subject", f.subject);
  add("file", f.file);
  add("mailbox", f.mailbox);
  add("attachments", f.attachments);
  if (f.phrase) sp.set("phrase", "1");
  if (f.range === "custom") {
    sp.set("range", "custom");
    add("since", f.since);
    add("until", f.until);
  } else {
    add("range", f.range);
  }
  if (page) sp.set("page", String(page));
  if (pageSize !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(pageSize));
  return sp;
}

/** UI-Filter → API-Parameter (das, was gespeichert und an /api/search gesendet wird). */
export function toParams(f: Filters): SearchParams {
  const p: SearchParams = {};
  if (f.q) p.q = f.q;
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  if (f.domain) p.domain = f.domain;
  if (f.subject) p.subject = f.subject;
  if (f.file) p.file = f.file;
  if (f.mailbox) p.mailbox = f.mailbox;
  if (f.phrase) p.phrase = true;
  if (f.attachments === "yes") p.attachments = true;
  else if (f.attachments === "no") p.attachments = false;
  if (f.range === "custom") {
    if (f.since) p.since = f.since;
    if (f.until) p.until = f.until;
  } else if (f.range) {
    p.last = f.range;
  }
  return p;
}

/** Umkehrung von toParams: gespeicherte API-Parameter → UI-Filter (zum Laden eines Favoriten). */
export function searchParamsToFilters(p: SearchParams): Filters {
  const f: Filters = { ...EMPTY };
  f.q = p.q ?? "";
  f.from = p.from ?? "";
  f.to = p.to ?? "";
  f.domain = p.domain ?? "";
  f.subject = p.subject ?? "";
  f.file = p.file ?? "";
  f.mailbox = p.mailbox ?? "";
  f.phrase = p.phrase === true;
  if (p.attachments === true) f.attachments = "yes";
  else if (p.attachments === false) f.attachments = "no";
  if (p.since || p.until) {
    f.range = "custom";
    f.since = p.since ?? "";
    f.until = p.until ?? "";
  } else if (p.last) {
    f.range = p.last;
  }
  return f;
}

/** Kurzform eines gespeicherten Favoriten als Such-URL (?…) zum Navigieren. */
export function paramsToSearchString(p: SearchParams): string {
  return serialize(searchParamsToFilters(p), 0, DEFAULT_PAGE_SIZE).toString();
}

export function activeChips(f: Filters): { key: keyof Filters | "range"; label: string }[] {
  const chips: { key: keyof Filters | "range"; label: string }[] = [];
  if (f.from) chips.push({ key: "from", label: `Von: ${f.from}` });
  if (f.to) chips.push({ key: "to", label: `An: ${f.to}` });
  if (f.domain) chips.push({ key: "domain", label: `Domain: ${f.domain}` });
  if (f.subject) chips.push({ key: "subject", label: `Betreff: ${f.subject}` });
  if (f.file) chips.push({ key: "file", label: `Anhang: ${f.file}` });
  if (f.mailbox) chips.push({ key: "mailbox", label: `Ordner: ${f.mailbox}` });
  if (f.phrase) chips.push({ key: "phrase", label: "Phrase" });
  if (f.attachments === "yes") chips.push({ key: "attachments", label: "mit Anhang" });
  else if (f.attachments === "no") chips.push({ key: "attachments", label: "ohne Anhang" });
  if (f.range === "custom" && (f.since || f.until))
    chips.push({ key: "range", label: `Zeitraum: ${f.since || "…"} – ${f.until || "…"}` });
  else if (f.range) chips.push({ key: "range", label: RANGES.find(([v]) => v === f.range)?.[1] ?? f.range });
  return chips;
}
