import { describe, it, expect, vi } from "vitest";
import { bulletin, exportRows } from "./reports.api";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn().mockResolvedValue({ data: [] }),
}));

describe("reports api", () => {
  it("returns empty bulletin fallback", async () => {
    const { httpClient } = await import("@/services/core/client");
    (httpClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null });
    await expect(bulletin("2026-09-28")).resolves.toEqual({ week: "2026-09-28", diseases: [], hotspots: [], activeAlerts: [] });
  });
  it("lists export rows", async () => {
    await expect(exportRows()).resolves.toEqual([]);
  });
});
