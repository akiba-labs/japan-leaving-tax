import { ImageResponse } from "next/og";
import { EXAMPLE_SHARED, parseShared, safeCheck } from "@/lib/share";
import { VERDICT_LABEL } from "@/lib/verdict";

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = safeCheck(shared) ?? safeCheck(EXAMPLE_SHARED)!;
  const good = r.verdict === "nothing_after_departure" || r.verdict === "still_resident";
  const fy = r.residentTax.fiscalYears.slice(-3).map((f) => ({ label: `FY${f.fiscalYear} 住民税`, value: f.status === "owed" ? "owed" : f.status === "not_owed" ? "not owed" : "ask city" }));
  const stats = [{ label: "leaving", value: r.departureDate }, ...fy].slice(0, 3);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan Leaving Tax Check</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules as of {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>{VERDICT_LABEL[r.verdict]}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", color: good ? "#99f6e4" : "#fde68a", lineHeight: 1.15, maxWidth: 1070 }}>{r.summary.slice(0, 160)}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-leaving-tax.vercel.app · free, no login</span>
          <span>Educational. Not tax advice.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
