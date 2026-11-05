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

/** Her own page. An invented link on a reserved example domain. No app, no password. */
export const LINK = "northside.example/p/0412";

export type Msg =
  | { kind: "bot"; text: string; to?: string }
  | { kind: "other"; name: string; text: string }
  | { kind: "system"; text: string }
  | { kind: "photo"; label: string }
  | { kind: "draft"; title: string; body: string };

export type Chip = { label: string; to: string };

/** What a step changes on her page. Folded in order along the path she has taken. */
export type PagePatch = {
  ready?: true;
  expanded?: string;
  states?: Record<string, string>;
  receipts?: [string, string][];
};

export type Step = {
  id: string;
  beat: number;
  say: Msg[];
  chips: Chip[];
  /** A reply she types in her own words instead of tapping a suggestion. */
  typed?: { text: string; to: string };
  /** Other answers a real applicant could give. Shown greyed out: this sketch follows one path. */
  others?: string[];
  page?: PagePatch;
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
      {
        finding:
          "She can do all of it by text, or open her own page from the link. Both show the same record.",
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
      {
        finding:
          "The rule supplies the options. The AI understands her words and confirms. It never invents an option.",
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
      {
        finding:
          "A text thread scrolls away. Replying LIST at any time brings back the link to her page and a one-line status.",
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
      {
        finding:
          "Her mother answers in Spanish and the guide replies in Spanish. The AI understands the words and confirms. It never invents an option.",
        rule: "Handbook §4-3.C.3: notices in the applicant's preferred language.",
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

const PAY_OPTIONS = [
  "Weekly",
  "Every two weeks",
  "Twice a month",
  "Monthly",
  "In cash",
  "I work for myself",
];

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
        text: `The agent needs documents from your household by ${DUE_TEXT}. That is ten weekdays from today. You can do all of it here by text, or on your own page: ${LINK} No app, no password. Both show the same record.`,
      },
      {
        kind: "bot",
        text: `To check this is real: ${GUIDE.agent} is the agent listed under the Contact tab of your Housing Connect application. I am an automated guide. A person at the agent's office can step in at any time. Reply START to begin.`,
      },
    ],
    chips: [
      { label: "START", to: "q-household" },
      { label: "How do I know this is real?", to: "verify" },
    ],
  },
  {
    id: "verify",
    beat: 1,
    say: [
      {
        kind: "bot",
        text: `Fair question. Do not trust a link just because I sent it. Log in to Housing Connect yourself, open this application and look at the Contact tab. It names ${GUIDE.agent} and the number this text came from. I will never ask you for a password or a payment.`,
      },
    ],
    chips: [{ label: "START", to: "q-household" }],
  },
  {
    id: "q-household",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: "A few questions first, so I only ask for what applies to you. You can answer in your own words. Who will live in the apartment?",
      },
    ],
    chips: [{ label: "Me and my mother", to: "q-pay" }],
    others: ["Just me", "Me and my partner", "Me and children"],
  },
  {
    id: "q-pay",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: "How are you paid? Weekly, every two weeks, twice a month, monthly, in cash, or you work for yourself.",
      },
    ],
    chips: [],
    typed: { text: "every other friday", to: "q-pay-confirm" },
    others: PAY_OPTIONS,
  },
  {
    id: "q-pay-confirm",
    beat: 2,
    say: [{ kind: "bot", text: "I will put that down as every two weeks. Is that right?" }],
    chips: [{ label: "Yes", to: "q-pay-mother" }],
    others: ["No"],
  },
  {
    id: "q-pay-mother",
    beat: 2,
    say: [{ kind: "bot", text: "And your mother? Same choices, or she is not working." }],
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
      {
        kind: "bot",
        text: "You: photo ID, Social Security card or tax ID, 2 pay stubs.\nYour mother: photo ID, Social Security card or tax ID, 4 pay stubs.\nHousehold: proof of where you live now. With no lease, that is a signed letter from the relative you live with.",
      },
      {
        kind: "bot",
        text: `The list is on your page too, with what counts for each one: ${LINK} The agent may ask for more after reviewing these. If they do, it comes here and to your page.`,
      },
    ],
    chips: [{ label: "What counts as a pay stub?", to: "explain" }],
    page: { ready: true },
  },
  {
    id: "explain",
    beat: 4,
    say: [
      {
        kind: "bot",
        text: "A pay stub comes from your employer and shows your name, the pay period and your pay before deductions. You need 2, because you are paid every two weeks. Your mother is paid weekly, so she needs 4. Send your most recent ones, in a row. Your employer's payroll site usually has them the same day. (Handbook §5-4.C)",
      },
    ],
    chips: [{ label: "How is my income read?", to: "income" }],
    page: { expanded: "a-stubs" },
  },
  {
    id: "income",
    beat: 4,
    say: [
      {
        kind: "bot",
        text: "Wages, tips, overtime and regular bonuses count. So do benefits and regular help from family. A one-time gift does not. The agent works out a yearly figure from your stubs, two ways, and uses the higher one. (Handbook §5-4.C, §5-4.H)",
      },
      {
        kind: "bot",
        text: "I cannot tell you whether you qualify. The agent decides that, and I do not calculate it. When you are ready, text me a photo of a pay stub.",
      },
    ],
    chips: [{ label: "Send a photo", to: "upload-wrong" }],
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
        text: "If you are sure it is right, reply SEND and the agent will look at it.",
      },
    ],
    chips: [{ label: "Send another photo", to: "upload-right" }],
    others: ["SEND"],
  },
  {
    id: "upload-right",
    beat: 5,
    say: [
      { kind: "photo", label: "Photo 2" },
      {
        kind: "bot",
        text: `Got it. Pay stub for Oct 12 to Oct 25. That is 1 of 2. Received Thu, Nov 5 at 7:42 PM. ${GUIDE.agent} can see it too, and it is on your page. Reply LIST any time to see where things stand.`,
      },
    ],
    chips: [
      { label: "LIST", to: "list-status" },
      { label: "Continue", to: "bonus" },
    ],
    page: {
      states: { "a-stubs": "1 received by the agent · needs another" },
      receipts: [["7:42 PM", "Pay stub for Oct 12 to Oct 25 received by the agent"]],
    },
  },
  {
    id: "list-status",
    beat: 5,
    say: [
      {
        kind: "bot",
        text: `1 of 11 documents received. 10 weekdays left. Your page: ${LINK}`,
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
        text: "One thing on this stub: a line marked Bonus, $400. The agent will likely ask about it, because a regular bonus is counted differently from a one-time one (Handbook §5-4.C). Is it one-time or regular?",
      },
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
    ],
    chips: [{ label: "Next: my mother's pay stubs", to: "stuck" }],
    page: { receipts: [["7:43 PM", "Note added to the stub: one-time bonus"]] },
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
      {
        kind: "bot",
        text: "That is okay. Three things. First, the rules accept a letter from her employer in their place. Here is a message she can send them.",
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
    page: {
      states: { "m-stubs": "Waiting on employer" },
      receipts: [["7:46 PM", "Agent told: waiting on employer for her mother's pay stubs"]],
    },
  },
  {
    id: "lease",
    beat: 8,
    say: [
      {
        kind: "bot",
        text: "You said you live with a relative and have no lease. A signed letter from that relative works. Here is one they can sign.",
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
    chips: [{ label: "Send it to my relative", to: "proxy" }],
    page: {
      states: { "h-address": "Sent to your relative to sign" },
      receipts: [["7:48 PM", "Letter sent to your relative to sign"]],
    },
  },
  {
    id: "proxy",
    beat: 9,
    say: [
      {
        kind: "bot",
        text: "You are sending documents for your mother as well. I need her to say that is okay, so I have texted her in Spanish, the language she chose.",
      },
      {
        kind: "bot",
        to: "To her mother",
        text: `Amina está enviando sus documentos de vivienda para ${GUIDE.building}. ¿Está de acuerdo? Puede responder con sus propias palabras.`,
      },
      { kind: "other", name: "Her mother", text: "Sí, mi hija puede hacerlo por mí." },
      {
        kind: "bot",
        to: "To her mother",
        text: `Gracias. Lo anoto como un sí. Usted puede ver todo lo que Amina envíe en su página: ${LINK}`,
      },
      {
        kind: "bot",
        text: "Confirmed. Anything you send for your mother is recorded as sent by you, and she can see it.",
      },
    ],
    chips: [],
    typed: { text: "does money my aunt sends me count as income?", to: "question" },
    page: { receipts: [["7:49 PM", "Her mother confirmed Amina may act for her"]] },
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
        text: "If the agent sees it on a bank statement they will ask what it was. You can tell them now. Is it a loan, a loan repayment, a reimbursement, a gift, a refund or other income? Then tell me who it came from and why.",
      },
    ],
    chips: [],
    typed: { text: "a gift from my aunt for my birthday", to: "question-noted" },
    others: DEPOSIT_KINDS,
  },
  {
    id: "question-noted",
    beat: 10,
    say: [
      { kind: "bot", text: "Recorded: a gift from your aunt, for your birthday, one time." },
      { kind: "bot", text: "I cannot tell you whether you qualify. The agent decides that." },
    ],
    chips: [{ label: "LIST", to: "status" }],
    page: { receipts: [["7:52 PM", "Note recorded: gift from aunt, one time"]] },
  },
  {
    id: "status",
    beat: 11,
    say: [
      {
        kind: "bot",
        text: `1 of 11 documents received. 2 items are waiting on other people. 10 weekdays left, due ${DUE_TEXT}. Your page has the full list and everything you have sent: ${LINK}`,
      },
      {
        kind: "bot",
        text: `What happens next: ${GUIDE.agent} reviews what you send. They may ask for more. Anything new comes here and to your page, with its own date.`,
      },
    ],
    chips: [],
  },
];

