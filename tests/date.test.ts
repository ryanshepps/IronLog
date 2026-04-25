import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDateLocal } from "../client/lib/date";

test("formatDateLocal formats as YYYY-MM-DD with zero padding", () => {
  assert.equal(formatDateLocal(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(formatDateLocal(new Date(2026, 11, 31)), "2026-12-31");
});

test("formatDateLocal uses local timezone (not UTC)", () => {
  const d = new Date(2026, 3, 25, 23, 30);
  assert.equal(formatDateLocal(d), "2026-04-25");
});
