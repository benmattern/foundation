import { GroupedRuleEditor } from "./GroupedRuleEditor";
import { Button } from "./ui/Button";
import { useState } from "react";
import type { Rules } from "../../supabase/functions/_shared/rules";
import type { Tag } from "../types/tag";
type Props = {
  scopeTerms?: string[];
  initial: Rules;
  tags: Tag[];
  onSave: (rules: Rules) => Promise<void>;
  onPreview: (rules: Rules) => Promise<void>;
};
const terms = (text: string) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
export function RuleEditor(props: Props) {
  return <RuleChoice key={JSON.stringify(props.initial)} {...props} />;
}
function RuleChoice(props: Props) {
  const [grouped, setGrouped] = useState(props.initial.format === 2);
  if (grouped)
    return (
      <GroupedRuleEditor
        {...props}
        initial={
          props.initial.format === 2
            ? props.initial
            : {
                ...props.initial,
                format: 2,
                mode: props.initial.includeAny.length ? "restricted" : "all",
                groups: props.initial.includeAny.length
                  ? [
                      [
                        {
                          terms: props.initial.includeAny,
                          fields: ["title", "excerpt", "categories"],
                          mode: "substring",
                        },
                      ],
                    ]
                  : [],
                exclusions: props.initial.excludeAny.length
                  ? [
                      {
                        terms: props.initial.excludeAny,
                        fields: ["title", "excerpt", "categories"],
                        mode: "substring",
                      },
                    ]
                  : [],
              }
        }
      />
    );
  return (
    <div className="space-y-4">
      <p>
        Legacy literal-substring rules remain active. No descriptive metadata is
        automatically used.
      </p>
      <Button onClick={() => setGrouped(true)}>
        Build grouped relevance rules
      </Button>
      <RuleFields {...props} />
    </div>
  );
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
    keywordTags: keywords
      .filter((rule) => rule.term.trim() && rule.tag)
      .map((rule) => ({ ...rule, term: rule.term.trim() })),
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
        Include any
        <textarea
          rows={4}
          aria-label="Include any terms"
          value={include}
          onChange={(e) => setInclude(e.target.value)}
          className="mt-1 block w-full rounded bg-slate-800 p-2"
        />
      </label>
      <label className="block">
        Exclude any
        <textarea
          rows={4}
          aria-label="Exclude any terms"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
          className="mt-1 block w-full rounded bg-slate-800 p-2"
        />
      </label>
      <fieldset>
        <legend>Default tags</legend>
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="mr-3 inline-flex min-h-11 items-center gap-2"
          >
            <input
              type="checkbox"
              checked={defaultTags.includes(tag.id)}
              onChange={(e) =>
                setDefaultTags(
                  e.target.checked
                    ? [...defaultTags, tag.id]
                    : defaultTags.filter((id) => id !== tag.id),
                )
              }
            />{" "}
            {tag.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend>Keyword tags</legend>
        {keywords.map((rule, index) => (
          <div
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            key={index}
          >
            <input
              aria-label={`Keyword ${index + 1}`}
              value={rule.term}
              onChange={(e) =>
                setKeywords(
                  keywords.map((r, i) =>
                    i === index ? { ...r, term: e.target.value } : r,
                  ),
                )
              }
              className="bg-slate-800 p-2"
            />
            <select
              aria-label={`Keyword tag ${index + 1}`}
              value={rule.tag}
              onChange={(e) =>
                setKeywords(
                  keywords.map((r, i) =>
                    i === index ? { ...r, tag: e.target.value } : r,
                  ),
                )
              }
              className="bg-slate-800 p-2"
            >
              <option value="">Choose tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() =>
                setKeywords(keywords.filter((_, i) => i !== index))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          onClick={() => setKeywords([...keywords, { term: "", tag: "" }])}
        >
          Add keyword tag
        </Button>
      </fieldset>
      <div className="flex flex-wrap gap-4">
        <Button disabled={busy} onClick={() => void run(onPreview)}>
          Preview recent sample
        </Button>
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => void run(onSave)}
        >
          Save rules
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            setInclude(initial.includeAny.join("\n"));
            setExclude(initial.excludeAny.join("\n"));
            setDefaultTags(initial.defaultTags);
            setKeywords(initial.keywordTags);
            setError("");
          }}
        >
          Cancel rule edits
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
