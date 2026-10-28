// Batch Clock sample data. Everything here is invented: the building, the
// applicants, the dates. The handbook citations are real and must survive any
// restyle. See PRD-batch-clock.md for why this exists.

export type Stage = "first" | "second" | "offer" | "appeal" | "review" | "closed";

export type Doc = { name: string; received: boolean; cite: string }; // cite may be ''
export type Event = { date: string; text: string; cite?: string };

export type Applicant = {
  log: string; // 4-digit lottery log number, e.g. '0417'
  name: string;
  household: string; // e.g. '3 (2 adults, 1 child)'
  stage: Stage;
  start: Date; // when the current clock started
  docs: Doc[];
  history: Event[];
};

/** "Today" is fixed so the sample is stable. Wed 28 Oct 2026. */
export const TODAY = new Date(2026, 9, 28);

export const BATCH = {
  title: "Batch 3 · Sample Avenue Apartments",
  pulled: "Oct 2",
  units: 9,
};

/** Handbook clocks, from the HPD/HDC Marketing Handbook, rev. April 2026. Strings are used verbatim. */
export const RULES: Record<
  Stage,
  { label: string; days: number | null; cite: string; text: string }
> = {
  first: {
    label: "First document request",
    days: 10,
    cite: "§4-5.D.1.d",
    text: "The applicant must be given not less than ten weekdays from the date of the notice to submit documents.",
  },
  second: {
    label: "Second document request",
    days: 5,
    cite: "§4-5.D.2",
    text: "Applicants who submit partial documents must be sent an additional request and given at least five weekdays. Only after that may a rejection notice (H-4) be issued.",
  },
  offer: {
    label: "Unit offer",
    days: 5,
    cite: "§4-3.C.12",
    text: "An applicant offered a unit must be given five weekdays to respond before the unit is offered to the next eligible applicant.",
  },
  appeal: {
    label: "Appeal window",
    days: 10,
    cite: "§4-5.H",
    text: "A rejected applicant may appeal in writing. The appeal must be reviewed by a supervisor who was not the initial reviewer. Their place on the log is held meanwhile.",
  },
  review: {
    label: "In agent review",
    days: null,
    cite: "§5-2, §5-4",
    text: "No fixed deadline on the agent. The file is checked for household qualification and income calculated the handbook's way.",
  },
  closed: { label: "Closed", days: null, cite: "", text: "" },
};

const D = (m: number, d: number) => new Date(2026, m - 1, d);
const doc = (name: string, received: boolean, cite: string): Doc => ({ name, received, cite });
const ev = (date: string, text: string, cite?: string): Event =>
  cite ? { date, text, cite } : { date, text };

