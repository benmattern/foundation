import { supabase } from "../lib/supabaseClient";
import { activeProjectId } from "./projectService";
import type {
  SessionWindow,
  WorkingView,
  QuestionPacket,
} from "../types/session";
import { queryAll } from "./queryAll";
export async function sessionRpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.rpc(name, {
    p_project: activeProjectId(),
    ...args,
  });
  if (error) throw Error(error.message);
  return data as T;
}
export const sessionWindow = (
  after: number | null = null,
  bound: number | null = null,
) =>
  sessionRpc<SessionWindow>("session_window", {
    p_after: after,
    p_bound: bound,
  });
export const saveSession = (
  expected: number,
  bound: number | null = null,
  question: string | null = null,
) =>
  sessionRpc("save_session", {
    p_expected: expected,
    p_bound: bound,
    p_question: question,
  });
export const getWorkingViews = () =>
  queryAll<WorkingView>((from, to) =>
    supabase
      .from("saved_views")
      .select("*")
      .eq("project_id", activeProjectId())
      .order("id")
      .range(from, to),
  );
export const saveWorkingView = (view: WorkingView, remove = false) =>
  sessionRpc<WorkingView>("save_working_view", {
    p_id: view.id,
    p_name: view.name,
    p_surface: view.surface,
    p_filters: view.filters,
    p_expected: view.version,
    p_delete: remove,
  });
export const questionPacket = (
  question: string,
  articles: string[],
  findings: string[],
) =>
  sessionRpc<QuestionPacket>("question_packet", {
    p_question: question,
    p_articles: articles,
    p_findings: findings,
  });
export const questionChoices = (
  question: string,
  after: string | null = null,
  findingAfter: string | null = null,
) =>
  sessionRpc<{
    links: QuestionPacket["links"];
    findings: QuestionPacket["findings"];
  }>("question_choices", { p_question: question, p_after: after,p_fafter:findingAfter });
