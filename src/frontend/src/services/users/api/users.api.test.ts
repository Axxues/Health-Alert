import { describe, it, expect, vi } from "vitest";
import { listUsers } from "./users.api";

vi.mock("@/services/core/client", () => ({
  httpClient: vi.fn().mockResolvedValue({ data: [] }),
}));

describe("users api", () => {
  it("lists users", async () => {
    await expect(listUsers()).resolves.toEqual([]);
  });
});
