import { useCallback, useEffect, useState } from "react";
import { getArticles } from "../services/articleService";
import { getSources } from "../services/sourceService";
import { getEvents, getArticleEvents } from "../services/eventService";
import {
  getQuestions,
  getQuestionArticles,
  getArticleNotes,
  getFindings,
  getEntities,
  getMentions,
  getResearchHistory,
} from "../services/researchService";
async function load() {
  const [
    articles,
    sources,
    events,
    eventLinks,
    questions,
    links,
    notes,
    findings,
    entities,
    mentions,
    history,
  ] = await Promise.all([
    getArticles(),
    getSources(),
    getEvents(),
    getArticleEvents(),
    getQuestions(),
    getQuestionArticles(),
    getArticleNotes(),
    getFindings(),
    getEntities(),
    getMentions(),
    getResearchHistory(),
  ]);
  return {
    articles,
    sources,
    events,
    eventLinks,
    questions,
    links,
    notes,
    findings,
    entities,
    mentions,
    history,
  };
}
export type ResearchData = Awaited<ReturnType<typeof load>>;
export function useResearchData() {
  const [data, setData] = useState<ResearchData | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    load()
      .then((d) => {
        if (active) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  return { data, error, refresh };
}
