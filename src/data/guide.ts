// Script for the AI document guide prototype (/guide). Everything here is
// invented: the applicant, her mother, the building and the marketing agent.
// The handbook citations are real. This is a sketch of the PRD, not a spec.

import { addWeekdays } from "@/lib/clock";

export const GUIDE = {
  applicant: "Amina",
  building: "Sample Avenue Apartments",
  agent: "Northside Leasing",
  log: "0412",
};

/** Fixed so the sketch is stable. Thu 5 Nov 2026. */
export const GUIDE_TODAY = new Date(2026, 10, 5);
/** "Not less than ten weekdays from the date of the notice" (Handbook §4-5.D.1.d). */
export const GUIDE_DUE = addWeekdays(GUIDE_TODAY, 10);

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
export const DUE_TEXT = day(GUIDE_DUE);

export type ListPhase = "start" | "end";

export type Msg =
  | { kind: "bot"; text: string }
  | { kind: "other"; name: string; text: string }
  | { kind: "system"; text: string }
  | { kind: "photo"; label: string }
  | { kind: "list"; phase: ListPhase }
  | { kind: "explain"; title: string; rows: [string, string][]; cite: string }
  | { kind: "draft"; title: string; body: string }
  | { kind: "receipt"; text: string }
  | { kind: "history" }
  | { kind: "kinds" };

export type Chip = { label: string; to: string };

export type Step = {
  id: string;
  beat: number;
  say: Msg[];
  chips: Chip[];
  /** Other answers a real applicant could give. Shown greyed out: this sketch follows one path. */
  others?: string[];
};

export type Beat = { n: number; title: string; notes: { finding: string; rule?: string }[] };

export const BEATS: Beat[] = [
  {
    n: 1,
    title: "The first message",
    notes: [
      {
        finding: "Applicants sent to a second channel ask if it is a scam.",
        rule: "Handbook §4-3.F: files may not be shared with a third party without the agency's approval, so the guide speaks as the marketing agent and says how to check.",
      },
      {
        finding: "The clock starts when the notice is sent.",
        rule: "Handbook §4-5.D.1: at least ten weekdays.",
      },
    ],
  },
  {
    n: 2,
    title: "A few questions",
    notes: [
      {
        finding: "The list is written for everyone, so each applicant has to sort it themselves.",
        rule: "The City's document list (Attachment H-1C) branches by household and by how each adult earns money.",
      },
    ],
  },
  {
    n: 3,
    title: "Your list",
    notes: [
      { finding: "One list per person, showing only what applies." },
      {
        finding: "The first list is not the last.",
        rule: "The City's own request says more documents may be asked for during review.",
      },
    ],
  },
  {
    n: 4,
    title: "What counts",
    notes: [
      {
        finding: "Applicants do not know what counts until something is sent back.",
        rule: "Handbook §5-4.C: 2 pay stubs if paid every two weeks, 4 if paid weekly.",
      },
      { finding: "Explain, do not decide. The agent reads the income and decides who qualifies." },
    ],
  },
  {
    n: 5,
    title: "Upload",
    notes: [
      {
        finding:
          "No receipt exists today. Some applicants were rejected for failing to submit after they had submitted.",
      },
      {
        finding:
          "The guide says what it sees in a photo. It does not reject a document on its own.",
      },
    ],
  },
  {
    n: 6,
    title: "Ahead of a follow-up",
    notes: [
      {
        finding:
          "Follow-up requests are predictable. One applicant got two days to answer her third round.",
        rule: "Handbook §5-4.C: a bonus on a pay stub is something the agent must look into.",
      },
    ],
  },
  {
    n: 7,
    title: "Stuck",
    notes: [
      {
        finding: "A patient agent was why one family finished.",
        rule: "Handbook §4-5.D.2: a partial submission must get a second request with at least five more weekdays.",
      },
      { finding: "The agent learns someone is stuck before the deadline, not after it." },
    ],
  },
  {
    n: 8,
    title: "No lease",
    notes: [
      {
        finding: "The slowest documents come from other people.",
        rule: "Since April 2025 the City no longer requires signed statements to be notarized.",
      },
    ],
  },
  {
    n: 9,
    title: "Acting for her mother",
    notes: [
      {
        finding: "The person doing the documents is often not the applicant.",
        rule: "A 2025 Council bill (Intro 1265) lets applicants name a representative. Not confirmed to be in effect.",
      },
    ],
  },
  {
    n: 10,
    title: "A question",
    notes: [
      {
        finding:
          "Regular deposits have to be explained. One agent's guide sorts them into six kinds.",
        rule: "Handbook §5-4.G, §5-4.H and §5-4.J.",
      },
      { finding: "A person is reachable at every step." },
    ],
  },
  {
    n: 11,
    title: "Where things stand",
    notes: [
      {
        finding: "Applicants wait weeks without knowing where things stand.",
        rule: "Nothing in the Handbook limits how long the agent takes to review.",
      },
    ],
  },
];

