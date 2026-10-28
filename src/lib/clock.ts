import { RULES, TODAY, type Applicant } from "@/data/batch";

// Weekday math skips Saturday and Sunday only. Holidays are not accounted for:
// the handbook says "weekdays" in some places and "business days" in others,
// and this prototype treats them the same.
export function addWeekdays(d: Date, n: number): Date {
  const x = new Date(d);
  let k = 0;
  while (k < n) {
    x.setDate(x.getDate() + 1);
    if (x.getDay() !== 0 && x.getDay() !== 6) k++;
  }
  return x;
}

/** Signed count of weekdays from a to b (negative when b is before a). */
export function weekdaysBetween(a: Date, b: Date): number {
  let n = 0;
  const x = new Date(a);
  const sign = b >= a ? 1 : -1;
  while ((sign > 0 && x < b) || (sign < 0 && x > b)) {
    x.setDate(x.getDate() + sign);
    if (x.getDay() !== 0 && x.getDay() !== 6) n += sign;
  }
  return n;
}

export const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export type Status = "today" | "soon" | "ok" | "done";

/** Derived per applicant, never stored. */
export type Derived = {
  due: Date | null;
  left: number | null; // weekdays from today to due; negative = overdue
  status: Status;
  received: number;
  missing: number;
};

export function derive(a: Applicant): Derived {
  const rule = RULES[a.stage];
  const due = rule.days ? addWeekdays(a.start, rule.days) : null;
  const left = due ? weekdaysBetween(TODAY, due) : null;
  const status: Status =
    a.stage === "closed"
      ? "done"
      : left == null
        ? "ok"
        : left <= 0
          ? "today"
          : left <= 3
            ? "soon"
            : "ok";
  const received = a.docs.filter((d) => d.received).length;
  return { due, left, status, received, missing: a.docs.length - received };
}

export function clockText(a: Applicant, d: Derived): string {
  if (a.stage === "closed") return "closed";
  if (d.due == null || d.left == null) return "no clock";
  if (d.left < 0) return `${-d.left} weekday${d.left === -1 ? "" : "s"} overdue`;
  if (d.left === 0) return "expires today";
  return `${d.left} weekday${d.left === 1 ? "" : "s"} left · ${fmt(d.due)}`;
}

/** Timed rows by days left, then rows with no clock, then closed. */
export function sortKey(a: Applicant, d: Derived): number {
  if (a.stage === "closed") return 1e9;
  if (d.left == null) return 1e8;
  return d.left;
}

export type ActionKind = "second" | "reject" | "review";
export type Action =
  { kind: ActionKind; label: string; note?: string } | { kind: "disabled"; label: string };

/** The one action the handbook allows right now, if any. */
export function actionFor(a: Applicant, d: Derived): Action | null {
  const left = d.left ?? 0;
  if ((a.stage === "first" || a.stage === "second") && d.missing === 0) {
    return { kind: "review", label: "Move to review" };
  }
  if (a.stage === "first" && d.received > 0 && d.missing > 0) {
    return {
      kind: "second",
      label: "Send second request · +5 weekdays",
      note: "Required by §4-5.D.2 when documents are partial. Resets the clock and logs the rule.",
    };
  }
  if (a.stage === "first" && left <= 0 && d.received === 0) {
    return {
      kind: "second",
      label: "Send second request · +5 weekdays",
      note: "§4-5.D.2.a allows a rejection only after a follow-up request has also expired.",
    };
  }
  if (a.stage === "second" && left <= 0 && d.missing > 0) {
    return {
      kind: "reject",
      label: "Issue rejection notice (H-4)",
      note:
        d.received === 0
          ? "Both windows have run. §4-5.D.2.a permits rejection for non-response. The applicant then has 10 business days to appeal."
          : "Both windows have run. §4-5.D.2.a permits a rejection notice once the second request has also expired with documents still missing. The applicant then has 10 business days to appeal.",
    };
  }
  if (a.stage === "review") {
    return { kind: "disabled", label: "Income worksheet (not built in this prototype)" };
  }
  return null;
}

/** Applies an action and returns the new applicant plus the toast that names the rule logged. */
export function apply(a: Applicant, kind: ActionKind): { applicant: Applicant; toast: string } {
  const today = fmt(TODAY);
  const received = a.docs.filter((d) => d.received).length;
  switch (kind) {
    case "second":
      return {
        applicant: {
          ...a,
          stage: "second",
          start: TODAY,
          history: [
            ...a.history,
            {
              date: today,
              text: `Second request sent, due ${fmt(addWeekdays(TODAY, 5))}`,
              cite: "§4-5.D.2",
            },
          ],
        },
        toast: "Second request logged under §4-5.D.2. Clock reset: 5 weekdays.",
      };
    case "reject": {
      // A family that sent some documents is rejected as incomplete; only a
      // family that sent nothing is rejected for non-response.
      const why = received > 0 ? "incomplete documents" : "non-response";
      return {
        applicant: {
          ...a,
          stage: "appeal",
          start: TODAY,
          docs: [
            { name: `Rejected: ${why} after two requests`, received: false, cite: "§4-5.D.2.a" },
          ],
          history: [
            ...a.history,
            {
              date: today,
              text: `Rejection notice H-4 sent: ${why} after two requests. Appeal window open`,
              cite: "§4-5.D.2.a, §4-5.H",
            },
          ],
        },
        toast: "Rejection logged under §4-5.D.2.a. Appeal clock started: 10 business days.",
      };
    }
    case "review":
      return {
        applicant: {
          ...a,
          stage: "review",
          start: TODAY,
          history: [
            ...a.history,
            { date: today, text: "All documents in. Moved to review", cite: "§5-2, §5-4" },
          ],
        },
        toast: "Moved to review under §5-2 and §5-4. No fixed deadline on the agent.",
      };
  }
}
