# Japan Leaving Tax Check

Free checker for leaving Japan: which fiscal years of resident tax (住民税) you still owe (the January 1 assessment date: leave by December 31 to skip the next year), whether you need a tax agent (納税管理人), the payroll lump-sum deduction from the final salary (mandatory for jobs ending January 1 – April 30), the income-tax year-end adjustment or 準確定申告 deadline, the previous-year return rule (January 1 – March 15), the exit-tax flag, the 転出届 window and the pension Lump-sum Withdrawal claim deadline. Dates and obligations only, no yen amounts.

Live: https://japan-leaving-tax.vercel.app

- API: `GET /api/check?departureDate=2027-03-20&employment=employee&payMethod=salary` (keyless, CORS open), `/api/rules`, `/openapi.json`, `/llms.txt`
- MCP: `japan_leaving_tax_check` on https://free-agent-tools.vercel.app/mcp

Sources: 地方税法 (39, 294, 300, 318, 321-5), 所得税法 (126, 127, 190), 国税通則法 117, 住民基本台帳法 24 (e-Gov), MIC resident-tax pages, NTA Tax Answers 1920 / 1923 / 1926 / 1478, Tokyo Regional Taxation Bureau, Japan Pension Service, city office guidance. Rules as of 2026-11-01.

**Disclaimer:** educational, not tax or legal advice; not affiliated with the NTA, MIC, any city office, the Japan Pension Service or the Immigration Services Agency. Confirm with your city office and tax office (or a 税理士) before you leave.
