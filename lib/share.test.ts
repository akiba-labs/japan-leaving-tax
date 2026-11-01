import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLES, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, safeCheck, sharedQuery } from "./share";

test("share links round-trip and compute", () => {
  for (const ex of EXAMPLES) {
    const back = parseShared(new URLSearchParams(sharedQuery(ex)));
    assert.deepEqual(back, ex);
    assert.ok(isIndexable(ex));
    assert.ok(safeCheck(ex), JSON.stringify(ex));
  }
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?l=2027-03-20&t=2026-11-01");
  assert.equal(safeCheck(EXAMPLES[0])!.verdict, "agent_needed");
  assert.equal(safeCheck(EXAMPLES[1])!.verdict, "settle_before_departure");
  assert.equal(safeCheck(EXAMPLES[2])!.incomeTax.returnDeadline, "2027-01-15");
});

test("bad share params → null or defaults", () => {
  assert.equal(parseShared(new URLSearchParams("l=soon")), null);
  assert.equal(parseShared(new URLSearchParams("e=pirate"))?.employment, undefined);
  assert.equal(parseShared(new URLSearchParams("l=2027-01-10&e=pirate"))!.employment, "employee");
});
