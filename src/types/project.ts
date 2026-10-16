import type { Rules } from "../../supabase/functions/_shared/rules";
export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  topics: string[];
  keywords: string[];
  archived: boolean;
  rules: Rules;
};
export type Subscription = {
  project_id: string;
  feed_id: string;
  followed?: boolean;
  enabled: boolean;
  rules: Partial<Rules> | null;
};
