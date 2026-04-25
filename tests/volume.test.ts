import { test } from "node:test";
import assert from "node:assert/strict";
import { totalVolume, averageFeeling } from "../client/lib/volume";

test("totalVolume sums weight*reps", () => {
  assert.equal(
    totalVolume([
      { weight: 100, reps: 5 },
      { weight: 110, reps: 3 },
    ]),
    830
  );
  assert.equal(totalVolume([]), 0);
});

test("averageFeeling returns null for empty", () => {
  assert.equal(averageFeeling([]), null);
});

test("averageFeeling computes mean", () => {
  assert.equal(
    averageFeeling([{ feeling: 2 }, { feeling: 4 }, { feeling: 3 }]),
    3
  );
});
