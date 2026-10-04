import { describe, it, expect, vi } from "vitest";
import { fetchTemplateText, listBatches, listIssues, resolveIssue, uploadBatch } from "./uploads.api";
import { buildTemplateCsv } from "../types/uploads.types";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn(),
  api: { request: vi.fn() },
}));

describe("uploads api", () => {
  it("uploads a file and returns the result summary", async () => {
    const { httpClient } = await import("@/services/core/client");
    (httpClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { batchId: 7, accepted: 3, quarantined: 1, duplicates: 0 },
    });
    await expect(uploadBatch(new File(["a"], "week39.csv"))).resolves.toEqual({
      batchId: 7, accepted: 3, quarantined: 1, duplicates: 0,
    });
  });

  it("lists batches", async () => {
    const { httpClient } = await import("@/services/core/client");
    (httpClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
    await expect(listBatches()).resolves.toEqual([]);
  });

  it("lists issues for a batch", async () => {
    const { httpClient } = await import("@/services/core/client");
    (httpClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] });
    await expect(listIssues(7)).resolves.toEqual([]);
  });

  it("resolves an issue", async () => {
    const { httpClient } = await import("@/services/core/client");
    (httpClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null });
    await expect(resolveIssue(9, "accept")).resolves.toBeUndefined();
  });

  it("prefers the server template and falls back to the client constant", async () => {
    const { api } = await import("@/services/core/client");
    (api.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: "morbidity_week,server" })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(fetchTemplateText()).resolves.toBe("morbidity_week,server");
    await expect(fetchTemplateText()).resolves.toBe(buildTemplateCsv());
  });
});
