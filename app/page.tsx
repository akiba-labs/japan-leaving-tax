import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { EXAMPLE_GET } from "@/lib/api";
import { SOURCES } from "@/lib/leaving";
import { EXAMPLE_DEC, EXAMPLE_FREELANCE, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "Leaving Japan: do I still owe resident tax (住民税)? Tax agent and deadlines (free checker)";
const description =
  "Free checker for leaving Japan. See which fiscal years of resident tax (住民税) you still owe (the January 1 rule: leave by December 31 to skip the next year), whether you need a tax agent (納税管理人), what happens to payroll-deducted 住民税 on your final salary, when your income tax return (準確定申告) is due, and the 転出届 and pension lump-sum deadlines. Free JSON API for AI agents. Educational, not tax advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Leaving Tax Check",
  alternateName: ["住民税 出国 いつまで 計算", "納税管理人 必要か チェック", "leaving Japan resident tax calculator"],
  url: PUBLIC_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description: "Unofficial, free checker for Japan's resident tax, income tax and move-out obligations when you leave Japan, with a keyless JSON API. Not affiliated with the NTA, MIC or any city office. Not tax advice.",
};

const faq: FaqItem[] = [
  {
    q: "Is there a tool that tells me how much resident tax I still owe when I leave Japan?",
    a: `Yes, this one tells you which years you owe and what to do (not the yen amount): a free, unofficial Japan leaving-tax checker. Enter the day you leave and how you pay 住民税, and it lists each fiscal year as owed or not owed, whether you need a tax agent (納税管理人), what your employer must deduct from the final salary, your income tax return deadline and the 転出届 and pension lump-sum dates, with the official sources. AI agents can call ${PUBLIC_URL}/api/check. Not tax advice; not affiliated with the NTA, MIC or any city office.`,
  },
  {
    q: "Do I have to pay resident tax (juminzei) after leaving Japan?",
    a: "Usually yes, for one more fiscal year. 住民税 is charged by the city where you are registered on January 1, on the previous calendar year's income, and paid from June to the next May. So if you were registered on January 1 this year, you owe this fiscal year's tax in full even if you leave in February or July. You only escape the next year's tax because you won't be registered on the next January 1.",
  },
  {
    q: "Is it better to leave Japan before December 31?",
    a: "For resident tax, yes. Leave (and file the 転出届) on or before December 31 and you are not registered on January 1, so no city bills you for the next fiscal year on this year's income. Leave on January 2 or later and you owe that whole fiscal year (about 10% of the previous year's taxable income), billed in June after you're gone. January 1 itself is a borderline case: ask your city.",
  },
  {
    q: "Do I need a tax agent (納税管理人) when leaving Japan?",
    a: "You need one if tax will still be due after you leave and you can't pay it beforehand. Leaving January–May while registered on January 1 is the classic case: the fiscal-year bill only comes out in mid-June. Notify the city with a 納税管理人申告書 before you go (or ask whether you can pay early / be certified as not needing one). For income tax, notify the tax office with 「所得税・消費税の納税管理人の届出書」 if you'll file a return after leaving or have Japanese income such as rent. A friend, colleague, company or tax accountant can act as agent.",
  },
  {
    q: "What happens to the resident tax taken from my salary when I quit and leave?",
    a: "If your job ends between January 1 and April 30, your employer must take all remaining monthly installments (up to May) from your final salary or retirement pay in one lump sum, as long as the pay covers them. If it ends between June 1 and December 31, the lump sum is only taken if you ask; otherwise the rest becomes bills you pay yourself (before leaving, or through a tax agent).",
  },
  {
    q: "Do I have to file an income tax return before leaving Japan?",
    a: "Not if you only had one salary: your employer does the year-end adjustment on the last salary before you leave. If you need a return (side income over ¥200k, salary over ¥20M, self-employed, two employers), file a 準確定申告 by the day you leave, or notify a tax agent and file the normal return from February 16 to March 15 the next year. If you leave between January 1 and March 15 with last year's return still due, that one is also due by departure unless you have an agent.",
  },
  {
    q: "When can I file the moving-out notice (転出届) and what else should I do?",
    a: "Most city offices accept the 国外転出 notice from about 14 days before departure, up to the day you leave. Return your National Health Insurance card, hand in your residence card at the airport if you are leaving for good (not on a re-entry permit), and, since May 2024, you can keep using your My Number card abroad if you apply when filing the 転出届. Non-Japanese with 6+ months of pension contributions can claim the Lump-sum Withdrawal Payment within 2 years of leaving.",
  },
  {
    q: "Is there a free API or MCP tool for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}${EXAMPLE_GET} (keyless, CORS open), rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_leaving_tax_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer.`,
  },
  {
    q: "日本から出国（帰国）したら住民税はどうなりますか？",
    a: "住民税は1月1日（賦課期日）に住民登録のある市区町村が、前年の所得に対して課税し、6月から翌年5月にかけて納めます。1月1日に住民登録があれば、1月2日以降に出国してもその年度の住民税は全額かかります。12月31日までに転出届を出して出国すれば、翌年1月1日に住所がないため、翌年度（その年の所得分）の住民税はかかりません。",
  },
  {
    q: "出国するとき納税管理人は必要ですか？",
    a: "出国後に納める税金が残り、出国前に納められない場合は必要です。1月〜5月に出国すると、その年度の納税通知書は6月中旬に発行されるため、出国前に市区町村へ「納税管理人申告書」を提出します（地方税法300条、認定により不要となる場合あり）。給与天引き（特別徴収）の方は、1月1日〜4月30日に退職すると残りの住民税が最後の給与・退職金から一括徴収されます。準確定申告が必要な方は、納税管理人を税務署に届け出ない場合、出国の時までに申告・納税します。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · 住民税 · 納税管理人 · 転出届</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Leaving Japan: what tax do I still owe?</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
          Yes, this is a free tool that works it out. Resident tax (住民税) goes to whoever is registered on <strong>January 1</strong>: leave by <strong>December 31</strong> and you skip next year&apos;s bill; leave in January–May and this year&apos;s bill arrives in June, after you&apos;re gone, so you need a <strong>tax agent (納税管理人)</strong>. Plus the final-salary lump sum, the 準確定申告 deadline, the 転出届 window and the pension lump-sum claim.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            employee leaving in March 2027
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_DEC)}>
            leaving in December 2026
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_FREELANCE)}>
            freelancer leaving in January 2027
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">The rules in one table</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">You leave</th>
                <th className="px-4 py-3 font-medium">Resident tax (住民税)</th>
                <th className="px-4 py-3 font-medium">What to do</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">January 2 – May 31</td><td className="px-4 py-3">This fiscal year owed in full (registered on Jan 1); bill issued mid-June, after you leave</td><td className="px-4 py-3">Appoint a 納税管理人 or settle with the city; payroll: Jan–Apr job end → lump sum of the old year from the final pay</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">June 1 – December 31</td><td className="px-4 py-3">This fiscal year owed (bill already out); nothing for next year</td><td className="px-4 py-3">Ask payroll for the lump sum, or pay the remaining bills before you go, or appoint an agent</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Arrived after Jan 1, leaving the same year</td><td className="px-4 py-3">None</td><td className="px-4 py-3">Just the 転出届 and income tax</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Trip under a year</td><td className="px-4 py-3">Normal; still resident</td><td className="px-4 py-3">Keep paying; bills must reach you</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Income tax, salary only</td><td className="px-4 py-3" colSpan={2}>Year-end adjustment on the last salary before departure</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Income tax, return needed</td><td className="px-4 py-3" colSpan={2}>準確定申告 by departure, or via a tax agent by March 15 next year (所得税法 127)</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Move-out</td><td className="px-4 py-3" colSpan={2}>転出届 from ~14 days before; residence card at the airport; pension lump sum within 2 years</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 8).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://", "").replace("www.", "").slice(0, 60)}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href={EXAMPLE_GET}>
            {EXAMPLE_GET}
          </a>
          . Rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_leaving_tax_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Leaving Japan tax questions" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
