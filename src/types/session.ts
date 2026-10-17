import type { Article } from "./article";
import type { Question, QuestionArticle, Finding } from "./research";
export type SessionWindow = {
  bound: number;
  reviewed: number;
  version: number;
  current_question: string | null;
  first_visit: boolean;
  count: number;
  pending: number;
  later: number;
  cursor: number;
  has_more: boolean;
  items: {
    seq: number;
    kind: string;
    object_id: string;
    question_id: string | null;
    title: string;
    recorded_at: string;
  }[];
};
export type WorkingView = {
  id: string;
  name: string;
  surface: "articles" | "ingestion";
  filters: Record<string, string>;
  version: number;
};
export type PacketLink = QuestionArticle & {
  article_revision?: string | null;
  collected_at?: string | null;
  article: Article | null;
  source: string | null;
  entities: string[];
  events: string[];
};
export type QuestionPacket = {
  citation_availability?: Record<string, boolean>;
  as_of: string;
  project: { name: string; description: string };
  question: Question;
  links: PacketLink[];
  findings: Finding[];
};
