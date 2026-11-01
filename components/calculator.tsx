"use client";

import { useState, useSyncExternalStore } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import type { Employment, PayMethod, Plan } from "@/lib/leaving";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath, safeCheck, type Shared } from "@/lib/share";
import { VERDICT_LABEL, VERDICT_STYLE } from "@/lib/verdict";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";
const FY_STYLE: Record<string, string> = { owed: "text-amber-200", not_owed: "text-teal-200", check_with_city: "text-amber-200" };
const FY_LABEL: Record<string, string> = { owed: "Owed", not_owed: "Not owed", check_with_city: "Ask the city" };

const noopSubscribe = () => () => {};

function DateField({ label, value, set, testid }: { label: string; value: string; set: (v: string) => void; testid?: string }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input data-testid={testid} type="date" className={field} value={value} onChange={(e) => set(e.target.value)} />
    </label>
  );
}

function Check({ label, value, set, testid }: { label: string; value: boolean; set: (v: boolean) => void; testid?: string }) {
  return (
    <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
      <input data-testid={testid} type="checkbox" className="mt-1" checked={value} onChange={(e) => set(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [departureDate, setDep] = useState(start.departureDate);
  const [plan, setPlan] = useState<Plan>(start.plan);
  const [employment, setEmp] = useState<Employment>(start.employment);
  const [payMethod, setPay] = useState<PayMethod>(start.payMethod);
  const [arrivalDate, setArr] = useState(start.arrivalDate ?? "");
  const [jobEndDate, setJob] = useState(start.jobEndDate ?? "");
  const [needsTaxReturn, setRet] = useState(start.needsTaxReturn);
  const [hasTaxAgent, setAgent] = useState(start.hasTaxAgent);
  const [incomeAfterLeaving, setAfter] = useState(start.incomeAfterLeaving);
  const [japanese, setJp] = useState(start.nationality === "japanese");
  // Home example is pinned to a fixed date for the prerender; once hydrated a visitor's check uses their real today.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [todayEdit, setToday] = useState<string | null>(null);
  const today = todayEdit ?? (initial || !hydrated ? (start.today ?? "") : "");

  const shared: Shared = {
    departureDate,
    plan,
    employment,
    payMethod,
    arrivalDate: arrivalDate || null,
    jobEndDate: employment === "employee" && jobEndDate ? jobEndDate : null,
    needsTaxReturn: employment === "self_employed" ? true : needsTaxReturn,
    hasTaxAgent,
    incomeAfterLeaving,
    nationality: japanese ? "japanese" : "foreign",
    today: today || null,
  };
  const r = departureDate ? safeCheck(shared) : null;
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;

  const setEmployment = (e: Employment) => {
    setEmp(e);
    setPay(e === "employee" ? "salary" : e === "self_employed" ? "self" : "none");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your move</p>
        <DateField label="Leaving Japan on (出国日)" value={departureDate} set={setDep} testid="departure" />
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">How long</span>
          <select data-testid="plan" className={field} value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
            <option value="leave">Moving abroad, a year or more (転出届)</option>
            <option value="short">Trip under a year, keeping my address</option>
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Work</span>
          <select data-testid="employment" className={field} value={employment} onChange={(e) => setEmployment(e.target.value as Employment)}>
            <option value="employee">Employee (会社員, JET, etc.)</option>
            <option value="self_employed">Self-employed / freelance (個人事業主)</option>
            <option value="none">No job (student, spouse, etc.)</option>
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">How you pay 住民税 (resident tax)</span>
          <select data-testid="pay" className={field} value={payMethod} onChange={(e) => setPay(e.target.value as PayMethod)}>
            <option value="salary">Taken from my salary (特別徴収)</option>
            <option value="self">Bills I pay myself (普通徴収)</option>
            <option value="none">I don&apos;t pay any (no income last year)</option>
          </select>
        </label>
        {employment === "employee" ? <DateField label="Job ends on (optional, default: departure)" value={jobEndDate} set={setJob} testid="jobend" /> : null}
        <DateField label="First registered an address in Japan (optional)" value={arrivalDate} set={setArr} testid="arrival" />
        {employment === "employee" ? <Check label="I need a tax return this year (side income over ¥200k, salary over ¥20M, two jobs…)" value={needsTaxReturn} set={setRet} testid="return" /> : null}
        <Check label="Japan income after I leave (rent, selling property…)" value={incomeAfterLeaving} set={setAfter} testid="after" />
        <Check label="I will appoint a tax agent (納税管理人)" value={hasTaxAgent} set={setAgent} testid="agent" />
        <Check label="Japanese national" value={japanese} set={setJp} />
        <label className="mt-4 block">
          <span className="text-sm font-medium text-muted">Check as of (optional, default today)</span>
          <input type="date" className={field} value={today} onChange={(e) => setToday(e.target.value)} />
        </label>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60">
        <div className="p-5 sm:p-7" data-testid="result">
          {r ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{VERDICT_LABEL[r.verdict]} · leaving {r.departureDate}</p>
              <p className={`mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl ${VERDICT_STYLE[r.verdict]}`}>{r.summary}</p>
              <h3 className="mt-6 text-sm font-semibold text-foreground">Resident tax (住民税) by fiscal year</h3>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
                {r.residentTax.fiscalYears.map((f) => (
                  <li key={f.fiscalYear} className="rounded-2xl border border-line p-3">
                    <p className="text-foreground">
                      <span className={`mr-2 font-mono ${FY_STYLE[f.status]}`}>{FY_LABEL[f.status]}</span>FY{f.fiscalYear} <span className="text-xs text-muted">(on {f.incomeYear} income)</span>
                    </p>
                    <p className="mt-1 text-xs">{f.why}</p>
                    {f.howToPay ? <p className="mt-1 text-xs text-foreground">{f.howToPay}</p> : null}
                  </li>
                ))}
              </ul>
              {r.residentTax.jan1Tip ? <p className="mt-4 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-amber-100">{r.residentTax.jan1Tip}</p> : null}
              {r.deadlines.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">Dates</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted">
                    {r.deadlines.map((d) => (
                      <li key={d.date + d.what} className={d.passed ? "line-through opacity-60" : ""}>
                        <span className="mr-2 font-mono text-foreground">{d.date}</span>
                        {d.what} <span className="text-xs">· {d.ja}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h3 className="mt-6 text-sm font-semibold text-foreground">To do</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                {r.actions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {r.warnings.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">Watch out</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.warnings.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="mt-6">
                <ShareBar url={shareUrl} text={`Leaving Japan: ${r.summary}`} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Enter the day you leave Japan. Dates must be real (and arrival before departure).</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
