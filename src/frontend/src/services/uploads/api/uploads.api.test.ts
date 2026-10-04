import { describe, it, expect, vi } from "vitest";
import { fetchPopulationTemplateText, fetchTemplateText, listBatches, listIssues, listPopulation, resolveIssue, uploadBatch, uploadPopulation } from "./uploads.api";
import { buildPopulationTemplateCsv, buildTemplateCsv } from "../types/uploads.types";

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

  it("uploads a population file as FormData and returns the summary", async () => {
    const { httpClient } = await import("@/services/core/client");
    const mock = httpClient as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce({
      data: { accepted: 2, errors: 1, errorLines: ["line 3: bad population"] },
    });
    const file = new File(["province,municipality,barangay,population,reference_year,source"], "population.csv");
    await expect(uploadPopulation(file)).resolves.toEqual({
      accepted: 2, errors: 1, errorLines: ["line 3: bad population"],
    });
    expect(mock).toHaveBeenCalledWith(
      "/surveillance/population/upload",
      expect.objectContaining({ method: "post" })
    );
    const sent = mock.mock.calls.find((c) => c[0] === "/surveillance/population/upload")?.[1]?.data;
    expect(sent).toBeInstanceOf(FormData);
    expect(sent.get("file")).toBe(file);
  });

  it("defaults empty population responses instead of fabricating numbers", async () => {
    const { httpClient } = await import("@/services/core/client");
    const mock = httpClient as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce({ data: null });
    await expect(uploadPopulation(new File([], "empty.csv"))).resolves.toEqual({
      accepted: 0, errors: 0, errorLines: [],
    });
    mock.mockResolvedValueOnce({ data: null });
    await expect(listPopulation({})).resolves.toEqual([]);
  });

  it("lists population rows with mapped filters", async () => {
    const { httpClient } = await import("@/services/core/client");
    const mock = httpClient as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce({ data: [] });
    await expect(listPopulation({ province: "La Union", municipality: "all", barangay: "" })).resolves.toEqual([]);
    expect(mock).toHaveBeenCalledWith(
      "/surveillance/population",
      expect.objectContaining({ method: "get", params: { province: "La Union" } })
    );
  });

  it("prefers the server population template and falls back when empty", async () => {
    const { api } = await import("@/services/core/client");
    (api.request as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: "province,municipality,server" })
      .mockResolvedValueOnce({ data: "   " });
    await expect(fetchPopulationTemplateText()).resolves.toBe("province,municipality,server");
    await expect(fetchPopulationTemplateText()).resolves.toBe(buildPopulationTemplateCsv());
  });
});
