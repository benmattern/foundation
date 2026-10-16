import { supabase } from "../lib/supabaseClient";
import { activeProjectId } from "./projectService";
import { queryAll } from "./queryAll";
import type {
  Question,
  QuestionArticle,
  ArticleNote,
  Finding,
  Entity,
  Mention,
  ResearchEvidence,
  MentionDraft,
  ResearchHistory,
} from "../types/research";

function projectRows<T>(table: string): Promise<T[]> {
  const project = activeProjectId();
  return queryAll<T>((from, to) =>
    supabase
      .from(table)
      .select("*")
      .eq("project_id", project)
      .order("id")
      .range(from, to),
  );
}
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw Error(error.message);
  return data as T;
}
export const getQuestions = () => projectRows<Question>("research_questions");
export const getQuestionArticles = () =>
  projectRows<QuestionArticle>("question_articles");
export const getArticleNotes = () => projectRows<ArticleNote>("article_notes");
export const getFindings = () => projectRows<Finding>("research_findings");
export const getMentions = () => projectRows<Mention>("entity_mentions");
export async function getResearchHistory(): Promise<ResearchHistory[]> {
  const { data, error } = await supabase
    .from("research_history")
    .select("*")
    .eq("project_id", activeProjectId())
    .order("recorded_at", { ascending: false })
    .order("id")
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ResearchHistory[];
}
export function getEntities(): Promise<Entity[]> {
  return queryAll<Entity>((from, to) =>
    supabase
      .from("entities")
      .select("*")
      .order("name")
      .order("id")
      .range(from, to),
  );
}
export const saveQuestion = (
  values: Partial<Question>,
  existing?: Question,
  request?: string,
) =>
  rpc<Question>("save_question", {
    p_project: activeProjectId(),
    p_values: {
      ...values,
      ...(!existing && request ? { request_id: request } : {}),
    },
    p_id: existing?.id ?? null,
    p_expected: existing?.version ?? 0,
  });
export const linkQuestionArticle = (
  question: string,
  article: string,
  values: Partial<QuestionArticle>,
  existing?: QuestionArticle,
) =>
  rpc<QuestionArticle>("link_question_article", {
    p_project: activeProjectId(),
    p_question: question,
    p_article: article,
    p_values: values,
    p_expected: existing?.version ?? 0,
  });
export const saveArticleNote = (
  article: string,
  body: string,
  existing?: ArticleNote,
) =>
  rpc<ArticleNote>("save_article_note", {
    p_project: activeProjectId(),
    p_article: article,
    p_body: body,
    p_expected: existing?.version ?? 0,
  });
export const saveFinding = (
  question: string,
  values: Partial<Finding>,
  existing?: Finding,
  request?: string,
) =>
  rpc<Finding>("save_finding", {
    p_project: activeProjectId(),
    p_question: question,
    p_values: {
      ...values,
      ...(!existing && request ? { request_id: request } : {}),
    },
    p_id: existing?.id ?? null,
    p_expected: existing?.version ?? 0,
  });
export const saveEntity = (
  values: Partial<Entity>,
  existing?: Entity,
  request?: string,
) =>
  rpc<Entity>("save_entity", {
    p_values: {
      ...values,
      ...(!existing && request ? { request_id: request } : {}),
    },
    p_id: existing?.id ?? null,
    p_expected: existing?.version ?? 0,
  });
export const getResearchEvidence = (article: string) =>
  rpc<ResearchEvidence[]>("research_evidence", {
    p_project: activeProjectId(),
    p_article: article,
  });
export const saveMentions = (
  article: string,
  drafts: Partial<MentionDraft>[],
  manual = false,
) =>
  rpc<number>("save_mentions", {
    p_project: activeProjectId(),
    p_article: article,
    p_suggestions: drafts,
    p_manual: manual,
  });
export const reviewMention = (mention: Mention, state: Mention["state"]) =>
  rpc<Mention>("review_mention", {
    p_project: activeProjectId(),
    p_id: mention.id,
    p_state: state,
    p_expected: mention.version,
  });
