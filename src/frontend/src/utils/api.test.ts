import { expect, test } from "vitest";
import { buildPaginatedParams } from "./api";

test("builds paginated params", () => {
  expect(buildPaginatedParams({ page: 2, search: "a" })).toMatchObject({ page: 2, search: "a" });
});
