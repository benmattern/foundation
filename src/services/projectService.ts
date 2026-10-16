import { supabase } from "../lib/supabaseClient";
import type { Project, Subscription } from "../types/project";
import { queryAll } from "./queryAll";

let currentProject: string | null = null;
export function setActiveProject(id: string | null) {
  currentProject = id;
}
export function activeProjectId() {
  if (!currentProject) throw new Error("Select a project first.");
  return currentProject;
}
export async function getProjects(): Promise<Project[]> {
  return queryAll<Project>((from, to) =>
    supabase
      .from("projects")
      .select("*")
      .order("created_at")
      .order("id")
      .range(from, to),
  );
}
export async function saveProject(values: Partial<Project>, id?: string) {
  const query = id
    ? supabase.from("projects").update(values).eq("id", id)
    : supabase.from("projects").insert(values);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as Project;
}
export async function getSubscriptions(): Promise<Subscription[]> {
  const project = activeProjectId();
  return queryAll<Subscription>((from, to) =>
    supabase
      .from("project_subscriptions")
      .select("*")
      .eq("project_id", project)
      .order("feed_id")
      .range(from, to),
  );
}
export async function saveSubscription(
  feedId: string,
  enabled: boolean,
  rules: Subscription["rules"] = null,
  expected?: Subscription["rules"],
) {
  const { error } = await supabase.rpc("set_subscription", {
    p_project: activeProjectId(),
    p_feed: feedId,
    p_enabled: enabled,
    p_rules: rules,
    p_expected: expected === undefined ? null : { rules: expected },
  });
  if (error) throw error;
}
export async function setSourceEnabled(sourceId: string, enabled: boolean) {
  const { error } = await supabase.rpc("set_source_enabled", {
    p_project: activeProjectId(),
    p_source: sourceId,
    p_enabled: enabled,
  });
  if (error) throw error;
}

export type ProjectSourceState = {
  project_id: string;
  source_id: string;
  state: "following" | "paused" | "unfollowed";
  version: number;
};
export function getSourceStates(): Promise<ProjectSourceState[]> {
  const id = activeProjectId();
  return queryAll<ProjectSourceState>((a, b) =>
    supabase
      .from("project_sources")
      .select("*")
      .eq("project_id", id)
      .order("source_id")
      .range(a, b),
  );
}
export async function setSourceState(
  sourceId: string,
  state: ProjectSourceState["state"],
  expected?: number,
) {
  const { error } = await supabase.rpc("set_source_state", {
    p_project: activeProjectId(),
    p_source: sourceId,
    p_state: state,
    p_expected: expected ?? null,
  });
  if (error) throw error;
}
