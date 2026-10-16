import { useEffect, useState } from "react";
import {
  type Criterion,
  type Rules,
  validateRules,
} from "../../supabase/functions/_shared/rules";
import {
  getTermGroups,
  saveTermGroup,
  type TermGroup,
} from "../services/termGroupService";
import type { Tag } from "../types/tag";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { Input, controlClass } from "./ui/Input";
const split = (s: string) =>
  s
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
const empty = (): Criterion => ({
  terms: [],
  fields: ["title", "excerpt", "categories"],
  mode: "whole",
});
export function GroupedRuleEditor({
  initial,
  tags,
  onSave,
  onPreview,
  scopeTerms = [],
}: {
  initial: Rules;
  tags: Tag[];
  onSave: (r: Rules) => Promise<void>;
  onPreview: (r: Rules) => Promise<void>;
  scopeTerms?: string[];
}) {
  const [draft, setDraft] = useState<Rules>(initial),
    [groups, setGroups] = useState<TermGroup[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [editing, setEditing] = useState<TermGroup | null>(null),
    [name, setName] = useState(""),
    [members, setMembers] = useState("");
  const [request, setRequest] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let active = true;
    getTermGroups()
      .then((g) => {
        if (active) setGroups(g);
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, []);
  function patch(values: Partial<Rules>) {
    setDraft((d) => ({ ...d, ...values }));
    setMessage("");
  }
  async function run(action: (r: Rules) => Promise<void>, saved = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const next = { ...draft, version: initial.version + 1 };
      validateRules(next);
      await action(next);
      setMessage(
        saved
          ? "Rules saved for future intake. Reapply explicitly to update active pending items."
          : "Sample preview updated below.",
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  function criterion(
    c: Criterion,
    change: (c: Criterion) => void,
    key: string,
  ) {
    const latest = groups.find((g) => g.id === c.group?.id);
    return (
      <div
        className="space-y-3 rounded-lg border border-slate-600 p-4"
        key={key}
      >
        <Textarea
          label="Any of these terms (one per line)"
          value={c.terms.join("\n")}
          onChange={(e) => change({ ...c, terms: split(e.target.value) })}
        />
        <label className="block">
          Match mode
          <select
            className={controlClass}
            value={c.mode}
            onChange={(e) =>
              change({ ...c, mode: e.target.value as Criterion["mode"] })
            }
          >
            <option value="whole">Whole term / phrase</option>
            <option value="substring">Literal substring</option>
          </select>
        </label>
        <fieldset>
          <legend>Search fields</legend>
          {(["title", "excerpt", "categories"] as const).map((field) => (
            <label
              className="mr-4 inline-flex min-h-11 items-center gap-2"
              key={field}
            >
              <input
                type="checkbox"
                checked={c.fields.includes(field)}
                onChange={(e) =>
                  change({
                    ...c,
                    fields: e.target.checked
                      ? [...c.fields, field]
                      : c.fields.filter((f) => f !== field),
                  })
                }
              />
              {field}
            </label>
          ))}
        </fieldset>
        <label className="block">
          Named term group
          <select
            className={controlClass}
            value={c.group?.id ?? ""}
            onChange={(e) => {
              const g = groups.find((g) => g.id === e.target.value);
              change({ ...c, group: g ? { ...g } : undefined });
            }}
          >
            <option value="">Ad-hoc terms only</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} v{g.version}
              </option>
            ))}
          </select>
        </label>
        {c.group && (
          <div className="space-y-2">
            <p>
              Pinned {c.group.name} v{c.group.version}:{" "}
              {c.group.terms.join(", ")}
            </p>
            {latest && latest.version !== c.group.version && (
              <Button onClick={() => change({ ...c, group: { ...latest } })}>
                Adopt v{latest.version} in draft (preview before saving)
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <section className="space-y-5 rounded-xl border border-slate-700 p-4">
      <p>
        Routing determines Inbox eligibility. Tagging adds labels. Relevance
        ordering uses matched positive terms; it is not credibility or
        probability.
      </p>
      <label className="block">
        Inbox preference
        <select
          className={controlClass}
          value={draft.mode ?? "all"}
          onChange={(e) => patch({ mode: e.target.value as Rules["mode"] })}
        >
          <option value="all">All incoming items</option>
          <option value="restricted">Only items matching my rules</option>
        </select>
      </label>
      <p className="text-sm text-slate-400">
        Any inclusion group may match (OR). Every condition in a group must
        match (AND); any term within a condition is enough. Hyphens and
        apostrophes are boundaries; no synonyms are inferred. Missing text stays
        reviewable.
      </p>
      {scopeTerms.length > 0 && (
        <Button
          onClick={() =>
            patch({
              mode: "restricted",
              groups: [[{ ...empty(), terms: scopeTerms }]],
            })
          }
        >
          Use descriptive topics/keywords as matching terms in draft
        </Button>
      )}
      {(draft.groups ?? []).map((group, i) => (
        <fieldset
          key={i}
          className="space-y-3 rounded-lg border border-blue-900 p-3"
        >
          <legend>
            Inclusion group {i + 1} {i > 0 ? "(OR)" : ""}
          </legend>
          {group.map((c, j) =>
            criterion(
              c,
              (next) =>
                patch({
                  groups: draft.groups!.map((g, n) =>
                    n === i ? g.map((v, k) => (k === j ? next : v)) : g,
                  ),
                }),
              `${i}-${j}`,
            ),
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                patch({
                  groups: draft.groups!.map((g, n) =>
                    n === i ? [...g, empty()] : g,
                  ),
                })
              }
            >
              Add AND condition
            </Button>
            <Button
              onClick={() =>
                patch({ groups: draft.groups!.filter((_, n) => n !== i) })
              }
            >
              Remove group
            </Button>
          </div>
        </fieldset>
      ))}
      <Button
        onClick={() => patch({ groups: [...(draft.groups ?? []), [empty()]] })}
      >
        Add OR group
      </Button>
      <details>
        <summary>Exclusions and tagging</summary>
        <div className="space-y-3">
          {(draft.exclusions ?? []).map((c, i) => (
            <div key={i}>
              {criterion(
                c,
                (next) =>
                  patch({
                    exclusions: draft.exclusions!.map((v, n) =>
                      n === i ? next : v,
                    ),
                  }),
                `exclude-${i}`,
              )}
              <Button
                onClick={() =>
                  patch({
                    exclusions: draft.exclusions!.filter((_, n) => n !== i),
                  })
                }
              >
                Remove exclusion
              </Button>
            </div>
          ))}
          <Button
            onClick={() =>
              patch({ exclusions: [...(draft.exclusions ?? []), empty()] })
            }
          >
            Add exclusion (wins over inclusion)
          </Button>
          <fieldset>
            <legend>Default tags</legend>
            {tags.map((t) => (
              <label
                key={t.id}
                className="mr-3 inline-flex min-h-11 items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={draft.defaultTags.includes(t.id)}
                  onChange={(e) =>
                    patch({
                      defaultTags: e.target.checked
                        ? [...draft.defaultTags, t.id]
                        : draft.defaultTags.filter((id) => id !== t.id),
                    })
                  }
                />
                {t.name}
              </label>
            ))}
          </fieldset>
          {draft.keywordTags.map((r, i) => (
            <div className="grid gap-2 sm:grid-cols-2" key={i}>
              <Input
                label="Tagging phrase (literal substring)"
                value={r.term}
                onChange={(e) =>
                  patch({
                    keywordTags: draft.keywordTags.map((v, n) =>
                      n === i ? { ...v, term: e.target.value } : v,
                    ),
                  })
                }
              />
              <label>
                Suggested tag
                <select
                  className={controlClass}
                  value={r.tag}
                  onChange={(e) =>
                    patch({
                      keywordTags: draft.keywordTags.map((v, n) =>
                        n === i ? { ...v, tag: e.target.value } : v,
                      ),
                    })
                  }
                >
                  <option value="">Choose tag</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                onClick={() =>
                  patch({
                    keywordTags: draft.keywordTags.filter((_, n) => n !== i),
                  })
                }
              >
                Remove tag condition
              </Button>
            </div>
          ))}
          <Button
            onClick={() =>
              patch({
                keywordTags: [...draft.keywordTags, { term: "", tag: "" }],
              })
            }
          >
            Add tagging condition
          </Button>
        </div>
      </details>
      <details>
        <summary>Reusable named term groups</summary>
        <p>
          Owner-wide vocabulary only. Active rules retain their pinned version
          until you adopt an update, preview and save.
        </p>
        <div className="space-y-3">
          {groups.map((g) => (
            <Button
              key={g.id}
              onClick={() => {
                setEditing(g);
                setName(g.name);
                setMembers(g.terms.join("\n"));
              }}
            >
              Edit {g.name} v{g.version}
            </Button>
          ))}
          <Input
            label="Term group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label="Group terms / aliases, one per line"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
          />
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await saveTermGroup(
                  editing?.id ?? null,
                  name,
                  split(members),
                  editing?.version ?? 0,
                  request,
                );
                setGroups(await getTermGroups());
                setEditing(null);
                setRequest(crypto.randomUUID());
                setName("");
                setMembers("");
                setMessage(
                  "Group version saved; active rules have not changed.",
                );
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Save named group version
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setRequest(crypto.randomUUID());
              setName("");
              setMembers("");
            }}
          >
            New group / cancel group edits
          </Button>
        </div>
      </details>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => void run(onPreview)}>
          Preview real sample
        </Button>
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => void run(onSave, true)}
        >
          Save relevance rules
        </Button>
        <Button disabled={busy} onClick={() => setDraft(initial)}>
          Cancel rule edits
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
