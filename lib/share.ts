import { EMPLOYMENTS, NATIONALITIES, PAY_METHODS, PLANS, checkLeaving, type Employment, type LeavingInput, type PayMethod, type Plan } from "./leaving";

export { PUBLIC_URL } from "./api";

type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, k: string): string | null {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  const f = Array.isArray(v) ? v[0] : v;
  return f === undefined || f === null || f === "" ? null : String(f);
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;
function date(p: Params, k: string): string | null {
  const v = one(p, k);
  return v && ISO.test(v) ? v : null;
}
function flag(p: Params, k: string): boolean {
  return one(p, k) === "1";
}
function oneOf<T extends string>(p: Params, k: string, allowed: readonly T[], fallback: T): T {
  const v = one(p, k);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export type Shared = {
  departureDate: string;
  plan: Plan;
  employment: Employment;
  payMethod: PayMethod;
  arrivalDate: string | null;
  jobEndDate: string | null;
  needsTaxReturn: boolean;
  hasTaxAgent: boolean;
  incomeAfterLeaving: boolean;
  nationality: (typeof NATIONALITIES)[number];
  today: string | null;
};

const defaultPay = (e: Employment): PayMethod => (e === "employee" ? "salary" : e === "self_employed" ? "self" : "none");

export const EXAMPLE_SHARED: Shared = { departureDate: "2027-03-20", plan: "leave", employment: "employee", payMethod: "salary", arrivalDate: null, jobEndDate: null, needsTaxReturn: false, hasTaxAgent: false, incomeAfterLeaving: false, nationality: "foreign", today: "2026-11-01" };
export const EXAMPLE_DEC: Shared = { ...EXAMPLE_SHARED, departureDate: "2026-12-20" };
export const EXAMPLE_FREELANCE: Shared = { ...EXAMPLE_SHARED, departureDate: "2027-01-15", employment: "self_employed", payMethod: "self", needsTaxReturn: true };
export const EXAMPLES = [EXAMPLE_SHARED, EXAMPLE_DEC, EXAMPLE_FREELANCE];

export function parseShared(p: Params): Shared | null {
  const l = date(p, "l");
  if (!l) return null;
  const employment = oneOf(p, "e", EMPLOYMENTS, "employee");
  return {
    departureDate: l,
    plan: oneOf(p, "p", PLANS, "leave"),
    employment,
    payMethod: oneOf(p, "m", PAY_METHODS, defaultPay(employment)),
    arrivalDate: date(p, "a"),
    jobEndDate: date(p, "j"),
    needsTaxReturn: flag(p, "r"),
    hasTaxAgent: flag(p, "g"),
    incomeAfterLeaving: flag(p, "i"),
    nationality: oneOf(p, "n", NATIONALITIES, "foreign"),
    today: date(p, "t"),
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("l", s.departureDate);
  if (s.plan !== "leave") q.set("p", s.plan);
  if (s.employment !== "employee") q.set("e", s.employment);
  if (s.payMethod !== defaultPay(s.employment)) q.set("m", s.payMethod);
  if (s.arrivalDate) q.set("a", s.arrivalDate);
  if (s.jobEndDate) q.set("j", s.jobEndDate);
  if (s.needsTaxReturn) q.set("r", "1");
  if (s.hasTaxAgent) q.set("g", "1");
  if (s.incomeAfterLeaving) q.set("i", "1");
  if (s.nationality !== "foreign") q.set("n", s.nationality);
  if (s.today) q.set("t", s.today);
  return q.toString();
}

export function toCheckInput(s: Shared): LeavingInput {
  return { ...s };
}
export function safeCheck(s: Shared) {
  try {
    return checkLeaving(toCheckInput(s));
  } catch {
    return null;
  }
}
export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return EXAMPLES.some((e) => resultPath(e) === resultPath(s));
}
