import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/services/authService", () => ({
  getSession: vi.fn(),
  observeAuth: vi.fn(() => ({ unsubscribe() {} })),
}));
vi.mock("../src/services/projectService", () => ({
  activeProjectId: vi.fn(() => "project-a"),
  getProjects: vi.fn(),
}));
import { getSession } from "../src/services/authService";
import { getProjects } from "../src/services/projectService";
import {
  authorizeDataScope,
  emptyWorkspace,
  readPersisted,
  readSession,
  writePersisted,
  writeSession,
} from "../src/services/dataWorkspaceService";

describe("browser storage and authorization boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requires an authenticated server-visible owned project", async () => {
    vi.mocked(getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    await expect(authorizeDataScope()).rejects.toThrow("Sign in");
    vi.mocked(getSession).mockResolvedValue({
      data: { session: { user: { id: "owner-a" } } },
      error: null,
    } as Awaited<ReturnType<typeof getSession>>);
    vi.mocked(getProjects).mockResolvedValue([]);
    await expect(authorizeDataScope()).rejects.toThrow("Project access");
    vi.mocked(getProjects).mockResolvedValue([
      { id: "project-a", owner_id: "owner-b" },
    ] as Awaited<ReturnType<typeof getProjects>>);
    await expect(authorizeDataScope()).rejects.toThrow("Project access");
    vi.mocked(getProjects).mockResolvedValue([
      { id: "project-a", owner_id: "owner-a" },
    ] as Awaited<ReturnType<typeof getProjects>>);
    await expect(authorizeDataScope()).resolves.toEqual({
      owner: "owner-a",
      project: "project-a",
    });
  });
  it("separates owner/project keys, persists atomically, rejects stale tabs", async () => {
    const scope = { owner: crypto.randomUUID(), project: "a" };
    const workspace = emptyWorkspace();
    const saved = await writePersisted(scope, workspace);
    expect((await readPersisted(scope)).revision).toBe(1);
    expect(await readPersisted({ ...scope, project: "b" })).toEqual(
      emptyWorkspace(),
    );
    expect(await readPersisted({ owner: "other", project: "a" })).toEqual(
      emptyWorkspace(),
    );
    await expect(writePersisted(scope, workspace)).rejects.toThrow(
      "another tab",
    );
    const competing = await Promise.allSettled([writePersisted(scope, saved), writePersisted(scope, saved)]);
    expect(competing.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(competing.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect((await readPersisted(scope)).revision).toBe(2);
  });
  it("does not alias session state between owners or callers", () => {
    const scope = { owner: crypto.randomUUID(), project: "a" };
    writeSession(scope, emptyWorkspace());
    const copy = readSession(scope);
    copy.revision = 99;
    expect(readSession(scope).revision).toBe(0);
    expect(readSession({ ...scope, owner: "b" })).toEqual(emptyWorkspace());
  });
  it("reports unavailable storage without fabricating success", async () => {
    const original = globalThis.indexedDB;
    vi.stubGlobal("indexedDB", undefined);
    await expect(
      writePersisted({ owner: "a", project: "a" }, emptyWorkspace()),
    ).rejects.toThrow("unavailable");
    vi.stubGlobal("indexedDB", original);
  });
});
