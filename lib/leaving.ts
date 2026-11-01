// Japan Leaving Tax Check: resident tax (住民税), income tax and move-out deadlines when you leave Japan.
// Educational reading of 地方税法 (arts 39, 294, 300, 318, 321-5), 所得税法 (arts 126, 127, 190), 国税通則法 117,
// 住民基本台帳法 24, the MIC resident-tax pages, NTA Tax Answers 1920 / 1923 / 1926 / 1478 and the Japan Pension Service.

export const RULES_AS_OF = "2026-11-01";

export const SOURCES = [
  "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/individual-inhabitant-tax.html",
  "https://www.soumu.go.jp/main_content/001029062.pdf",
  "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1920.htm",
  "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1926.htm",
  "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1923.htm",
  "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1478.htm",
  "https://www.nta.go.jp/about/organization/tokyo/topics/kokugai/index.htm",
  "https://www.nenkin.go.jp/international/english/japanese-system/benefit/payment.html",
  "https://laws.e-gov.go.jp/law/325AC0000000226",
  "https://laws.e-gov.go.jp/law/340AC0000000033",
  "https://laws.e-gov.go.jp/law/337AC0000000066",
  "https://laws.e-gov.go.jp/law/342AC0000000081",
  "https://www.city.higashiosaka.lg.jp/0000043347.html",
  "https://www.city.urayasu.lg.jp/todokede/zeikin/1033128/1033484.html",
  "https://www.city.ichinomiya.aichi.jp/faq/1005662/1005979/1051266.html",
] as const;

export const DISCLAIMER =
  "Educational estimate of dates and rules, not tax or legal advice. Not affiliated with the National Tax Agency, the Ministry of Internal Affairs and Communications, any city or ward office, the Japan Pension Service or the Immigration Services Agency. Your city office and tax office decide; confirm with them (or a licensed tax accountant, 税理士) before you leave.";

export const PLANS = ["leave", "short"] as const;
export const EMPLOYMENTS = ["employee", "self_employed", "none"] as const;
export const PAY_METHODS = ["salary", "self", "none"] as const;
export const NATIONALITIES = ["foreign", "japanese"] as const;
export type Plan = (typeof PLANS)[number];
export type Employment = (typeof EMPLOYMENTS)[number];
export type PayMethod = (typeof PAY_METHODS)[number];
export type Verdict = "agent_needed" | "settle_before_departure" | "nothing_after_departure" | "still_resident";
export type FyStatus = "owed" | "not_owed" | "check_with_city";

export class RuleInputError extends Error {}

export type LeavingInput = {
  departureDate: string;
  plan?: Plan;
  arrivalDate?: string | null;
  employment?: Employment;
  payMethod?: PayMethod;
  jobEndDate?: string | null;
  incomeLastYear?: boolean;
  needsTaxReturn?: boolean;
  prevYearReturnPending?: boolean;
  incomeAfterLeaving?: boolean;
  hasTaxAgent?: boolean;
  nationality?: (typeof NATIONALITIES)[number];
  pensionMonths?: number | null;
  securities100M?: boolean;
  today?: string | null;
};

export type FiscalYear = {
  fiscalYear: number;
  incomeYear: number;
  status: FyStatus;
  why: string;
  howToPay: string | null;
};

export type Deadline = { date: string; what: string; ja: string; mandatory: boolean; passed: boolean };

