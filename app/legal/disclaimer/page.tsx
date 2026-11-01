import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/leaving";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational checker. It applies a dated reading (as of {RULES_AS_OF}) of the Local Tax Act (地方税法 arts 39, 294, 300, 318, 321-5), the Income Tax Act (所得税法 arts 126, 127, 190), the Act on General Rules for National Taxes (国税通則法 117), the Basic Resident Registration Act (住民基本台帳法 24), the Ministry of Internal Affairs and Communications resident-tax pages, NTA Tax Answers 1920 / 1923 / 1926 / 1478, city office guidance and the Japan Pension Service lump-sum page to the dates and choices you enter.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not tax or legal advice and is not affiliated with the National Tax Agency, the Ministry of Internal Affairs and Communications, any prefecture, city or ward office, the Japan Pension Service or the Immigration Services Agency. It does not calculate yen amounts, check tax treaties (some students, trainees, teachers and researchers are exempt), cover consumption, inheritance or gift tax, or know your city&apos;s own forms and procedure. Your city office decides your 住民税 and your tax office decides your income tax; confirm with them, or a licensed tax accountant (税理士), before you leave.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">How dates are counted</h2>
          <p className="mt-2">
            The resident-tax assessment date is January 1: you are treated as registered on January 1 of the departure year unless you give a later first-registration date. Fiscal year N runs June N to May N+1 and taxes the income of year N−1. Leaving January–May means the fiscal-year bill (issued around mid-June) arrives after you leave. Payroll lump-sum rules use your job end date (default: the departure date). The 転出届 window starts 14 days before departure (common practice; your city may differ). Tax deadlines falling on a Saturday or Sunday move to Monday; public holidays are not shifted. The pension lump-sum deadline is 2 years after the departure date. Treat every date as the latest safe day, not a target.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">The dates you enter stay in your browser (or in a share link you create). No login, no names, no database. No income figures are asked for.</p>
        </section>
      </div>
    </div>
  );
}
