import CodeMirror from "@uiw/react-codemirror";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { mqlExtensions } from "./mqlLanguage";

/** CodeMirror-6-Editor für MQL: Highlighting + Feld-Autocomplete, Enter sucht. */
export function MqlEditor({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const submit = Prec.highest(
    keymap.of([
      { key: "Enter", run: () => (onSubmit(), true) },
      { key: "Mod-Enter", run: () => (onSubmit(), true) },
    ]),
  );
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      extensions={[...mqlExtensions(), submit, EditorView.lineWrapping]}
      basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
    />
  );
}
