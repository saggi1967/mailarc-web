import CodeMirror from "@uiw/react-codemirror";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { mqlExtensions } from "./mqlLanguage";

/**
 * CodeMirror-6-Editor für MQL: Highlighting + Feld/Wert-Autocomplete.
 * - submitOnEnter=true (einzeilig/Suchleiste): Enter sucht.
 * - submitOnEnter=false (mehrzeiliges Popup): Enter macht Zeilenumbruch, nur Strg/Cmd+Enter sucht.
 */
export function MqlEditor({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitOnEnter = true,
  minHeight,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitOnEnter?: boolean;
  minHeight?: string;
  autoFocus?: boolean;
}) {
  const keys = [{ key: "Mod-Enter", run: () => (onSubmit(), true) }];
  if (submitOnEnter) keys.unshift({ key: "Enter", run: () => (onSubmit(), true) });
  const submit = Prec.highest(keymap.of(keys));
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
      autoFocus={autoFocus}
      extensions={[...mqlExtensions(), submit, EditorView.lineWrapping]}
      // Default-Highlighting aus, damit unser kräftiger MQL-Stil nicht überlagert wird.
      basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false, syntaxHighlighting: false }}
    />
  );
}
