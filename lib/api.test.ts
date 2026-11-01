import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → agent_needed, FY2027 owed`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-11-01`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.verdict, "agent_needed");
  assert.equal(body.residentTax.lumpSumFromFinalPay, "mandatory");
  assert.equal(body.residentTax.fiscalYears.find((f: { fiscalYear: number }) => f.fiscalYear === 2027).status, "owed");
  assert.equal(body.rulesAsOf, "2026-11-01");
  assert.ok(body.sources.length >= 10);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-11-01`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), await get.json());
});

test("aliases and JSON booleans", async () => {
  const b = await (await handler(new Request(`${PUBLIC_URL}${e.path}?departure=2027-01-15&employment=${encodeURIComponent("個人事業主")}&taxAgent=yes&today=2026-11-01`))).json();
  assert.equal(b.employment, "self_employed");
  assert.equal(b.payMethod, "self");
  assert.equal(b.incomeTax.returnDeadline, "2028-03-15");
  const p = await (await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departureDate: "2026-12-20", payMethod: "普通徴収", incomeAfterLeaving: true, today: "2026-11-01" }) }))).json();
  assert.equal(p.payMethod, "self");
  assert.equal(p.verdict, "agent_needed");
  const t = await (await handler(new Request(`${PUBLIC_URL}${e.path}?departureDate=2027-02-01&plan=temporary&today=2026-11-01`))).json();
  assert.equal(t.verdict, "still_resident");
});

test("bad inputs → 400 with example", async () => {
  for (const q of ["", "plan=leave", "departureDate=2027-13-01", "departureDate=2027-02-01&plan=forever", "departureDate=2027-02-01&employment=pirate", "departureDate=2027-02-01&hasTaxAgent=maybe", "departureDate=2027-02-01&arrivalDate=2027-03-01", "departureDate=2027-02-01&pensionMonths=lots"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
  }
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "departureDate"));
});
