export type Article = {
  id: string;
  source_id: string | null;
  title: string;
  url: string;
  summary: string | null;
  published_at: string | null;
  created_at: string;
};