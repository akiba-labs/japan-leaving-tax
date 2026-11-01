/** Verdict labels and colours, shared by server pages and the client calculator. */
export const VERDICT_STYLE: Record<string, string> = {
  agent_needed: "text-amber-200",
  settle_before_departure: "text-amber-200",
  nothing_after_departure: "text-teal-200",
  still_resident: "text-teal-200",
};
export const VERDICT_LABEL: Record<string, string> = {
  agent_needed: "Tax agent needed",
  settle_before_departure: "Settle before you leave",
  nothing_after_departure: "Nothing after you leave",
  still_resident: "Still resident",
};
