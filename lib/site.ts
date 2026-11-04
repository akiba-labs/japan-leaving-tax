export const SITE_NAME = "Japan Leaving Tax Check";

export const SITE_TAGLINE =
  "Leaving Japan? See whether you still owe resident tax (住民税) for the coming fiscal year, why leaving by December 31 matters, whether you need a tax agent (納税管理人), what happens to payroll-deducted 住民税 on your final salary, when your income tax return (準確定申告) is due, and the 転出届 and pension lump-sum deadlines.";

export const DISCLAIMER_SHORT = "Educational checker, not tax or legal advice, not affiliated with the National Tax Agency, MIC, any city office, the Japan Pension Service or the Immigration Services Agency. Your city office and tax office decide; confirm with them before you leave.";

export const HONESTY =
  "Rules as of 2026-11-01 from the Local Tax Act (地方税法), Income Tax Act (所得税法), Act on General Rules for National Taxes, Basic Resident Registration Act, MIC resident-tax pages, NTA Tax Answers and the Japan Pension Service. It gives dates and obligations from what you enter, not yen amounts, and doesn't check tax treaties or your city's own procedure.";

export const SIBLING_TOOLS = [
  { href: "https://japan-disaster-prep.vercel.app", label: "Japan Disaster Prep Check" },
  { href: "https://japan-lost-item.vercel.app", label: "Japan Lost Item Check" },
  { href: "https://japan-pet-quarantine.vercel.app", label: "Japan Pet Quarantine Check" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-mynumber-card-check.vercel.app", label: "Japan My Number Card Check" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-driving-check.vercel.app", label: "Japan Driving Check" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan Postage Calculator" },
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-hsp-points.vercel.app", label: "Japan HSP Points Calculator" },
  { href: "https://japan-overseas-dependents.vercel.app", label: "Japan Overseas Dependents Check" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-tb-screening.vercel.app", label: "Japan TB Screening Check" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://japan-dual-pricing.vercel.app", label: "Japan Dual Pricing Check" },
  { href: "https://kyushu-travel-discount.vercel.app", label: "Kyushu Travel Discount" },
  { href: "https://house-rules-check.vercel.app", label: "House Rules Check" },
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-leaving-tax.vercel.app";
}
