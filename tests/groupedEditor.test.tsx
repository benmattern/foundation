import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { GroupedRuleEditor } from "../src/components/GroupedRuleEditor";
const groups = vi.hoisted(() => ({ version: 1 }));
vi.mock("../src/services/termGroupService", () => ({
  getTermGroups: vi.fn(async () => [
    {
      id: "group-one",
      name: "Places",
      version: groups.version,
      terms: groups.version === 1 ? ["Taiwan"] : ["Taiwan", "Japan"],
    },
  ]),
  saveTermGroup: vi.fn(async () => {
    groups.version++;
  }),
}));
it("keeps pinned vocabulary stable until the analyst explicitly adopts a new version", async () => {
  const save = vi.fn(async () => {}),
    preview = vi.fn(async () => {});
  render(
    <GroupedRuleEditor
      initial={{
        version: 1,
        format: 2,
        mode: "restricted",
        groups: [[{ terms: [], fields: ["title"], mode: "whole" }]],
        exclusions: [],
        includeAny: [],
        excludeAny: [],
        defaultTags: [],
        keywordTags: [],
      }}
      tags={[]}
      onSave={save}
      onPreview={preview}
    />,
  );
  await screen.findByRole("option", { name: "Places v1" });
  fireEvent.change(screen.getByLabelText("Named term group"), {
    target: { value: "group-one" },
  });
  expect(screen.getByText("Pinned Places v1: Taiwan")).toBeTruthy();
  fireEvent.click(screen.getByText("Reusable named term groups"));
  fireEvent.click(screen.getByRole("button", { name: "Edit Places v1" }));
  fireEvent.change(
    screen.getByLabelText("Group terms / aliases, one per line"),
    { target: { value: "Taiwan\nJapan" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Save named group version" }),
  );
  await screen.findByRole("button", { name: "Edit Places v2" });
  expect(screen.getByText("Pinned Places v1: Taiwan")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Adopt v2 in draft/ }));
  fireEvent.click(screen.getByRole("button", { name: "Preview real sample" }));
  await waitFor(() => expect(preview).toHaveBeenCalled());
  expect(preview.mock.calls[0]?.[0]).toMatchObject({
    groups: [
      [{ group: { id: "group-one", version: 2, terms: ["Taiwan", "Japan"] } }],
    ],
  });
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Save relevance rules" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save relevance rules" }));
  await waitFor(() => expect(save).toHaveBeenCalled());
});
