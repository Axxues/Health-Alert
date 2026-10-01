import { describe, it, expect, vi } from "vitest";
import { listAlerts } from "./alerts.api";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn().mockResolvedValue({ data: [] }),
}));

describe("alerts api", () => {
  it("lists alerts", async () => {
    await expect(listAlerts()).resolves.toEqual([]);
  });
});
