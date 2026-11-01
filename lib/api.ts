import { InputError, type Endpoint, type Input } from "./agent-api";
import { DISCLAIMER, EMPLOYMENTS, NATIONALITIES, PAY_METHODS, PLANS, RULES_AS_OF, RuleInputError, checkLeaving, type Employment, type PayMethod, type Plan } from "./leaving";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-leaving-tax.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?departureDate=2027-03-20&employment=employee&payMethod=salary";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function s(v: unknown): string | null {
  const f = first(v);
  return f === undefined || f === null || String(f).trim() === "" ? null : String(f).trim();
}
/** Tri-state boolean: undefined when absent, so defaults can depend on other inputs. */
function tb(v: unknown, name: string): boolean | undefined {
  const f = first(v);
  if (typeof f === "boolean") return f;
  if (f === undefined || f === null || String(f).trim() === "") return undefined;
  const t = String(f).trim();
  if (/^(1|true|yes|y|on|はい)$/i.test(t)) return true;
  if (/^(0|false|no|n|off|いいえ)$/i.test(t)) return false;
  throw new InputError(`${name} must be true or false`);
}
function n(v: unknown, name: string): number | null {
  const f = s(v);
  if (f === null) return null;
  const x = Number(f);
  if (!Number.isFinite(x)) throw new InputError(`${name} must be a number`);
  return x;
}

const PLAN_ALIASES: Record<string, Plan> = {
  permanent: "leave", for_good: "leave", move: "leave", moving: "leave", relocate: "leave", over_1y: "leave", long_term: "leave", 転出: "leave", 国外転出: "leave", 帰国: "leave", 出国: "leave",
  temporary: "short", trip: "short", under_1y: "short", short_term: "short", 一時出国: "short", 一時帰国: "short",
};
const EMPLOYMENT_ALIASES: Record<string, Employment> = {
  salary: "employee", salaried: "employee", company: "employee", 会社員: "employee", 給与: "employee",
  freelance: "self_employed", freelancer: "self_employed", sole_proprietor: "self_employed", business: "self_employed", 自営業: "self_employed", 個人事業主: "self_employed", フリーランス: "self_employed",
  unemployed: "none", student: "none", no: "none", 無職: "none", 学生: "none",
};
const PAY_ALIASES: Record<string, PayMethod> = {
  payroll: "salary", employer: "salary", special: "salary", tokubetsu: "salary", 特別徴収: "salary", 給与天引き: "salary",
  self_pay: "self", bill: "self", ordinary: "self", normal: "self", futsu: "self", 普通徴収: "self",
  zero: "none", 非課税: "none",
};
const NAT_ALIASES: Record<string, (typeof NATIONALITIES)[number]> = { foreigner: "foreign", non_japanese: "foreign", 外国籍: "foreign", japan: "japanese", jp: "japanese", 日本国籍: "japanese", 日本人: "japanese" };

function pick<T extends string>(raw: string | null, allowed: readonly T[], aliases: Record<string, T>, name: string): T | undefined {
  if (!raw) return undefined;
  const k = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const v = (aliases[k] ?? aliases[raw] ?? k) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${name} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}

