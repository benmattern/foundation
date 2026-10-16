import { expect, it } from "vitest";
import { queryAll } from "../src/services/queryAll";
it("loads beyond the hosted default row cap and propagates later-page failures", async () => {
  const rows = Array.from({ length: 1251 }, (_, id) => ({ id }));
  expect(
    await queryAll(async (from, to) => ({
      data: rows.slice(from, to + 1),
      error: null,
    })),
  ).toEqual(rows);
  expect(
    await queryAll(async (from, to) => ({
      data: rows.slice(from, Math.min(to + 1, from + 40)),
      error: null,
    })),
  ).toEqual(rows);
  await expect(
    queryAll(async (from) => ({
      data: from === 0 ? rows.slice(0, 100) : null,
      error: from === 0 ? null : new Error("Page failed"),
    })),
  ).rejects.toThrow("Page failed");
});