export const NEVER = [
  "Decide whether a household qualifies",
  "Calculate income",
  "Reject a document on its own",
  "Ask about immigration status",
  "Suggest which documents to send to reach a number",
  "Invent a rule",
];

export const DEPOSIT_KINDS = [
  "Loan",
  "Loan repayment",
  "Reimbursement",
  "Gift",
  "Refund",
  "Other income",
];

const PAY_OTHERS = ["Weekly", "Twice a month", "Monthly", "In cash", "I work for myself"];

export const STEPS: Step[] = [
  {
    id: "hello",
    beat: 1,
    say: [
      {
        kind: "bot",
        text: `Hi ${GUIDE.applicant}. This is the document guide for ${GUIDE.agent}, the marketing agent for ${GUIDE.building}. Your application has been reached (log number ${GUIDE.log}).`,
      },
      {
        kind: "bot",
        text: `To confirm that you qualify, the agent needs documents from your household by ${DUE_TEXT}. That is ten weekdays from today.`,
      },
      {
        kind: "bot",
        text: `You can check this is real: ${GUIDE.agent} is the agent listed under the Contact tab of your Housing Connect application. I am an automated guide. A person at the agent's office can step in at any time.`,
      },
    ],
    chips: [
      { label: "Start", to: "q-household" },
      { label: "How do I know this is real?", to: "verify" },
    ],
  },
  {
    id: "verify",
    beat: 1,
    say: [
      {
        kind: "bot",
        text: `Fair question. Do not use a link from me. Log in to Housing Connect yourself, open this application and look at the Contact tab. It names ${GUIDE.agent} and the phone number this message came from. I will never ask you for a password or a payment.`,
      },
    ],
    chips: [{ label: "Start", to: "q-household" }],
  },
  {
    id: "q-household",
    beat: 2,
    say: [
      { kind: "bot", text: "A few questions first, so I only ask for what applies to you." },
      { kind: "bot", text: "Who will live in the apartment?" },
    ],
    chips: [{ label: "Me and my mother", to: "q-pay" }],
    others: ["Just me", "Me and my partner", "Me and children"],
  },
  {
    id: "q-pay",
    beat: 2,
    say: [{ kind: "bot", text: "How are you paid?" }],
    chips: [{ label: "Every two weeks", to: "q-pay-mother" }],
    others: PAY_OTHERS,
  },
  {
    id: "q-pay-mother",
    beat: 2,
    say: [{ kind: "bot", text: "And your mother?" }],
    chips: [{ label: "Weekly", to: "q-benefits" }],
    others: ["Every two weeks", "Twice a month", "Monthly", "In cash", "She is not working"],
  },
  {
    id: "q-benefits",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: "Does anyone in the household get benefits such as SNAP, Medicaid or cash assistance? If so, one letter may take the place of your pay stubs.",
      },
    ],
    chips: [{ label: "No", to: "q-lease" }],
    others: ["Yes"],
  },
  {
    id: "q-lease",
    beat: 2,
    say: [{ kind: "bot", text: "Do you have a lease where you live now?" }],
    chips: [{ label: "No, we live with a relative", to: "list" }],
    others: ["Yes"],
  },
  {
    id: "list",
    beat: 3,
    say: [
      {
        kind: "bot",
        text: "Thank you. Here is your household's list. It only has what applies to you.",
      },
      { kind: "list", phase: "start" },
      {
        kind: "bot",
        text: "The agent may ask for more after reviewing these. If they do, it will come here.",
      },
    ],
    chips: [{ label: "Open: my 2 pay stubs", to: "explain" }],
  },
  {
    id: "explain",
    beat: 4,
    say: [
      {
        kind: "explain",
        title: "Your pay stubs",
        rows: [
          [
            "What counts",
            "A pay stub from your employer that shows your name, the pay period and your pay before deductions.",
          ],
          [
            "How many",
            "2, because you are paid every two weeks. Your mother is paid weekly, so she needs 4. Either way they cover one month.",
          ],
          ["How recent", "Your most recent ones, in a row, with no gap between them."],
          [
            "Where to get them",
            "Your employer's payroll site or app, or ask payroll. Usually the same day.",
          ],
        ],
        cite: "Handbook §5-4.C; the City's document list (Attachment H-1C)",
      },
    ],
    chips: [{ label: "How is my income read?", to: "income" }],
  },
  {
    id: "income",
    beat: 4,
    say: [
      {
        kind: "explain",
        title: "How your income is read",
        rows: [
          [
            "Which money counts",
            "Wages, tips, overtime and regular bonuses. Benefits and regular help from family count too. A one-time gift does not.",
          ],
          [
            "What the agent does",
            "Works out a yearly figure from your pay stubs. They do it two ways and use the higher one.",
          ],
          [
            "What I cannot tell you",
            "Whether you qualify. The agent decides that, and I do not calculate it.",
          ],
        ],
        cite: "Handbook §5-4.C, §5-4.H",
      },
    ],
    chips: [{ label: "Take a photo", to: "upload-wrong" }],
  },
  {
    id: "upload-wrong",
    beat: 5,
    say: [
      { kind: "photo", label: "Photo 1" },
      {
        kind: "bot",
        text: "I can read this, but it looks like a bank statement, not a pay stub. A pay stub comes from your employer and shows a pay period, your hours or salary, and deductions.",
      },
      {
        kind: "bot",
        text: "If you are sure it is right, you can send it anyway and the agent will look at it.",
      },
    ],
    chips: [{ label: "Take another photo", to: "upload-right" }],
    others: ["Send it anyway"],
  },
  {
    id: "upload-right",
    beat: 5,
    say: [
      { kind: "photo", label: "Photo 2" },
      { kind: "bot", text: "Got it. Pay stub for Oct 12 to Oct 25. That is 1 of 2." },
      {
        kind: "receipt",
        text: `Received Thu, Nov 5 at 7:42 PM · Pay stub, ${GUIDE.applicant} · ${GUIDE.agent} can see this too`,
      },
    ],
    chips: [{ label: "Continue", to: "bonus" }],
  },
  {
    id: "bonus",
    beat: 6,
    say: [
      {
        kind: "bot",
        text: "One thing on this stub: a line marked Bonus, $400. The agent will likely ask about it, because a regular bonus is counted differently from a one-time one (Handbook §5-4.C).",
      },
      { kind: "bot", text: "Is it one-time or regular?" },
    ],
    chips: [{ label: "One-time", to: "bonus-noted" }],
    others: ["Regular"],
  },
  {
    id: "bonus-noted",
    beat: 6,
    say: [
      {
        kind: "bot",
        text: "Noted: one-time bonus. I have attached your answer to the stub, so the agent sees it with the document and does not have to ask.",
      },
      { kind: "receipt", text: "Note added Thu, Nov 5 at 7:43 PM · One-time bonus" },
    ],
    chips: [{ label: "Next: my mother's pay stubs", to: "stuck" }],
  },
  {
    id: "stuck",
    beat: 7,
    say: [
      {
        kind: "bot",
        text: "Your mother needs 4 pay stubs, because she is paid weekly. Do you have them?",
      },
    ],
    chips: [{ label: "I can't get these in time", to: "stuck-help" }],
    others: ["Yes, I have them"],
  },
  {
    id: "stuck-help",
    beat: 7,
    say: [
      { kind: "bot", text: "That is okay. Three things." },
      {
        kind: "bot",
        text: "First, the rules accept a letter from her employer in their place. Here is a message she can send them.",
      },
      {
        kind: "draft",
        title: "Message for her employer",
        body: "Hello. I am applying for housing and need a short letter on company letterhead confirming my job, my pay rate, my usual weekly hours and my start date. I need it by Tuesday, Nov 17. Thank you.",
      },
      {
        kind: "bot",
        text: `Second, I have told ${GUIDE.agent} that you are waiting on her employer, so they know before the deadline.`,
      },
      { kind: "system", text: `${GUIDE.agent} notified: waiting on employer` },
      {
        kind: "bot",
        text: `Third, send what you have. Sending part of the set is allowed. If something is still missing on ${DUE_TEXT}, the agent has to ask you again and give you at least five more weekdays. You are not rejected outright (Handbook §4-5.D.2).`,
      },
    ],
    chips: [{ label: "Next: proof of address", to: "lease" }],
  },
  {
    id: "lease",
    beat: 8,
    say: [
      {
        kind: "bot",
        text: "You said you live with a relative and have no lease. A signed letter from that relative works.",
      },
      {
        kind: "draft",
        title: "Letter for your relative to sign",
        body: "I confirm that Amina and her mother live with me at my address and have done so since the date written below. Name, address, date they moved in, signature and today's date.",
      },
      {
        kind: "bot",
        text: "It does not need a notary. Since April 2025 the City no longer requires signed statements like this to be notarized.",
      },
    ],
    chips: [{ label: "Text it to my relative", to: "proxy" }],
  },
  {
    id: "proxy",
    beat: 9,
    say: [
      {
        kind: "bot",
        text: "You are sending documents for your mother as well. I need her to say that is okay, so I have texted her.",
      },
      {
        kind: "system",
        text: `Sent to her phone: "Amina is sending your housing documents for ${GUIDE.building}. Reply YES to allow this."`,
      },
      { kind: "other", name: "Her mother", text: "YES" },
      {
        kind: "bot",
        text: "Confirmed. Anything you send for your mother is recorded as sent by you, and she can see it.",
      },
    ],
    chips: [{ label: "Does money my aunt sends me count as income?", to: "question" }],
  },
  {
    id: "question",
    beat: 10,
    say: [
      {
        kind: "bot",
        text: "It depends on whether it is regular. Help that comes regularly counts as income, and the agent needs a signed statement from your aunt saying how much and how often. A one-time gift does not count (Handbook §5-4.G, §5-4.H).",
      },
      {
        kind: "bot",
        text: "If the agent sees it on a bank statement they will ask what it was. You can tell them now. Which kind is it? Then tell me who it came from and why.",
      },
      { kind: "kinds" },
    ],
    chips: [{ label: "Gift, from my aunt, for my birthday", to: "question-noted" }],
  },
  {
    id: "question-noted",
    beat: 10,
    say: [
      { kind: "bot", text: "Recorded: a gift from your aunt, for your birthday, one time." },
      { kind: "bot", text: "I cannot tell you whether you qualify. The agent decides that." },
    ],
    chips: [{ label: "Where do things stand?", to: "status" }],
  },
  {
    id: "status",
    beat: 11,
    say: [
      { kind: "bot", text: "Here is where things stand tonight." },
      { kind: "list", phase: "end" },
      { kind: "history" },
      { kind: "bot", text: `You have 10 weekdays left. Everything is due ${DUE_TEXT}.` },
      {
        kind: "bot",
        text: `What happens next: ${GUIDE.agent} reviews what you send. They may ask for more. Anything new arrives here, with its own date.`,
      },
    ],
    chips: [],
  },
];

