import { describe, expect, it } from "vitest";

import { APPLICANTS, RULES } from "@/data/batch";
import { actionFor, apply, clockText, derive, sortKey } from "@/lib/clock";

const byLog = (log: string) => {
  const a = APPLICANTS.find((x) => x.log === log);
  if (!a) throw new Error(`no applicant ${log}`);
  return a;
};

// Acceptance checks from BUILD-batch-clock.md.
describe("Batch Clock", () => {
  it("Rosa Delgado expires today with 3 of 5 docs and can only be rejected", () => {
    const rosa = byLog("0417");
    const d = derive(rosa);
    expect(clockText(rosa, d)).toBe("expires today");
    expect(d.received).toBe(3);
    expect(rosa.docs).toHaveLength(5);
    expect(actionFor(rosa, d)?.label).toBe("Issue rejection notice (H-4)");

    const { applicant } = apply(rosa, "reject");
    expect(applicant.stage).toBe("appeal");
    expect(RULES[applicant.stage].days).toBe(10);
    expect(applicant.history.at(-1)?.cite).toContain("§4-5.D.2.a");
    expect(applicant.history.at(-1)?.text).toContain("incomplete");
  });

  it("Omar Haddad has 2 weekdays left and gets a 5-weekday second request", () => {
    const omar = byLog("0463");
    expect(clockText(omar, derive(omar))).toBe("2 weekdays left · Oct 30");
    expect(actionFor(omar, derive(omar))?.label).toBe("Send second request · +5 weekdays");

    const { applicant } = apply(omar, "second");
    expect(clockText(applicant, derive(applicant))).toBe("5 weekdays left · Nov 4");
    expect(RULES[applicant.stage].cite).toBe("§4-5.D.2");
  });

  it("Fatima Al-Sayed's history cites the voucher rule", () => {
    const line = byLog("0471").history.find((h) => h.text.includes("Voucher holder"));
    expect(line?.cite).toBe("§4-5.B.1; Att. R-5");
  });

  it("sorts expiring-today first, then days left, then no clock, then closed", () => {
    const sorted = [...APPLICANTS].sort((x, y) => sortKey(x, derive(x)) - sortKey(y, derive(y)));
    const stages = sorted.map((a) => `${a.log}:${a.stage}`);
    expect(stages.slice(0, 2).sort()).toEqual(["0388:second", "0417:second"]);
    expect(sorted.at(-1)?.stage).toBe("closed");
    const firstNoClock = sorted.findIndex((a) => derive(a).left == null && a.stage !== "closed");
    const lastTimed = sorted.map((a) => derive(a).left != null).lastIndexOf(true);
    expect(firstNoClock).toBeGreaterThan(lastTimed);
  });

  it("a rejected applicant is in the appeal window, not closed", () => {
    const jp = byLog("0412");
    expect(jp.stage).toBe("appeal");
    expect(clockText(jp, derive(jp))).toBe("5 weekdays left · Nov 4");
  });
});
