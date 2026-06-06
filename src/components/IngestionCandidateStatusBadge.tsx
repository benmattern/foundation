import type { IngestionCandidateStatus } from "../types/ingestionCandidate";

type Props = {
  status: IngestionCandidateStatus;
};

const statusStyles: Record<IngestionCandidateStatus, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  accepted: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  rejected: "border-red-500/40 bg-red-500/10 text-red-200",
  duplicate: "border-slate-500/40 bg-slate-800 text-slate-300",
};

export function IngestionCandidateStatusBadge({ status }: Props) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