export type LeavingResult = {
  verdict: Verdict;
  summary: string;
  departureDate: string;
  plan: Plan;
  employment: Employment;
  payMethod: PayMethod;
  residentTax: {
    fiscalYears: FiscalYear[];
    nextFiscalYearAvoided: boolean;
    leaveByToAvoidNextFY: string | null;
    jan1Tip: string | null;
    lumpSumFromFinalPay: "mandatory" | "on_request" | "not_applicable";
    agentRequired: boolean;
    agentForm: string | null;
  };
  incomeTax: {
    yearEndAdjustment: boolean;
    returnRequired: boolean;
    returnDeadline: string | null;
    previousYearReturnDeadline: string | null;
    agentRequired: boolean;
    agentForm: string | null;
    exitTax: boolean;
  };
  deadlines: Deadline[];
  actions: string[];
  warnings: string[];
  pension: { lumpSumClaimBy: string | null; note: string } | null;
  rulesAsOf: string;
  sources: readonly string[];
  disclaimer: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(s: string, n: number): string {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addYears(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  // 2 years from Feb 29 → Feb 28
  const last = new Date(Date.UTC(y + n, m, 0)).getUTCDate();
  return `${y + n}-${String(m).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function todayJst(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** Tax filing deadline falling on a weekend moves to the next Monday (国税通則法 10②). Public holidays are not shifted here. */
export function nextWeekday(s: string): string {
  const dow = new Date(`${s}T00:00:00Z`).getUTCDay();
  return dow === 6 ? addDays(s, 2) : dow === 0 ? addDays(s, 1) : s;
}

const md = (s: string) => s.slice(5);
const yr = (s: string) => Number(s.slice(0, 4));

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  residentTax: {
    assessmentDate: "January 1 (賦課期日, 地方税法 39 / 318). You owe the fiscal year's 住民税 (prefectural + municipal, plus the ¥1,000 森林環境税) to the city where you are registered on January 1, on the previous calendar year's income.",
    leaveByDec31: "Leave (and file the 転出届) on or before December 31 → no 住民税 for the next fiscal year on this year's income. Leave on January 2 or later → you still owe the full fiscal year, even though you are gone (MIC).",
    fiscalYear: "Fiscal year N runs June N – May N+1. Payroll deduction (特別徴収) takes 12 monthly amounts June–May; self-pay (普通徴収) bills arrive in June with 4 installments (June, August, October, January).",
    jobEndsJanToApr: "Job ends January 1 – April 30: the employer must deduct all remaining payroll installments (to May) in one lump sum from the final salary or retirement pay if it covers them (地方税法 321-5 ②; MIC says January–May).",
    jobEndsJunToDec: "Job ends June 1 – December 31: lump-sum deduction only if you ask; otherwise the rest switches to self-pay bills.",
    taxAgent: "If you cannot pay before leaving, appoint a tax agent (納税管理人) and notify the city (納税管理人申告書 / 届出書) before you go, unless the city certifies you don't need one (地方税法 300).",
    unpaid: "Unpaid resident tax can be a problem if you later apply for a residence-period extension or change in Japan (MIC).",
  },
  incomeTax: {
    yearEndAdjustment: "An employee who becomes a non-resident mid-year gets the year-end adjustment (年末調整) on the last salary paid before departure, if annual salary ≤ ¥20 million (NTA 1920, 所得税法 190).",
    departureReturn: "If you need a tax return (side income, salary over ¥20M, self-employed, rent, etc.) and have no tax agent, file the 準確定申告 by the day you leave (所得税法 127 ①, NTA 1926). With a tax agent notified to the tax office, file the normal return February 16 – March 15 of the next year.",
    previousYear: "Leaving January 1 – March 15 with last year's return still due: file it by the departure date unless you appoint a tax agent (所得税法 126).",
    agent: "Tax agent for national taxes: 「所得税・消費税の納税管理人の届出書」 to the tax office for your address, before departure (国税通則法 117, NTA 1923). A person or a company can be the agent.",
    exitTax: "Holding ¥100 million or more in securities etc. when you leave can trigger the exit tax (国外転出時課税, NTA 1478) if you were resident 5+ of the last 10 years.",
    shortStay: "Leaving for less than a year (planned): you stay a tax resident; no departure year-end adjustment.",
  },
  moveOut: {
    tenshutsu: "File the moving-out notice (転出届, 国外転出) at the city office, in practice from about 14 days before departure (住民基本台帳法 24). Trips under a year normally don't need one.",
    pension: "Non-Japanese with 6+ months of National / Employees' Pension contributions and under 10 years of coverage can claim the Lump-sum Withdrawal Payment within 2 years of leaving (Japan Pension Service).",
    residenceCard: "Mid- to long-term residents leaving for good (not on a (deemed) re-entry permit) hand in the residence card at the departure airport.",
  },
  notCovered: [
    "Yen amounts (this tool gives dates and obligations, not a tax estimate)",
    "Tax-treaty exemptions (some students, trainees, teachers and researchers)",
    "Consumption tax, inheritance / gift tax, local enterprise tax",
    "Corporate officers' director fees and non-resident withholding (20.42%) after departure",
    "Your city's own procedure details and forms",
  ],
} as const;

function fy(fiscalYear: number, status: FyStatus, why: string, howToPay: string | null): FiscalYear {
  return { fiscalYear, incomeYear: fiscalYear - 1, status, why, howToPay };
}

export function checkLeaving(input: LeavingInput): LeavingResult {
  const D = input.departureDate;
  if (!D || !validDate(D)) throw new RuleInputError("departureDate is required as YYYY-MM-DD (the day you leave Japan).");
  const today = input.today ?? todayJst();
  if (!validDate(today)) throw new RuleInputError("today must be YYYY-MM-DD.");
  const arrival = input.arrivalDate ?? null;
  if (arrival !== null && !validDate(arrival)) throw new RuleInputError("arrivalDate must be YYYY-MM-DD (when you registered an address in Japan).");
  if (arrival && arrival > D) throw new RuleInputError("arrivalDate is after departureDate.");
  const jobEnd = input.jobEndDate ?? null;
  if (jobEnd !== null && !validDate(jobEnd)) throw new RuleInputError("jobEndDate must be YYYY-MM-DD.");
  if (input.pensionMonths != null && (!Number.isFinite(input.pensionMonths) || input.pensionMonths < 0)) throw new RuleInputError("pensionMonths must be a number ≥ 0.");

  const plan: Plan = input.plan ?? "leave";
  const employment: Employment = input.employment ?? "employee";
  const payMethod: PayMethod = input.payMethod ?? (employment === "employee" ? "salary" : employment === "self_employed" ? "self" : "none");
  const incomeLastYear = input.incomeLastYear ?? true;
  const agent = input.hasTaxAgent ?? false;
  const foreign = (input.nationality ?? "foreign") === "foreign";
  const Y = yr(D);
  const m = Number(D.slice(5, 7));
  const passed = (d: string) => d < today;

  const actions: string[] = [];
  const warnings: string[] = [];
  const deadlines: Deadline[] = [];
  const dl = (date: string, what: string, ja: string, mandatory = true) => deadlines.push({ date, what, ja, mandatory, passed: passed(date) });

  // ---------- Short trip: still resident ----------
  if (plan === "short") {
    const nextJan1 = `${Y + 1}-01-01`;
    const res: LeavingResult = {
      verdict: "still_resident",
      summary: `Leaving for under a year and keeping your address, you stay a Japan resident: 住民税 continues as normal (including FY${Y + 1} if you are registered on ${nextJan1}) and income tax is settled the normal way.`,
      departureDate: D,
      plan,
      employment,
      payMethod,
      residentTax: {
        fiscalYears: [fy(Y + 1, "owed", `Still registered in Japan on ${nextJan1} (no 転出届 for a trip under a year).`, payMethod === "salary" ? "Payroll deduction continues while you are employed; otherwise self-pay bills (pay from abroad or via someone in Japan)." : "Self-pay bills in June: pay by bank transfer / app or have someone in Japan pay.")],
        nextFiscalYearAvoided: false,
        leaveByToAvoidNextFY: null,
        jan1Tip: null,
        lumpSumFromFinalPay: "not_applicable",
        agentRequired: false,
        agentForm: null,
      },
      incomeTax: { yearEndAdjustment: false, returnRequired: input.needsTaxReturn ?? employment === "self_employed", returnDeadline: input.needsTaxReturn ?? employment === "self_employed" ? nextWeekday(`${Y + 1}-03-15`) : null, previousYearReturnDeadline: null, agentRequired: false, agentForm: null, exitTax: false },
      deadlines: [],
      actions: [
        "Make sure bills reach you: tell the city office and keep a forwarding address or someone who can receive mail.",
        "If you can't pay bills while abroad, you can still appoint a tax agent (納税管理人) voluntarily.",
        foreign ? "Leave with a (deemed) re-entry permit: tick the re-entry box on the ED card. Check your dates with Japan Re-entry Check." : "Keep your residence registration and My Number card.",
      ],
      warnings: ["If the trip turns into a year or more, you become a non-resident: file a 転出届 and settle taxes as for a permanent move."],
      pension: null,
      rulesAsOf: RULES_AS_OF,
      sources: SOURCES,
      disclaimer: DISCLAIMER,
    };
    return res;
  }

  // ---------- Resident tax ----------
  const registeredJan1 = (year: number) => !arrival || arrival <= `${year}-01-01`;
  const fyList: FiscalYear[] = [];
  let agentRT = false;
  let lump: LeavingResult["residentTax"]["lumpSumFromFinalPay"] = "not_applicable";
  const end = jobEnd ?? D;
  const endMd = md(end);

  // Previous fiscal year (FY Y-1, June Y-1 – May Y) still being collected when leaving January–May.
  if (m <= 5 && registeredJan1(Y - 1) && incomeLastYear && payMethod !== "none") {
    fyList.push(
      fy(
        Y - 1,
        "owed",
        `Fiscal year ${Y - 1} (June ${Y - 1} – May ${Y}) is still being collected when you leave.`,
        payMethod === "salary"
          ? endMd <= "04-30"
            ? `Your employer must deduct the remaining installments (to May ${Y}) in one lump sum from your final salary or retirement pay (地方税法 321-5 ②).`
            : `The last (May ${Y}) installment comes out of your May salary.`
          : `Pay any unpaid installment (the 4th is due at the end of January ${Y}) before you leave.`,
      ),
    );
    if (payMethod === "salary") lump = endMd <= "04-30" ? "mandatory" : lump;
  }

  // Current fiscal year (FY Y on Y-1 income): owed if registered on Jan 1 of the departure year.
  const jan1Departure = md(D) === "01-01";
  if (!registeredJan1(Y)) {
    fyList.push(fy(Y, "not_owed", `You registered in Japan after January 1, ${Y}, so no city assessed you for fiscal year ${Y}.`, null));
  } else if (!incomeLastYear || payMethod === "none") {
    fyList.push(fy(Y, "not_owed", `No taxable income in ${Y - 1} (or below your city's non-taxable limit): check that the city has your 住民税申告 so it shows ¥0.`, null));
  } else if (m <= 5) {
    agentRT = true;
    fyList.push(
      fy(
        Y,
        jan1Departure ? "check_with_city" : "owed",
        jan1Departure
          ? `Leaving on January 1 is the borderline case: whether you count as registered on the assessment date depends on your 転出 date. Ask the city; this tool assumes you owe fiscal year ${Y}.`
          : `You are registered on January 1, ${Y}, so you owe fiscal year ${Y} on your ${Y - 1} income even though you leave in ${D.slice(0, 7)} (MIC: leaving on January 2 or later doesn't change this).`,
        `The bill (納税通知書) is only issued around mid-June ${Y}, after you leave, so appoint a tax agent (納税管理人) to receive and pay it, or ask the city whether you can pay in advance or be certified as not needing one (地方税法 300).`,
      ),
    );
  } else {
    fyList.push(
      fy(
        Y,
        "owed",
        `You were registered on January 1, ${Y}, so fiscal year ${Y} (June ${Y} – May ${Y + 1}) on your ${Y - 1} income is owed in full.`,
        payMethod === "salary"
          ? `Ask your employer to deduct the remaining installments (to May ${Y + 1}) in one lump sum from your final salary (only on request June–December, 地方税法 321-5 ②); otherwise the rest becomes self-pay bills: pay them at the city office before you leave or appoint a tax agent.`
          : `Pay the unpaid installments (June, August, October, January ${Y + 1}) in one go at the city office before you leave, or appoint a tax agent to pay them.`,
      ),
    );
    if (payMethod === "salary") lump = "on_request";
  }

  // Next fiscal year (FY Y+1 on Y income): avoided because you won't be registered on Jan 1 Y+1.
  fyList.push(fy(Y + 1, "not_owed", `Leaving on ${D} (on or before December 31, ${Y}) with a 転出届, you have no Japan address on January 1, ${Y + 1}: no fiscal year ${Y + 1} 住民税 on your ${Y} income.`, null));

  let jan1Tip: string | null = null;
  if (m === 1 && registeredJan1(Y) && incomeLastYear && payMethod !== "none" && today <= `${Y - 1}-12-31`) {
    jan1Tip = `Leaving on ${D} costs a full year of 住民税 (fiscal year ${Y}). Moving the departure and 転出届 to December 31, ${Y - 1} or earlier would avoid it.`;
  }

  // ---------- Income tax ----------
  const salaryEarner = employment === "employee";
  const needsReturn = input.needsTaxReturn ?? employment === "self_employed";
  const after = input.incomeAfterLeaving ?? false;
  const yea = salaryEarner && !needsReturn && end >= `${Y}-01-01` && end >= addDays(D, -31);
  const nextMar15 = nextWeekday(`${Y + 1}-03-15`);
  const returnDeadline = needsReturn ? (agent ? nextMar15 : D) : null;
  const prevPending = (input.prevYearReturnPending ?? false) && md(D) <= "03-15";
  const prevDeadline = prevPending ? (agent ? nextWeekday(`${Y}-03-15`) : D) : null;
  const exitTax = input.securities100M ?? false;
  const agentIT = after || (agent && (needsReturn || prevPending || exitTax));

  // ---------- Deadlines ----------
  dl(addDays(D, -14), "Moving-out notice (転出届) can usually be filed from about 14 days before departure, until the day you leave", "転出届（国外転出）の受付開始目安（出国の約14日前から）", false);
  dl(D, "Last day to file the 転出届 at your city office (before you leave)", "転出届の提出（出国日まで）");
  if (agentRT) dl(D, "Notify the city of your tax agent for 住民税 (納税管理人申告書), or settle with the city", "住民税の納税管理人申告書の提出（出国前）");
  else if (fyList.some((f) => f.fiscalYear === Y && f.status === "owed")) dl(D, `Pay the rest of fiscal year ${Y} 住民税 (or appoint a tax agent) before leaving`, `${Y}年度住民税の残額を出国前に納付（または納税管理人）`);
  if (lump === "mandatory") dl(end, "Final salary: remaining payroll 住民税 deducted in one lump sum (mandatory)", "最終給与で住民税残額を一括徴収（義務）");
  if (needsReturn && !agent) dl(D, `File your ${Y} income tax return (準確定申告) and pay, by departure`, `${Y}年分の準確定申告（出国の時まで）`);
  if (needsReturn && agent) dl(nextMar15, `Your tax agent files your ${Y} income tax return (Feb 16 – Mar 15)`, `納税管理人による${Y}年分確定申告（翌年3月15日まで）`);
  if (prevDeadline) dl(prevDeadline, `File your ${Y - 1} income tax return${agent ? " (via your tax agent)" : " before you leave"}`, `${Y - 1}年分確定申告${agent ? "（納税管理人）" : "（出国の時まで）"}`);
  if (agentIT || (agent && !agentRT)) dl(D, "Notify the tax office of your tax agent (所得税・消費税の納税管理人の届出書)", "所得税・消費税の納税管理人の届出書（出国前）");
  if (exitTax) dl(agent ? nextMar15 : D, "Exit tax (国外転出時課税) return for securities ≥ ¥100M", "国外転出時課税の申告");
  if (m <= 5 && agentRT) dl(`${Y}-06-15`, `About now the city sends the fiscal year ${Y} bill to your tax agent`, `${Y}年度住民税の納税通知書（6月中旬頃、納税管理人宛）`, false);

  let pension: LeavingResult["pension"] = null;
  if (foreign) {
    const pm = input.pensionMonths;
    if (pm != null && pm >= 120) pension = { lumpSumClaimBy: null, note: "10+ years of coverage: you qualify for a Japanese old-age pension instead of the lump sum. Ask the Japan Pension Service before leaving." };
    else if (pm != null && pm < 6) pension = { lumpSumClaimBy: null, note: "Under 6 months of contributions: no Lump-sum Withdrawal Payment." };
    else {
      const by = addYears(D, 2);
      pension = { lumpSumClaimBy: by, note: "Lump-sum Withdrawal Payment: claim after you leave (no longer covered, address out of Japan), within 2 years. The amount depends on your months and salary; check the Japan Pension Service." };
      dl(by, "Claim the pension Lump-sum Withdrawal Payment (within 2 years of leaving)", "脱退一時金の請求期限（出国後2年）");
    }
  }
  deadlines.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // ---------- Actions / warnings ----------
  const agentRequired = agentRT || agentIT;
  if (agentRT && !agent) actions.push(`Choose a tax agent (納税管理人) in Japan: a friend, colleague, your company or a 税理士. Give the city the 納税管理人申告書 before ${D}.`);
  if (agentRT && agent) actions.push(`Give the city your 納税管理人申告書 before ${D} so the fiscal year ${Y} bill goes to your agent.`);
  if (lump === "mandatory") actions.push("Ask payroll to confirm the lump-sum 住民税 deduction on your final pay.");
  if (lump === "on_request") actions.push("Ask payroll for the lump-sum 住民税 deduction (一括徴収) from your final salary so nothing is left after you go.");
  if (yea) actions.push("Your employer does the year-end adjustment (年末調整) on the last salary before you leave; give them your deduction forms early.");
  if (salaryEarner && !yea && !needsReturn) actions.push("If your job ends well before you leave, the employer usually does no year-end adjustment: a 準確定申告 can get you a refund of over-withheld tax (file by departure or via a tax agent).");
  if (needsReturn && !agent) actions.push(`File the 準確定申告 for ${Y} (income from January 1 to ${D}) at the tax office and pay before you fly. e-Tax works.`);
  if (needsReturn && agent) actions.push(`Notify the tax office of your tax agent before ${D}; the agent files your ${Y} return by ${nextMar15}.`);
  if (after) actions.push("Income from Japan after you leave (rent, sale of property, etc.): a tax agent for national taxes is needed; non-resident rules apply.");
  actions.push(`File the 転出届 (国外転出) at the city office between about ${addDays(D, -14)} and ${D}; return your National Health Insurance card if you have one.`);
  if (foreign) actions.push("Leaving for good: hand in your residence card at the airport. Keeping status with a (deemed) re-entry permit? Check Japan Re-entry Check first.");
  actions.push("My Number card: you can keep using it abroad if you apply for it when filing the 転出届 (since 2024-05-27); otherwise it stops working.");

  if (exitTax) warnings.push("Exit tax (国外転出時課税): with ¥100M+ in securities and 5 of the last 10 years resident, unrealised gains are taxed on departure. Talk to a 税理士.");
  if (fyList.some((f) => f.status === "owed")) warnings.push("Unpaid 住民税 can be collected later and can be a problem if you return to Japan and renew or change your status.");
  if (input.needsTaxReturn === undefined && employment === "employee") warnings.push("Assumed salary-only income (no tax return). Side income over ¥200k, salary over ¥20M or two employers usually means a return: set needsTaxReturn=true.");
  if (!arrival) warnings.push(`Assumed you had a Japanese address on January 1, ${Y}. If you arrived later, set arrivalDate.`);
  warnings.push("Students, trainees and teachers from treaty countries may be exempt; this tool doesn't check tax treaties.");

  // ---------- Verdict ----------
  const anyOwed = fyList.some((f) => f.status !== "not_owed");
  let verdict: Verdict;
  let summary: string;
  if (agentRequired) {
    verdict = "agent_needed";
    summary = agentRT
      ? `Leaving on ${D} you still owe fiscal year ${Y} 住民税 (billed in June ${Y}, after you go): appoint a tax agent (納税管理人) before you leave.`
      : `You will still have Japan tax to file after leaving on ${D}: notify a tax agent (納税管理人) to the tax office before you go.`;
  } else if (anyOwed || needsReturn || prevPending) {
    verdict = "settle_before_departure";
    summary = `Settle it before ${D}: ${[fyList.some((f) => f.fiscalYear === Y && f.status === "owed") ? `the rest of fiscal year ${Y} 住民税` : fyList.some((f) => f.status === "owed") ? `the last fiscal year ${Y - 1} 住民税 installments` : null, needsReturn ? "your 準確定申告" : null, prevPending ? `your ${Y - 1} tax return` : null].filter(Boolean).join(", ")}. No 住民税 for fiscal year ${Y + 1}.`;
  } else {
    verdict = "nothing_after_departure";
    summary = `Nothing should be owed after you leave on ${D}: no 住民税 for fiscal year ${Y + 1}${yea ? ", and your employer settles income tax with the year-end adjustment" : ""}. Still file the 転出届.`;
  }

  return {
    verdict,
    summary,
    departureDate: D,
    plan,
    employment,
    payMethod,
    residentTax: {
      fiscalYears: fyList,
      nextFiscalYearAvoided: true,
      leaveByToAvoidNextFY: `${Y}-12-31`,
      jan1Tip,
      lumpSumFromFinalPay: lump,
      agentRequired: agentRT,
      agentForm: agentRT ? "納税管理人申告書（届出書） to the city / ward office tax section" : null,
    },
    incomeTax: {
      yearEndAdjustment: yea,
      returnRequired: needsReturn,
      returnDeadline,
      previousYearReturnDeadline: prevDeadline,
      agentRequired: agentIT,
      agentForm: agentIT || agent ? "所得税・消費税の納税管理人の届出書 to the tax office (国税通則法 117)" : null,
      exitTax,
    },
    deadlines,
    actions,
    warnings,
    pension,
    rulesAsOf: RULES_AS_OF,
    sources: SOURCES,
    disclaimer: DISCLAIMER,
  };
}
