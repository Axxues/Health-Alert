import { describe, it, expect } from "vitest";
import { sessionTitle, loadSessions } from "./GuidelinesPanel";

describe("rag sessions", () => {
  it("titles a session from the first query", () => {
    expect(sessionTitle("What is the dengue protocol?")).toBe("What is the dengue protocol?");
  });

  it("truncates long queries", () => {
    const t = sessionTitle("a".repeat(100));
    expect(t.length).toBeLessThanOrEqual(43);
    expect(t.endsWith("…")).toBe(true);
  });

  it("returns [] when storage is empty or corrupt", () => {
    // ponytail: vitest runs in node (no DOM), so stub the one storage API used
    const store: Record<string, string> = {};
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    expect(loadSessions()).toEqual([]);
    localStorage.setItem("ha.rag.sessions.v1", "not-json{{{");
    expect(loadSessions()).toEqual([]);
    localStorage.removeItem("ha.rag.sessions.v1");
  });
});