export type ListItem = { id: string; name: string; note?: string };
export type ListGroup = { who: string; items: ListItem[] };

export const NOT_STARTED = "Not started";

export const LIST: ListGroup[] = [
  {
    who: "Amina",
    items: [
      { id: "a-id", name: "Photo ID" },
      { id: "a-ssn", name: "Social Security card or tax ID" },
      { id: "a-stubs", name: "2 pay stubs", note: "Paid every two weeks" },
    ],
  },
  {
    who: "Her mother",
    items: [
      { id: "m-id", name: "Photo ID" },
      { id: "m-ssn", name: "Social Security card or tax ID" },
      { id: "m-stubs", name: "4 pay stubs", note: "Paid weekly" },
    ],
  },
  {
    who: "The household",
    items: [
      {
        id: "h-address",
        name: "Proof of where you live now",
        note: "No lease: a signed letter from the relative you live with",
      },
    ],
  },
];

/** What counts for pay stubs: the one item expanded on her page in this sketch. */
export const WHAT_COUNTS: { item: string; rows: [string, string][]; cite: string } = {
  item: "a-stubs",
  rows: [
    [
      "What counts",
      "A pay stub from your employer that shows your name, the pay period and your pay before deductions.",
    ],
    ["How many", "2, because you are paid every two weeks. They cover one month."],
    ["How recent", "Your most recent ones, in a row, with no gap between them."],
    [
      "Where to get them",
      "Your employer's payroll site or app, or ask payroll. Usually the same day.",
    ],
  ],
  cite: "Handbook §5-4.C; the City's document list (Attachment H-1C)",
};
