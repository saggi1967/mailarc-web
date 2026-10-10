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

/** Ein Filterwert als MQL-Wert: Regex unverändert, Werte mit Leerzeichen als "Phrase". */
function mqlValue(v: string): string {
  if (v.length >= 2 && v.startsWith("/") && v.endsWith("/")) return v;
  return /\s/.test(v) ? `"${v.replace(/"/g, "")}"` : v;
}

/** Formular-Filter → MQL-Ausdruck (Round-Trip: Moduswechsel übernimmt die Suche). */
export function filtersToMql(f: Filters): string {
  const parts: string[] = [];
  if (f.q) parts.push(f.phrase ? `"${f.q.replace(/"/g, "")}"` : mqlValue(f.q));
  if (f.from) parts.push(`from:${mqlValue(f.from)}`);
  if (f.to) parts.push(`to:${mqlValue(f.to)}`);
  if (f.domain) parts.push(`domain:${mqlValue(f.domain)}`);
  if (f.subject) parts.push(`subject:${mqlValue(f.subject)}`);
  if (f.file) parts.push(`filename:${mqlValue(f.file)}`);
  if (f.mailbox) parts.push(`mailbox:${mqlValue(f.mailbox)}`);
  if (f.attachments === "yes") parts.push("has:attachment");
  else if (f.attachments === "no") parts.push("NOT has:attachment");
  if (f.range === "custom") {
    if (f.since) parts.push(`after:${f.since}`);
    if (f.until) parts.push(`before:${f.until}`);
  } else if (f.range) {
    parts.push(`date:last-${f.range}`);
  }
  return parts.join(" AND ");
}

// ── Rückweg MQL → Formular (best effort) ───────────────────────────────────
// Nur der flach abbildbare Teil von MQL lässt sich als Formular darstellen.
// Alles mit OR/NOT/Klammern/foreach/size ist nicht abbildbar → exact=false.
type MqlTok = { kind: string; text: string };
const _STOP = new Set(" \t\n\r()[],\"/:=<>".split(""));

function tokenizeMql(s: string): MqlTok[] {
  const toks: MqlTok[] = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if ("()[],".includes(c)) {
      const kind = { "(": "LPAREN", ")": "RPAREN", "[": "LBRACK", "]": "RBRACK", ",": "COMMA" }[c]!;
      toks.push({ kind, text: c }); i++; continue;
    }
    if (c === '"') { let j = i + 1; while (j < n && s[j] !== '"') j++; toks.push({ kind: "STR", text: s.slice(i + 1, j) }); i = j < n ? j + 1 : j; continue; }
    if (c === "/") { let j = i + 1; while (j < n && s[j] !== "/") j++; toks.push({ kind: "REGEX", text: s.slice(i + 1, j) }); i = j < n ? j + 1 : j; continue; }
    if (s.slice(i, i + 2) === "==") { toks.push({ kind: "OP", text: "==" }); i += 2; continue; }
    if (c === ":" || c === "<" || c === ">") { toks.push({ kind: "OP", text: c }); i++; continue; }
    let j = i;
    while (j < n && !_STOP.has(s[j])) j++;
    if (j === i) { i++; continue; }
    toks.push({ kind: "WORD", text: s.slice(i, j) }); i = j;
  }
  return toks;
}

const _REL_TO_RANGE: Record<string, string> = {
  "24h": "24h", "7d": "7d", week: "7d", "30d": "30d", month: "30d", "365d": "365d", year: "365d",
};

/** MQL → Formular-Filter (verlustbehaftet). exact=false, wenn Teile nicht abbildbar waren. */
export function mqlToFilters(mql: string): { filters: Filters; exact: boolean } {
  const f: Filters = { ...EMPTY };
  const q: string[] = [];
  let exact = true;
  const toks = tokenizeMql(mql || "");

  // Strukturen, die ein flaches Formular nicht ausdrücken kann → gar nicht übernehmen.
  const blocked = (t: MqlTok) =>
    ["LPAREN", "RPAREN", "LBRACK", "RBRACK", "COMMA"].includes(t.kind) ||
    (t.kind === "WORD" && ["OR", "ODER", "NOT", "NICHT", "FOREACH"].includes(t.text.toUpperCase()));
  if (toks.some(blocked)) return { filters: EMPTY, exact: false };

  const isAnd = (t: MqlTok) => t.kind === "WORD" && ["AND", "UND"].includes(t.text.toUpperCase());
  const setDate = (val: string, slot: "since" | "until") => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) { f.range = "custom"; f[slot] = val; return; }
    let t = val.toLowerCase();
    if (t.startsWith("last-")) t = t.slice(5);
    const r = _REL_TO_RANGE[t];
    if (r && slot === "since") f.range = r;
    else exact = false;
  };

  let i = 0;
  while (i < toks.length) {
    const t = toks[i];
    if (isAnd(t)) { i++; continue; }
    const nxt = toks[i + 1];
    if (t.kind === "WORD" && nxt && nxt.kind === "OP") {
      const field = t.text.toLowerCase();
      const op = nxt.text;
      const v = toks[i + 2];
      i += 3;
      if (!v || v.kind === "OP" || isAnd(v)) { exact = false; continue; }
      if (op === ">" || op === "<") { exact = false; continue; } // size & Co. nicht abbildbar
      const raw = v.text;
      const val = v.kind === "REGEX" ? `/${raw}/` : raw;
      const phrase = v.kind === "STR";
      switch (field) {
        case "from": case "absender": f.from = val; break;
        case "to": case "an": case "empfänger": case "empfaenger": f.to = val; break;
        case "domain": f.domain = val; break;
        case "subject": case "betreff": f.subject = val; break;
        case "filename": case "dateiname": case "file": f.file = val; break;
        case "filetype": f.file = `*.${raw.replace(/^\./, "").toLowerCase()}`; break;
        case "mailbox": case "folder": case "ordner": f.mailbox = val; break;
        case "body": case "inhalt": case "text": q.push(raw); if (phrase) f.phrase = true; break;
        case "attachtext": case "anhangtext": q.push(raw); if (phrase) f.phrase = true; exact = false; break;
        case "has": case "anhang":
          if (["attachment", "anhang", "ja", "yes", "true", "1"].includes(raw.toLowerCase())) f.attachments = "yes";
          else if (["nein", "no", "false", "0"].includes(raw.toLowerCase())) f.attachments = "no";
          else exact = false;
          break;
        case "date": case "zeit": case "after": setDate(raw, "since"); break;
        case "before": setDate(raw, "until"); break;
        default: exact = false; break;
      }
      continue;
    }
    if (t.kind === "WORD" || t.kind === "STR" || t.kind === "REGEX") {
      q.push(t.kind === "REGEX" ? `/${t.text}/` : t.text);
      if (t.kind === "STR") f.phrase = true;
      i++; continue;
    }
    exact = false; i++;
  }
  f.q = q.join(" ").trim();
  return { filters: f, exact };
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
