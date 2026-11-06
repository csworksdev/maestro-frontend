import { describe, expect, it } from "vitest";
import {
  formatBlogDate,
  getBlogCollection,
  getBlogPageCount,
} from "./blogUtils";

describe("blogUtils", () => {
  it("supports paginated and plain-array API responses", () => {
    expect(getBlogCollection({ results: [{ post_id: 1 }] })).toHaveLength(1);
    expect(getBlogCollection([{ post_id: 1 }])).toHaveLength(1);
    expect(getBlogCollection(null)).toEqual([]);
  });

  it("does not crash on an invalid date", () => {
    expect(formatBlogDate("not-a-date")).toBe("-");
    expect(formatBlogDate(null)).toBe("-");
  });

  it("calculates pagination safely", () => {
    expect(getBlogPageCount({ count: 41 }, 20)).toBe(3);
    expect(getBlogPageCount([{ post_id: 1 }], 20)).toBe(1);
    expect(getBlogPageCount({}, 0)).toBe(0);
  });
});
