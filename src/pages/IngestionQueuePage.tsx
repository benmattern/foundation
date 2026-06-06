import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { IngestionCandidateList } from "../components/IngestionCandidateList";
import { IngestionCandidateReview } from "../components/IngestionCandidateReview";
import type { IngestionCandidateReviewValues } from "../components/IngestionCandidateReview";
import type { IngestionCandidate } from "../types/ingestionCandidate";
import type { Source } from "../types/source";
import type { Tag } from "../types/tag";
import { getSources } from "../services/sourceService";
import { getTags } from "../services/tagService";
import {
  acceptIngestionCandidate,
  getIngestionCandidates,
  markIngestionCandidateDuplicate,
  rejectIngestionCandidate,
  updateIngestionCandidate,
} from "../services/ingestionCandidateService";

export default function IngestionQueuePage() {
  const [candidates, setCandidates] = useState<IngestionCandidate[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<IngestionCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadQueue() {
    try {
      const [candidateData, sourceData, tagData] = await Promise.all([
        getIngestionCandidates(),
        getSources(),
        getTags(),
      ]);

      setCandidates(candidateData);
      setSources(sourceData);
      setTags(tagData);

      if (selectedCandidate) {
        setSelectedCandidate(
          candidateData.find((candidate) => candidate.id === selectedCandidate.id) ??
            null
        );
      }
    } catch (error) {
      console.error("Error loading ingestion queue:", error);
      setErrorMessage("Unable to load the ingestion queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function acceptCandidate(
    candidate: IngestionCandidate,
    values: IngestionCandidateReviewValues
  ) {
    try {
      const updatedCandidate = await updateIngestionCandidate(candidate.id, {
        url: values.url,
        canonical_url: values.canonical_url || null,
        final_url: values.final_url || null,
        source_id: values.source_id || null,
        title: values.title || null,
        description: values.description || null,
        published_at: values.published_at || null,
      });

      await acceptIngestionCandidate(updatedCandidate.id, {
        source_id: values.source_id || null,
        title: values.title,
        url: values.canonical_url || values.final_url || values.url,
        summary: values.description,
        published_at: values.published_at,
        tag_ids: values.tag_ids,
      });

      await loadQueue();
    } catch (error) {
      console.error("Error accepting ingestion candidate:", error);
      setErrorMessage("Unable to accept this candidate.");
    }
  }

  async function rejectCandidate(
    candidate: IngestionCandidate,
    rejectionReason: string
  ) {
    try {
      await rejectIngestionCandidate(candidate.id, rejectionReason);
      await loadQueue();
    } catch (error) {
      console.error("Error rejecting ingestion candidate:", error);
      setErrorMessage("Unable to reject this candidate.");
    }
  }

  async function markDuplicate(candidate: IngestionCandidate) {
    try {
      await markIngestionCandidateDuplicate(candidate.id);
      await loadQueue();
    } catch (error) {
      console.error("Error marking ingestion candidate duplicate:", error);
      setErrorMessage("Unable to mark this candidate as duplicate.");
    }
  }

  return (
    <>
      <PageHeader
        title="Ingestion"
        description="Review intake candidates before promoting them into approved articles."
      />

      {loading ? (
        <p className="text-slate-400">Loading ingestion queue...</p>
      ) : (
        <div className="space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <IngestionCandidateList
              candidates={candidates}
              sources={sources}
              selectedCandidateId={selectedCandidate?.id ?? null}
              onSelectCandidate={setSelectedCandidate}
            />

            <IngestionCandidateReview
              candidate={selectedCandidate}
              sources={sources}
              tags={tags}
              onAcceptCandidate={acceptCandidate}
              onRejectCandidate={rejectCandidate}
              onMarkDuplicate={markDuplicate}
            />
          </div>
        </div>
      )}
    </>
  );
}
