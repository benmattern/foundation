import type { FoundationEvent } from "./event";
export type ReferenceKind = "article" | "entity" | "question";
export type EventReference = {
  id?: string;
  kind: ReferenceKind;
  target_id: string;
  disposition: "context" | "supports" | "challenges";
  note: string;
  snapshot: {
    id: string;
    title: string;
    url?: string;
    source_id?: string | null;
    source_name?: string | null;
    published_at?: string | null;
    collected_at?: string | null;
    approved_at?: string | null;
    item_id?: string | null;
  };
  available?: boolean;
  linked?: boolean;
};
export type TimelineEvent = FoundationEvent & {
  project_id: string;
  version: number;
  date_start: string | null;
  date_end: string | null;
  date_approximate: boolean;
  date_note: string;
  date_origin: "explicit" | "legacy_timestamp";
  timeline_start: string | null;
  timeline_end: string | null;
  claim_kind:
    | "unverified"
    | "source_reported"
    | "analyst_observation"
    | "disputed";
  analyst_notes: string;
  evidence_count?: number;
  entity_count?: number;
  question_count?: number;
};
export type TimelineDetail = TimelineEvent & {
  references: EventReference[];
  history: {
    id: string;
    recorded_at: string;
    before_state: unknown;
    after_state: unknown;
  }[];
};
export type TimelinePage = {
  items: TimelineEvent[];
  total: number;
  matched: number;
  has_more: boolean;
};
export type TimelineFilters = {
  search: string;
  from: string;
  to: string;
  type: string;
  entity: string;
  question: string;
  source: string;
  article: string;
  order: "asc" | "desc";
};
export type TimelineValues = {
  title: string;
  description: string;
  event_type: string;
  status: FoundationEvent["status"];
  location: string;
  date_start: string;
  date_end: string;
  date_approximate: boolean;
  date_note: string;
  claim_kind: TimelineEvent["claim_kind"];
  analyst_notes: string;
  references: EventReference[];
};
export type TimelineOption = { id: string; label: string; detail?: string };
