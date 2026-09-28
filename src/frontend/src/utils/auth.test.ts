import { describe, expect, test } from "vitest";
import { isServerUnreachable } from "./auth";

describe("isServerUnreachable", () => {
  test("flags connection-refused shape", () => {
    expect(isServerUnreachable({ isAxiosError: true, code: "ERR_NETWORK" })).toBe(true);
  });
  test("ignores HTTP errors with a response", () => {
    expect(isServerUnreachable({ isAxiosError: true, response: { status: 401 } })).toBe(false);
  });
  test("ignores non-errors", () => {
    expect(isServerUnreachable(new Error("x"))).toBe(false);
  });
});
