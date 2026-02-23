import test from "node:test";
import assert from "node:assert/strict";

test("domain package smoke test", () => {
  assert.equal(typeof Math.pow, "function");
});
