import { expect, test } from "bun:test";
import { normalizeResultCount } from "../src/lib/resultCount";

test("caps older saved server counts at 20 without changing valid counts", () => {
    expect(normalizeResultCount(100, 5)).toBe(20);
    expect(normalizeResultCount(20, 5)).toBe(20);
    expect(normalizeResultCount(8, 5)).toBe(8);
});
