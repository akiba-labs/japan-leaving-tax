import { openapiDoc, preflight, staticJson } from "@/lib/agent-api";
import { API_INFO, ENDPOINTS, PUBLIC_URL } from "@/lib/api";

export function GET() {
  const base = openapiDoc(API_INFO, PUBLIC_URL, Object.values(ENDPOINTS)) as {
    paths: Record<string, unknown>;
    [k: string]: unknown;
  };
  base.paths["/api/rules"] = {
    get: {
      operationId: "japanLeavingTaxRules",
      summary: "Japan departure tax rules: 住民税 January 1 assessment date, fiscal year, lump-sum deduction from the final salary, tax agent (納税管理人), 準確定申告, previous-year return, exit tax, 転出届, pension lump sum, what is not covered, sources",
      description: "Returns the rules the checker applies, with law articles, official sources and disclaimer. No inputs.",
      responses: {
        "200": {
          description: "Rules JSON with rulesAsOf and sources.",
          content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
        },
      },
    },
  };
  return staticJson(base);
}
export const OPTIONS = preflight;