export function computeCheck(input: Input) {
  try {
    const departureDate = s(input.departureDate ?? input.departure ?? input.leaveDate ?? input.date);
    if (!departureDate) throw new InputError("Missing departureDate (YYYY-MM-DD, the day you leave Japan).");
    return checkLeaving({
      departureDate,
      plan: pick(s(input.plan ?? input.stay), PLANS, PLAN_ALIASES, "plan"),
      arrivalDate: s(input.arrivalDate ?? input.arrival ?? input.movedIn),
      employment: pick(s(input.employment ?? input.work ?? input.job), EMPLOYMENTS, EMPLOYMENT_ALIASES, "employment"),
      payMethod: pick(s(input.payMethod ?? input.residentTaxPayment ?? input.collection), PAY_METHODS, PAY_ALIASES, "payMethod"),
      jobEndDate: s(input.jobEndDate ?? input.lastWorkDate ?? input.retirementDate ?? input.退職日),
      incomeLastYear: tb(input.incomeLastYear, "incomeLastYear"),
      needsTaxReturn: tb(input.needsTaxReturn ?? input.taxReturn, "needsTaxReturn"),
      prevYearReturnPending: tb(input.prevYearReturnPending, "prevYearReturnPending"),
      incomeAfterLeaving: tb(input.incomeAfterLeaving ?? input.rentalIncome, "incomeAfterLeaving"),
      hasTaxAgent: tb(input.hasTaxAgent ?? input.taxAgent, "hasTaxAgent"),
      nationality: pick(s(input.nationality), NATIONALITIES, NAT_ALIASES, "nationality"),
      pensionMonths: n(input.pensionMonths, "pensionMonths"),
      securities100M: tb(input.securities100M ?? input.exitTax, "securities100M"),
      today: s(input.today),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanLeavingTaxCheck",
    summary: "Leaving Japan: do I still owe resident tax (住民税), do I need a tax agent (納税管理人), and what income-tax and move-out deadlines apply?",
    description: `Applies Japan's departure rules (as of ${RULES_AS_OF}): 住民税 is assessed on whoever is registered in a city on January 1 (地方税法 39 / 294 / 318), on the previous year's income, for the fiscal year June–May. Leave (with a 転出届) on or before December 31 → no 住民税 next fiscal year on this year's income; leave January 2 or later → that fiscal year is owed in full. Leaving January–May, the bill is issued in June after you go → tax agent (納税管理人, 地方税法 300) or certification. Payroll (特別徴収): job ending January 1 – April 30 → remaining installments deducted in one lump sum from the final pay (地方税法 321-5 ②); June–December → lump sum only on request. Income tax: year-end adjustment on the last salary before departure (NTA 1920); if a return is needed, 準確定申告 by departure without an agent, or by March 15 next year with one (所得税法 127, NTA 1926); previous year's return due by departure if leaving January 1 – March 15 (所得税法 126); agent form to the tax office (国税通則法 117); exit-tax flag for ¥100M+ securities (NTA 1478). Also: 転出届 window, pension Lump-sum Withdrawal claim deadline (2 years), residence card. Returns verdict (agent_needed | settle_before_departure | nothing_after_departure | still_resident), summary, residentTax {fiscalYears[{fiscalYear, incomeYear, status, why, howToPay}], nextFiscalYearAvoided, leaveByToAvoidNextFY, jan1Tip, lumpSumFromFinalPay, agentRequired, agentForm}, incomeTax {yearEndAdjustment, returnRequired, returnDeadline, previousYearReturnDeadline, agentRequired, agentForm, exitTax}, deadlines[{date, what, ja, mandatory, passed}], actions, warnings, pension, sources, disclaimer. No yen amounts.`,
    params: [
      { name: "departureDate", type: "string", required: true, description: "YYYY-MM-DD the day you leave Japan (aliases: departure, leaveDate)." },
      { name: "plan", type: "string", enum: PLANS, default: "leave", description: "leave (moving abroad for a year or more, files a 転出届) | short (trip under a year, keeps the address). Aliases: permanent, for_good, temporary, 一時出国…" },
      { name: "arrivalDate", type: "string", description: "Optional YYYY-MM-DD you first registered an address in Japan (default: before January 1 of the departure year)." },
      { name: "employment", type: "string", enum: EMPLOYMENTS, default: "employee", description: "employee | self_employed | none. Aliases: 会社員, freelance, 個人事業主, student…" },
      { name: "payMethod", type: "string", enum: PAY_METHODS, description: "How you pay 住民税: salary (payroll, 特別徴収) | self (bills, 普通徴収) | none (no tax). Default: salary for employees, self for self-employed, none otherwise." },
      { name: "jobEndDate", type: "string", description: "Optional YYYY-MM-DD your job ends (default: departureDate). Decides the lump-sum rule." },
      { name: "incomeLastYear", type: "boolean", default: true, description: "Had taxable income last calendar year (false = no 住民税 bill expected)." },
      { name: "needsTaxReturn", type: "boolean", description: "You need an income tax return for this year (side income over ¥200k, salary over ¥20M, self-employed, two employers…). Default: true for self_employed, false otherwise." },
      { name: "prevYearReturnPending", type: "boolean", default: false, description: "Leaving January 1 – March 15 with last year's return not yet filed." },
      { name: "incomeAfterLeaving", type: "boolean", default: false, description: "Japan-source income after leaving (rent, property sale…) → tax agent needed." },
      { name: "hasTaxAgent", type: "boolean", default: false, description: "You will appoint a tax agent (納税管理人)." },
      { name: "nationality", type: "string", enum: NATIONALITIES, default: "foreign", description: "foreign | japanese (pension lump sum and residence card only apply to foreign nationals)." },
      { name: "pensionMonths", type: "number", description: "Optional months of Japanese pension contributions (6–119 → lump-sum claim deadline)." },
      { name: "securities100M", type: "boolean", default: false, description: "Holding ¥100M+ in securities etc. → exit-tax (国外転出時課税) flag." },
      { name: "today", type: "string", description: "Override today's date (default: today in Japan)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Leaving Tax Check",
  nameForModel: "japan_leaving_tax",
  descriptionForHuman: "Leaving Japan? Resident tax (住民税) owed, tax agent (納税管理人) and the deadlines.",
  descriptionForModel:
    "Use when someone is leaving Japan (moving abroad, going home, ending a job or a JET / work contract) and asks whether they still owe resident tax (住民税, juminzei), when it is billed, whether leaving before January 1 avoids it, whether they need a tax agent (納税管理人), what happens to payroll-deducted resident tax on the final salary, whether they must file an income tax return (準確定申告) before leaving, or when to file the moving-out notice (転出届) and claim the pension lump sum. Computes from the Local Tax Act, Income Tax Act and NTA / MIC rules instead of guessing; relay the disclaimer (educational; the city and tax office decide; no yen amounts).",
  logo: "/icon.svg",
};
