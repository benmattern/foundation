import { useState } from "react";
import type { Rules } from "../../supabase/functions/_shared/rules";
import type { Tag } from "../types/tag";
type Props = {
  initial: Rules;
  tags: Tag[];
  onSave: (rules: Rules) => Promise<void>;
  onPreview: (rules: Rules) => Promise<void>;
};
const terms = (text: string) =>
  text.split("\n").map((s) => s.trim()).filter(Boolean);
export function RuleEditor(props: Props) {
  return <RuleFields key={JSON.stringify(props.initial)} {...props} />;
}
function RuleFields({ initial, tags, onSave, onPreview }: Props) {
  const [include, setInclude] = useState(initial.includeAny.join("\n"));
  const [exclude, setExclude] = useState(initial.excludeAny.join("\n"));
  const [defaultTags, setDefaultTags] = useState(initial.defaultTags);
  const [keywords, setKeywords] = useState(initial.keywordTags);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const draft = (): Rules => ({
    version: initial.version + 1,
    includeAny: terms(include),
    excludeAny: terms(exclude),
    defaultTags,
    keywordTags: keywords.filter((rule) => rule.term.trim() && rule.tag).map((
      rule,
    ) => ({ ...rule, term: rule.term.trim() })),
  });
  async function run(action: (rules: Rules) => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action(draft());
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3 rounded border border-slate-700 p-4 text-slate-300">
      <p>
        Literal phrases, one per line. Matching ignores case and collapses
        whitespace. Exclusion wins. Empty inclusion allows all items. Changes
        affect future intake.
      </p>
      <label className="block">
        Include any<textarea
          aria-label="Include any terms"
          value={include}
          onChange={(e) => setInclude(e.target.value)}
          className="mt-1 block w-full rounded bg-slate-800 p-2"
        />
      </label>
      <label className="block">
        Exclude any<textarea
          aria-label="Exclude any terms"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
          className="mt-1 block w-full rounded bg-slate-800 p-2"
        />
      </label>
      <fieldset>
        <legend>Default tags</legend>
        {tags.map((tag) => (
          <label key={tag.id} className="mr-3 inline-block">
            <input
              type="checkbox"
              checked={defaultTags.includes(tag.id)}
              onChange={(e) =>
                setDefaultTags(
                  e.target.checked
                    ? [...defaultTags, tag.id]
                    : defaultTags.filter((id) => id !== tag.id),
                )}
            />{" "}
            {tag.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend>Keyword tags</legend>
        {keywords.map((rule, index) => (
          <div className="flex gap-2" key={index}>
            <input
              aria-label={`Keyword ${index + 1}`}
              value={rule.term}
              onChange={(e) =>
                setKeywords(
                  keywords.map((r, i) =>
                    i === index ? { ...r, term: e.target.value } : r
                  ),
                )}
              className="bg-slate-800 p-2"
            />
            <select
              aria-label={`Keyword tag ${index + 1}`}
              value={rule.tag}
              onChange={(e) =>
                setKeywords(
                  keywords.map((r, i) =>
                    i === index ? { ...r, tag: e.target.value } : r
                  ),
                )}
              className="bg-slate-800 p-2"
            >
              <option value="">Choose tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
            <button
              onClick={() =>
                setKeywords(keywords.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => setKeywords([...keywords, { term: "", tag: "" }])}
        >
          Add keyword tag
        </button>
      </fieldset>
      <div className="flex gap-4">
        <button disabled={busy} onClick={() => void run(onPreview)}>
          Preview recent sample
        </button>
        <button disabled={busy} onClick={() => void run(onSave)}>
          Save rules
        </button>
      </div>
      {error && <p role="alert" className="text-red-300">{error}</p>}
    </div>
  );
}
