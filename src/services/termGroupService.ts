import { supabase } from "../lib/supabaseClient";
import { queryAll } from "./queryAll";
export type TermGroup = {
  id: string;
  name: string;
  version: number;
  terms: string[];
};
export async function getTermGroups(): Promise<TermGroup[]> {
  const [groups, versions] = await Promise.all([
    queryAll<Omit<TermGroup, "terms">>((a, b) =>
      supabase.from("term_groups").select("*").order("id").range(a, b),
    ),
    queryAll<{ group_id: string; version: number; terms: string[] }>((a, b) =>
      supabase
        .from("term_group_versions")
        .select("*")
        .order("group_id")
        .order("version")
        .range(a, b),
    ),
  ]);
  return groups.map((g) => ({
    ...g,
    terms:
      versions.find((v) => v.group_id === g.id && v.version === g.version)
        ?.terms ?? [],
  }));
}
export async function saveTermGroup(
  id: string | null,
  name: string,
  terms: string[],
  expected = 0,
  request?: string,
) {
  const { error } = await supabase.rpc("save_term_group", {
    p_id: id,
    p_name: name,
    p_terms: terms,
    p_expected: expected,
    p_request: request ?? null,
  });
  if (error) throw error;
}
