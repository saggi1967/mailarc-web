// Leichte CodeMirror-6-Sprache für MQL (Erweiterte Suche, B1):
// Syntax-Highlighting (Felder, Operatoren, Logik, Phrasen, Regex) + Feld-Autocomplete.
// Die maßgebliche Grammatik liegt serverseitig (app/mql.py); dies ist nur Komfort.

import { StreamLanguage } from "@codemirror/language";
import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
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
      return "bracket";
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
        return "propertyName";
      }
      state.expectValue = false;
      return null;
    }
    stream.next();
    return null;
  },
});

function completions(ctx: CompletionContext): CompletionResult | null {
  const word = ctx.matchBefore(/[\wäöüÄÖÜ]+/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;
  const options = [
    ...MQL_FIELDS.map((f) => ({ label: `${f}:`, type: "property" as const })),
    ...["AND", "OR", "NOT"].map((k) => ({ label: k, type: "keyword" as const })),
  ];
  return { from: word.from, options, validFor: /^[\wäöüÄÖÜ:]*$/ };
}

export function mqlExtensions(): Extension[] {
  return [streamLang, autocompletion({ override: [completions] })];
}
