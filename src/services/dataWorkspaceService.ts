import { getSession, observeAuth } from "./authService";
import { activeProjectId, getProjects } from "./projectService";
import type { DataScope, LocalWorkspace } from "../types/dataset";
import { DATA_LIMITS } from "../lib/dataImport";

const sessions = new Map<string, LocalWorkspace>();
let sessionOwner: string | null = null;
// Do not retain a prior identity's in-memory rows after sign-out/account change.
observeAuth(() => {
  void getSession().then(({ data }) => {
    const nextOwner = data.session?.user.id ?? null;
    if (nextOwner !== sessionOwner) sessions.clear();
    sessionOwner = nextOwner;
  });
});
export const emptyWorkspace = (): LocalWorkspace => ({
  version: 1,
  revision: 0,
  datasets: [],
  analyses: [],
});
export async function authorizeDataScope(): Promise<DataScope> {
  const project = activeProjectId();
  const { data, error } = await getSession();
  if (error || !data.session)
    throw new Error("Sign in before opening local research data.");
  const owner = data.session.user.id;
  if (sessionOwner && sessionOwner !== owner) sessions.clear();
  sessionOwner = owner;
  const projects = await getProjects(); // Existing server RLS remains the authority.
  if (
    !projects.some((p) => p.id === project && p.owner_id === owner) ||
    activeProjectId() !== project
  )
    throw new Error(
      "Project access is unavailable. Select an authorized project.",
    );
  return { owner, project };
}
export function scopeKey(scope: DataScope) {
  return JSON.stringify([scope.owner, scope.project]);
}
export function readSession(scope: DataScope) {
  return structuredClone(sessions.get(scopeKey(scope)) ?? emptyWorkspace());
}
export function writeSession(scope: DataScope, workspace: LocalWorkspace) {
  sessions.set(scopeKey(scope), structuredClone(workspace));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB)
      return reject(
        new Error("Browser storage is unavailable. Use session-only data."),
      );
    const request = indexedDB.open("foundation-data-v1", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workspaces");
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage could not be opened. Use session-only data.",
        ),
      );
    request.onblocked = () =>
      reject(
        new Error(
          "Storage upgrade blocked. Close other FOUNDATION tabs and retry.",
        ),
      );
    request.onsuccess = () => resolve(request.result);
  });
}
export function validateWorkspace(workspace: LocalWorkspace) {
  if (
    workspace.version !== 1 ||
    !Number.isSafeInteger(workspace.revision) ||
    workspace.revision < 0 ||
    !Array.isArray(workspace.datasets) ||
    !Array.isArray(workspace.analyses)
  )
    throw new Error(
      "Unsupported local workspace. Clear browser site data only after exporting any needed work.",
    );
  if (
    workspace.datasets.length > DATA_LIMITS.datasets ||
    workspace.analyses.length > DATA_LIMITS.analyses
  )
    throw new Error(
      "Local limit: 12 datasets and 50 analyses per project. Delete unused work.",
    );
  if (new Blob([JSON.stringify(workspace)]).size > DATA_LIMITS.workspaceBytes)
    throw new Error(
      "Workspace exceeds 40 MiB. Delete unused data or use session-only mode.",
    );
}
export async function readPersisted(scope: DataScope): Promise<LocalWorkspace> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("workspaces", "readonly");
      const request = transaction
        .objectStore("workspaces")
        .get(scopeKey(scope));
      transaction.oncomplete = () => {
        try {
          const value = request.result ?? emptyWorkspace();
          validateWorkspace(value);
          resolve(value);
        } catch (e) {
          reject(e);
        }
      };
      transaction.onerror = () =>
        reject(
          new Error(
            "Saved data could not be read. Session-only import is still available.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function writePersisted(
  scope: DataScope,
  workspace: LocalWorkspace,
): Promise<LocalWorkspace> {
  validateWorkspace(workspace);
  const db = await openDatabase();
  try {
    return await new Promise<LocalWorkspace>((resolve, reject) => {
      const transaction = db.transaction("workspaces", "readwrite");
      const store = transaction.objectStore("workspaces");
      const request = store.get(scopeKey(scope));
      let conflict = false;
      const next = { ...workspace, revision: workspace.revision + 1 };
      request.onsuccess = () => {
        if ((request.result?.revision ?? 0) !== workspace.revision) {
          conflict = true;
          transaction.abort();
        } else store.put(next, scopeKey(scope));
      };
      transaction.oncomplete = () => resolve(next);
      transaction.onabort = transaction.onerror = () =>
        reject(
          new Error(
            conflict
              ? "Local data changed in another tab. Reload before saving; this save did not overwrite it."
              : "Browser save failed (quota or storage access). Your session data is retained. Free space and retry.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
