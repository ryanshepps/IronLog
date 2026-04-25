import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeNumericInput, clampNumber } from "../client/lib/numeric";

test("sanitizeNumericInput strips non-numeric characters", () => {
  assert.equal(sanitizeNumericInput("12abc"), "12");
  assert.equal(sanitizeNumericInput("1a2b3"), "123");
});

test("sanitizeNumericInput preserves a single decimal point", () => {
  assert.equal(sanitizeNumericInput("12.5"), "12.5");
  assert.equal(sanitizeNumericInput("0."), "0.");
  assert.equal(sanitizeNumericInput("."), ".");
});

test("sanitizeNumericInput collapses multiple decimal points", () => {
  assert.equal(sanitizeNumericInput("12.5.6"), "12.56");
  assert.equal(sanitizeNumericInput("1..2"), "1.2");
});

test("clampNumber bounds value", () => {
  assert.equal(clampNumber(5, 0, 10), 5);
  assert.equal(clampNumber(-1, 0, 10), 0);
  assert.equal(clampNumber(99, 0, 10), 10);
});
