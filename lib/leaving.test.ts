import assert from "node:assert/strict";
import test from "node:test";
import { RuleInputError, addYears, checkLeaving, nextWeekday } from "./leaving";

const T = "2026-11-01";

test("employee leaving 2027-03-20: owes FY2027 → agent needed; FY2026 lump sum mandatory; FY2028 avoided", () => {
  const r = checkLeaving({ departureDate: "2027-03-20", today: T });
  assert.equal(r.verdict, "agent_needed");
  const fy = Object.fromEntries(r.residentTax.fiscalYears.map((f) => [f.fiscalYear, f.status]));
  assert.deepEqual(fy, { 2026: "owed", 2027: "owed", 2028: "not_owed" });
  assert.equal(r.residentTax.lumpSumFromFinalPay, "mandatory");
  assert.equal(r.residentTax.agentRequired, true);
  assert.equal(r.residentTax.leaveByToAvoidNextFY, "2027-12-31");
  assert.equal(r.incomeTax.yearEndAdjustment, true);
  assert.equal(r.incomeTax.returnRequired, false);
  assert.ok(r.deadlines.some((d) => d.date === "2027-03-06" && !d.mandatory));
  assert.ok(r.deadlines.some((d) => d.date === "2027-06-15"));
  assert.equal(r.pension?.lumpSumClaimBy, "2029-03-20");
  assert.ok(r.disclaimer.includes("not tax or legal advice"));
});

test("employee leaving 2026-12-20: FY2026 rest on request, nothing for FY2027", () => {
  const r = checkLeaving({ departureDate: "2026-12-20", today: T });
  assert.equal(r.verdict, "settle_before_departure");
  assert.equal(r.residentTax.lumpSumFromFinalPay, "on_request");
  assert.deepEqual(r.residentTax.fiscalYears.map((f) => [f.fiscalYear, f.status]), [[2026, "owed"], [2027, "not_owed"]]);
  assert.match(r.summary, /No 住民税 for fiscal year 2027/);
});

test("January departure gets the Dec-31 tip only while it's still actionable", () => {
  const r = checkLeaving({ departureDate: "2027-01-15", today: T });
  assert.match(r.residentTax.jan1Tip ?? "", /December 31, 2026/);
  assert.equal(checkLeaving({ departureDate: "2027-01-15", today: "2027-01-05" }).residentTax.jan1Tip, null);
  const j1 = checkLeaving({ departureDate: "2027-01-01", today: T });
  assert.equal(j1.residentTax.fiscalYears.find((f) => f.fiscalYear === 2027)?.status, "check_with_city");
});

test("arrived after January 1 and leaving the same year: nothing after departure", () => {
  const r = checkLeaving({ departureDate: "2027-08-31", arrivalDate: "2027-02-01", today: T });
  assert.equal(r.verdict, "nothing_after_departure");
  assert.ok(r.residentTax.fiscalYears.every((f) => f.status === "not_owed"));
});

test("self-employed leaving January: 準確定申告 by departure, agent for 住民税", () => {
  const r = checkLeaving({ departureDate: "2027-01-15", employment: "self_employed", prevYearReturnPending: true, today: T });
  assert.equal(r.payMethod, "self");
  assert.equal(r.incomeTax.returnRequired, true);
  assert.equal(r.incomeTax.returnDeadline, "2027-01-15");
  assert.equal(r.incomeTax.previousYearReturnDeadline, "2027-01-15");
  assert.equal(r.verdict, "agent_needed");
  const withAgent = checkLeaving({ departureDate: "2027-01-15", employment: "self_employed", prevYearReturnPending: true, hasTaxAgent: true, today: T });
  assert.equal(withAgent.incomeTax.returnDeadline, "2028-03-15");
  assert.equal(withAgent.incomeTax.previousYearReturnDeadline, "2027-03-15");
  assert.equal(withAgent.incomeTax.agentRequired, true);
});

test("rental income after leaving → agent needed even with Dec departure", () => {
  const r = checkLeaving({ departureDate: "2026-12-10", incomeAfterLeaving: true, payMethod: "none", today: T });
  assert.equal(r.verdict, "agent_needed");
  assert.equal(r.incomeTax.agentRequired, true);
});

test("short trip: still resident", () => {
  const r = checkLeaving({ departureDate: "2027-02-01", plan: "short", today: T });
  assert.equal(r.verdict, "still_resident");
});

test("pension months", () => {
  assert.equal(checkLeaving({ departureDate: "2027-03-20", pensionMonths: 130, today: T }).pension?.lumpSumClaimBy, null);
  assert.equal(checkLeaving({ departureDate: "2027-03-20", nationality: "japanese", today: T }).pension, null);
});

test("helpers and errors", () => {
  assert.equal(nextWeekday("2026-03-15"), "2026-03-16");
  assert.equal(nextWeekday("2028-03-15"), "2028-03-15");
  assert.equal(addYears("2028-02-29", 2), "2030-02-28");
  assert.throws(() => checkLeaving({ departureDate: "2027-02-30" }), RuleInputError);
  assert.throws(() => checkLeaving({ departureDate: "2027-02-01", arrivalDate: "2027-03-01" }), RuleInputError);
});
