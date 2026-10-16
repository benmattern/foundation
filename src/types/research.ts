export type Question = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: "open" | "monitoring" | "answered" | "archived";
  answer: string;
  followups: string;
  version: number;
};
export type EvidenceSnapshot = {
  id: string;
  title: string;
  url?: string;
  published_at?: string | null;
  captured_at?: string;
  passage?: string;
  passage_origin?: { field: string; origin: string } | null;
};
export type QuestionArticle = {
  id: string;
  project_id: string;
  question_id: string;
  article_id: string | null;
  article_snapshot: EvidenceSnapshot;
  disposition: "supporting" | "challenging" | "background";
  note: string;
  linked: boolean;
  version: number;
};
export type ArticleNote = {
  id: string;
  article_id: string | null;
  article_snapshot: EvidenceSnapshot;
  body: string;
  version: number;
};
export type Finding = {
  id: string;
  question_id: string;
  observed: string;
  interpretation: string;
  uncertainties: string;
  citations: EvidenceSnapshot[];
  version: number;
};
export type Entity = {
  id: string;
  name: string;
  entity_type: "person" | "organization" | "place";
  aliases: string[];
  description: string;
  reference_url: string;
  version: number;
};
export type Mention = {
  id: string;
  article_id: string | null;
  article_snapshot: EvidenceSnapshot;
  entity_id: string;
  matched_alias: string;
  source_field: string;
  snapshot: string;
  span?: { start: number; end: number };
  matcher_version: number;
  state: "suggested" | "confirmed" | "dismissed";
  manual: boolean;
  version: number;
  updated_at: string;
};
export type ResearchEvidence = { field: string; text: string; origin: string };
export type MentionDraft = {
  entity_id: string;
  alias: string;
  field: string;
  snapshot: string;
  span: { start: number; end: number };
  ambiguous: boolean;
  short: boolean;
};
export type ResearchHistory = {
  id: string;
  object_id: string;
  object_type: string;
  before_state: unknown;
  after_state: unknown;
  recorded_at: string;
};