/** Twelve invented applicants, built from the handbook's own edge cases. */
export const APPLICANTS: Applicant[] = [
  {
    log: "0417",
    name: "Rosa Delgado",
    household: "3 (2 adults, 1 child)",
    stage: "second",
    start: D(10, 21),
    docs: [
      doc("Photo ID · R. Delgado", true, "§5-2"),
      doc("Photo ID · M. Delgado", true, "§5-2"),
      doc("Proof of dependency · child", false, '§5-2 "Dependent"'),
      doc("2 pay stubs · R. Delgado", true, "§5-4.C.a"),
      doc("Budget letter · M. Delgado (cash assistance)", false, "§5-4.G.2.a"),
    ],
    history: [
      ev("Oct 6", "First request sent, due Oct 20", "§4-5.D.1.d"),
      ev("Oct 17", "3 of 5 documents received"),
      ev("Oct 21", "Second request sent, due Oct 28", "§4-5.D.2"),
    ],
  },
  {
    log: "0388",
    name: "Kwame Mensah",
    household: "1",
    stage: "second",
    start: D(10, 21),
    docs: [
      doc("Photo ID", true, "§5-2"),
      doc("Schedule C, last year", false, "§5-4.D.1.a"),
      doc("Current-year net estimate", true, "§5-4.D.1.a.ii"),
    ],
    history: [
      ev("Oct 6", "First request sent, due Oct 20", "§4-5.D.1.d"),
      ev("Oct 20", "2 of 3 received; tax return missing"),
      ev("Oct 21", "Second request sent, due Oct 28", "§4-5.D.2"),
    ],
  },
  {
    log: "0452",
    name: "Li Wen & Zhang Hui",
    household: "2 (extended family)",
    stage: "offer",
    start: D(10, 22),
    docs: [doc("All documents received", true, "")],
    history: [
      ev("Oct 6", "First request sent"),
      ev("Oct 15", "All documents received"),
      ev("Oct 21", "Approved; file submitted to HDC"),
      ev("Oct 22", "Cleared. 1BR offered, response due Oct 29", "§4-3.C.12"),
    ],
  },
  {
    log: "0401",
    name: "Tamika Johnson",
    household: "4 (1 adult, 3 children)",
    stage: "appeal",
    start: D(10, 15),
    docs: [doc("Rejection: income below minimum for 2BR", false, "§5-4.B")],
    history: [
      ev("Oct 14", "Rejected: income below minimum"),
      ev("Oct 15", "Appeal received; assigned to J. Park (not initial reviewer)", "§4-5.H.2"),
      ev("Oct 27", "Appeal cites CityFHEPS voucher not on application"),
    ],
  },
  {
    log: "0463",
    name: "Omar Haddad",
    household: "2 (adults, interdependent)",
    stage: "first",
    start: D(10, 16),
    docs: [
      doc("Photo ID · O. Haddad", true, "§5-2"),
      doc("Photo ID · S. Haddad", false, "§5-2"),
      doc("Shared lease or utility bill", false, '§5-2 "Household" (c)'),
      doc("2 pay stubs · O. Haddad", true, "§5-4.C.a"),
      doc("4 pay stubs · S. Haddad (weekly)", false, "§5-4.C.a"),
    ],
    history: [
      ev("Oct 16", "First request sent, due Oct 30", "§4-5.D.1.d"),
      ev("Oct 24", "2 of 5 received"),
    ],
  },
  {
    log: "0429",
    name: "Marie-Claire Baptiste",
    household: "2 (1 adult, 1 child)",
    stage: "first",
    start: D(10, 16),
    docs: [
      doc("Photo ID", false, "§5-2"),
      doc("Proof of dependency", false, '§5-2 "Dependent"'),
      doc("Benefit award letter (SSDI)", false, "§5-4.G.2"),
      doc("Child support: order + proof of receipt", false, "§5-4.G.4.b"),
    ],
    history: [
      ev("Oct 16", "First request sent, due Oct 30", "§4-5.D.1.d"),
      ev("Oct 16", "Notice sent in Haitian Creole per preference", "§4-3.C.3"),
    ],
  },
  {
    log: "0398",
    name: "Daniel Reyes",
    household: "1",
    stage: "review",
    start: D(10, 23),
    docs: [
      doc("Photo ID", true, "§5-2"),
      doc("2 pay stubs", true, "§5-4.C.a"),
      doc("Employer verification (bonus on stub 2)", true, "Att. I-3"),
    ],
    history: [
      ev("Oct 6", "First request sent"),
      ev("Oct 20", "All documents received"),
      ev(
        "Oct 23",
        "In review: stub 2 carries a $1,800 bonus; exclude, annualize, add back",
        "§5-4.C Ex. 2",
      ),
    ],
  },
  {
    log: "0471",
    name: "Fatima Al-Sayed",
    household: "3 (2 adults, 1 child)",
    stage: "first",
    start: D(10, 20),
    docs: [
      doc("Photo ID · F. Al-Sayed", true, "§5-2"),
      doc("Photo ID · H. Al-Sayed", true, "§5-2"),
      doc("Proof of dependency", true, '§5-2 "Dependent"'),
      doc("Section 8 voucher letter", true, "§4-5.B.1"),
      doc("2 pay stubs · H. Al-Sayed", false, "§5-4.C.a"),
    ],
    history: [
      ev("Oct 20", "First request sent, due Nov 3", "§4-5.D.1.d"),
      ev(
        "Oct 27",
        "4 of 5 received. Voucher holder: no credit check, no minimum income",
        "§4-5.B.1; Att. R-5",
      ),
    ],
  },
  {
    log: "0445",
    name: "Andre Williams",
    household: "1",
    stage: "review",
    start: D(10, 24),
    docs: [
      doc("Photo ID", true, "§5-2"),
      doc("Certification of Unemployment and Zero Income", true, "Att. I-1"),
      doc("Unemployment benefit statement", true, "§5-4.G.2"),
    ],
    history: [
      ev(
        "Oct 24",
        "All documents received; benefits end in Feb, annualize at current rate anyway",
        "§5-4.F.1.a",
      ),
    ],
  },
  {
    log: "0480",
    name: "Priya Natarajan",
    household: "2 (spouses)",
    stage: "first",
    start: D(10, 22),
    docs: [
      doc("Photo ID · P. Natarajan", false, "§5-2"),
      doc("Photo ID · R. Natarajan", false, "§5-2"),
      doc("Marriage certificate", false, "§5-2"),
      doc("2 pay stubs · each", false, "§5-4.C.a"),
    ],
    history: [ev("Oct 22", "First request sent, due Nov 5", "§4-5.D.1.d")],
  },
  {
    // Rejected for non-response on Oct 21. The handbook gives him 10 business
    // days to appeal, so on Oct 28 his file is in the appeal window, not closed.
    log: "0412",
    name: "Jean-Pierre Louis",
    household: "1",
    stage: "appeal",
    start: D(10, 21),
    docs: [doc("Rejected: non-response after two requests", false, "§4-5.D.2.a")],
    history: [
      ev("Oct 6", "First request sent"),
      ev("Oct 14", "Second request sent"),
      ev(
        "Oct 21",
        "Rejection notice H-4 sent: non-response. Appeal window open",
        "§4-5.D.2.a, §4-5.H",
      ),
    ],
  },
  {
    log: "0436",
    name: "Sofia Petrov",
    household: "1",
    stage: "closed",
    start: D(10, 24),
    docs: [doc("Lease signed", true, "§4-5.G.7")],
    history: [
      ev("Oct 10", "All documents received"),
      ev("Oct 17", "Cleared by HDC"),
      ev("Oct 24", "Lease signed"),
    ],
  },
];
