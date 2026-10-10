// Leichte CodeMirror-6-Sprache für MQL (Erweiterte Suche, B1):
// Syntax-Highlighting (Felder, Operatoren, Logik, Phrasen, Regex) + Feld-Autocomplete.
// Die maßgebliche Grammatik liegt serverseitig (app/mql.py); dies ist nur Komfort.

import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

// Feldnamen (inkl. deutscher Aliase) — Spiegel von FIELDS in app/mql.py.
export const MQL_FIELDS = [
  "from", "absender", "to", "an", "empfänger", "cc", "anyaddr", "domain",
  "subject", "betreff", "body", "inhalt", "text", "attachtext", "anhangtext",
  "filename", "dateiname", "filetype", "has", "anhang", "mailbox", "folder",
  "ordner", "size", "date", "zeit", "before", "after",
];
const LOGIC = ["AND", "OR", "NOT", "UND", "ODER", "NICHT"];

const streamLang = StreamLanguage.define<{ expectValue: boolean }>({
  startState: () => ({ expectValue: false }),
  token(stream, state) {
    if (stream.eatSpace()) return null;
    const ch = stream.peek();
    if (ch === '"') {
      stream.next();
      while (!stream.eol() && stream.next() !== '"') { /* consume phrase */ }
      state.expectValue = false;
      return "string";
    }
    if (ch === "/") {
      stream.next();
      while (!stream.eol() && stream.next() !== "/") { /* consume regex */ }
      state.expectValue = false;
      return "string";
    }
    if (ch === "(" || ch === ")") {
      stream.next();
      return "bracket";  // via tokenTable → tags.paren (eingefärbt)
    }
    if (stream.match(/^(==|[:<>])/)) {
      state.expectValue = true;
      return "operator";
    }
    if (stream.match(/^[^\s()"/:=<>]+/)) {
      const word = stream.current();
      if (LOGIC.includes(word.toUpperCase())) {
        state.expectValue = false;
        return "keyword";
      }
      // Feldname, wenn direkt ein Operator folgt
      const rest = stream.string.slice(stream.pos);
      if (/^\s*(:|==|<|>)/.test(rest) && MQL_FIELDS.includes(word.toLowerCase())) {
        return "property";
      }
      state.expectValue = false;
      return null;
    }
    stream.next();
    return null;
  },
  tokenTable: {
    property: t.propertyName,
    keyword: t.keyword,
    operator: t.operator,
    string: t.string,
    bracket: t.paren,
  },
});

// Kräftige, gut unterscheidbare Farben für die MQL-Bestandteile.
const mqlHighlight = HighlightStyle.define([
  { tag: t.propertyName, color: "#1565c0", fontWeight: "600" }, // Felder: from:, betreff:
  { tag: t.keyword, color: "#6a1b9a", fontWeight: "700" },      // AND OR NOT foreach
  { tag: t.operator, color: "#00838f" },                        // : == > <
  { tag: t.string, color: "#2e7d32" },                          // "Phrase" /Regex/
  { tag: t.paren, color: "#b26a00" },                           // ( )
]);

// Wert-Vorschläge je Feld (nach feld: bzw. feld ==).
const VALUE_HINTS: Record<string, string[]> = {
  has: ["attachment"], anhang: ["attachment", "ja", "nein"],
  filetype: ["pdf", "docx", "xlsx", "png"],
  date: ["last-7d", "last-30d", "last-quarter", "last-year"],
  zeit: ["last-7d", "last-30d", "last-quarter", "last-year"],
  after: ["last-30d", "2026-01-01"], before: ["2026-01-01"],
};

function completions(ctx: CompletionContext): CompletionResult | null {
  // Werte nach einem Feld-Operator vorschlagen (feld:…, feld ==…)
  const fv = ctx.matchBefore(/([a-zäöü]+)\s*[:=]=?\s*([^\s()"]*)$/i);
  if (fv) {
    const m = /([a-zäöü]+)\s*[:=]=?\s*([^\s()"]*)$/i.exec(fv.text);
    const hints = m && VALUE_HINTS[m[1].toLowerCase()];
    if (hints && m) {
      return {
        from: fv.to - m[2].length,
        options: hints.map((h) => ({ label: h, type: "text" as const })),
        validFor: /^[^\s()"]*$/,
      };
    }
  }
  // sonst Feldnamen + Logik
  const word = ctx.matchBefore(/[\wäöüÄÖÜ]+/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;
  const options = [
    ...MQL_FIELDS.map((f) => ({ label: `${f}:`, type: "property" as const })),
    ...["AND", "OR", "NOT", "foreach"].map((k) => ({ label: k, type: "keyword" as const })),
  ];
  return { from: word.from, options, validFor: /^[\wäöüÄÖÜ:]*$/ };
}

export function mqlExtensions(): Extension[] {
  return [streamLang, syntaxHighlighting(mqlHighlight), autocompletion({ override: [completions] })];
}
