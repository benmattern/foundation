export type Tag = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type ArticleTag = {
  article_id: string;
  tag_id: string;
  created_at: string;
};