export type ListItem = { name: string; note?: string; state: Record<ListPhase, string> };
export type ListGroup = { who: string; items: ListItem[] };

const NOT_STARTED = "Not started";

export const LIST: ListGroup[] = [
  {
    who: "Amina",
    items: [
      { name: "Photo ID", state: { start: NOT_STARTED, end: NOT_STARTED } },
      { name: "Social Security card or tax ID", state: { start: NOT_STARTED, end: NOT_STARTED } },
      {
        name: "2 pay stubs",
        note: "Paid every two weeks",
        state: { start: NOT_STARTED, end: "1 received by the agent · needs another" },
      },
    ],
  },
  {
    who: "Her mother",
    items: [
      { name: "Photo ID", state: { start: NOT_STARTED, end: NOT_STARTED } },
      { name: "Social Security card or tax ID", state: { start: NOT_STARTED, end: NOT_STARTED } },
      {
        name: "4 pay stubs",
        note: "Paid weekly",
        state: { start: NOT_STARTED, end: "Waiting on employer" },
      },
    ],
  },
  {
    who: "The household",
    items: [
      {
        name: "Proof of where you live now",
        note: "No lease: a signed letter from the relative you live with",
        state: { start: NOT_STARTED, end: "Sent to your relative to sign" },
      },
    ],
  },
];

export const HISTORY: [string, string][] = [
  ["7:42 PM", "Pay stub for Oct 12 to Oct 25 received by the agent"],
  ["7:43 PM", "Note added to the stub: one-time bonus"],
  ["7:46 PM", "Agent told: waiting on employer for her mother's pay stubs"],
  ["7:48 PM", "Letter sent to your relative to sign"],
  ["7:49 PM", "Her mother confirmed Amina may act for her"],
  ["7:52 PM", "Note recorded: gift from aunt, one time"],
];
