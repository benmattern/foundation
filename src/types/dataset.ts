export type FieldType = "text" | "number" | "boolean" | "date";
export type Cell = string | number | boolean | null;
export type DataRow = Record<string, Cell>;
export type DataField = { name: string; type: FieldType; unit: string };
export type ImportDraft = {
  fields: DataField[];
  rows: DataRow[];
  filename: string;
  fingerprint: string;
  bytes: number;
};
export type Dataset = ImportDraft & {
  id: string;
  name: string;
  source: string;
  provenance: string;
  importedAt: string;
};
export type Analysis = {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  fingerprint: string;
  sql: string;
  config: Record<string, unknown>;
  note: string;
  createdAt: string;
  source: {
    attribution: string;
    filename: string;
    provenance: string;
    importedAt: string;
    fields: DataField[];
  };
  snapshot?: {
    rows: DataRow[];
    fields: DataField[];
    capturedAt: string;
    truncated: boolean;
  };
};
export type LocalWorkspace = {
  version: 1;
  revision: number;
  datasets: Dataset[];
  analyses: Analysis[];
};
export type DataScope = { owner: string; project: string };
