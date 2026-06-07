import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { IngestionCandidateList } from "../components/IngestionCandidateList";
import { IngestionCandidateReview } from "../components/IngestionCandidateReview";
import type { IngestionCandidateReviewValues } from "../components/IngestionCandidateReview";
import type {
  IngestionCandidate,
  IngestionCandidateStatus,
} from "../types/ingestionCandidate";
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

const candidateStatuses: IngestionCandidateStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "duplicate",
];

export default function IngestionQueuePage() {
  const [candidates, setCandidates] = useState<IngestionCandidate[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedStatus, setSelectedStatus] =
    useState<IngestionCandidateStatus>("pending");
  const [selectedCandidate, setSelectedCandidate] =
    useState<IngestionCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadQueue(options?: {
    selectedStatus?: IngestionCandidateStatus;
    selectedCandidateId?: string | null;
  }) {
    try {
      const [candidateData, sourceData, tagData] = await Promise.all([
        getIngestionCandidates(),
        getSources(),
        getTags(),
      ]);

      setCandidates(candidateData);
      setSources(sourceData);
      setTags(tagData);

      const nextStatus = options?.selectedStatus ?? selectedStatus;
      const selectedCandidateId =
        options && "selectedCandidateId" in options
          ? options.selectedCandidateId
          : selectedCandidate?.id;

      if (options?.selectedStatus) {
        setSelectedStatus(options.selectedStatus);
      }

      setSelectedCandidate(
        selectCandidateForStatus(
          candidateData,
          nextStatus,
          selectedCandidateId ?? null
        )
      );
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

  function selectStatus(status: IngestionCandidateStatus) {
    setSelectedStatus(status);
    setSelectedCandidate(selectCandidateForStatus(candidates, status, null));
  }

  async function reloadAfterReview(reviewedCandidateId: string) {
    const [candidateData, sourceData, tagData] = await Promise.all([
      getIngestionCandidates(),
      getSources(),
      getTags(),
    ]);
    const nextPending =
      candidateData.find(
        (candidate) =>
          candidate.status === "pending" && candidate.id !== reviewedCandidateId
      ) ?? null;

    setCandidates(candidateData);
    setSources(sourceData);
    setTags(tagData);
    setSelectedStatus("pending");
    setSelectedCandidate(nextPending);
  }

  function moveReviewedCandidateOutOfPending(
    candidateId: string,
    status: Exclude<IngestionCandidateStatus, "pending">
  ) {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, status } : candidate
      )
    );
  }

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

      moveReviewedCandidateOutOfPending(candidate.id, "accepted");
      await reloadAfterReview(candidate.id);
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
      moveReviewedCandidateOutOfPending(candidate.id, "rejected");
      await reloadAfterReview(candidate.id);
    } catch (error) {
      console.error("Error rejecting ingestion candidate:", error);
      setErrorMessage("Unable to reject this candidate.");
    }
  }

  async function markDuplicate(candidate: IngestionCandidate) {
    try {
      await markIngestionCandidateDuplicate(candidate.id);
      moveReviewedCandidateOutOfPending(candidate.id, "duplicate");
      await reloadAfterReview(candidate.id);
    } catch (error) {
      console.error("Error marking ingestion candidate duplicate:", error);
      setErrorMessage("Unable to mark this candidate as duplicate.");
    }
  }

  const statusCounts = candidateStatuses.reduce<
    Record<IngestionCandidateStatus, number>
  >(
    (counts, status) => ({
      ...counts,
      [status]: candidates.filter((candidate) => candidate.status === status)
        .length,
    }),
    {
      pending: 0,
      accepted: 0,
      rejected: 0,
      duplicate: 0,
    }
  );
  const filteredCandidates = candidates.filter(
    (candidate) => candidate.status === selectedStatus
  );

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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <IngestionCandidateList
              candidates={filteredCandidates}
              sources={sources}
              selectedStatus={selectedStatus}
              statusCounts={statusCounts}
              selectedCandidateId={selectedCandidate?.id ?? null}
              onSelectStatus={selectStatus}
              onSelectCandidate={setSelectedCandidate}
            />

            <div className="lg:sticky lg:top-6 lg:self-start">
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
        </div>
      )}
    </>
  );
}

function selectCandidateForStatus(
  candidates: IngestionCandidate[],
  status: IngestionCandidateStatus,
  selectedCandidateId: string | null
): IngestionCandidate | null {
  const candidatesForStatus = candidates.filter(
    (candidate) => candidate.status === status
  );

  if (selectedCandidateId) {
    const existingSelection = candidatesForStatus.find(
      (candidate) => candidate.id === selectedCandidateId
    );

    if (existingSelection) {
      return existingSelection;
    }
  }

  return candidatesForStatus[0] ?? null;
}
