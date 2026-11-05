// Script for the AI document guide prototype (/guide). Everything here is
// invented: the applicant, her mother Hawa, the building and the marketing agent.
// The handbook citations are real. This is a sketch of the PRD, not a spec.

import { addWeekdays } from "@/lib/clock";

export const GUIDE = {
  applicant: "Amina",
  /** The other adult on the application. The guide knows her name, not that she is Amina's mother. */
  other: "Hawa",
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

/** Her own page. An invented link on a reserved example domain. No app; it opens with a code texted to her phone. */
export const LINK = "northside.example/p/0412";

export type Msg =
  | { kind: "bot"; text: string }
  | { kind: "system"; text: string }
  /** A text the guide drafts for someone who is not on the application. She copies it and sends it herself. */
  | { kind: "draft"; title: string; body: string; copy: string };

/** A text she sends, and the step it leads to. */
export type Reply = { text: string; to: string };

/** What a step changes on her page. Folded in order along the path she has taken. */
export type PagePatch = {
  ready?: true;
  expanded?: string;
  /** Documents received for an item at this step. */
  got?: Record<string, number>;
  /** Items she has asked for help with. The agent is told. */
  stuck?: string[];
  /** A small dated line added under an item. */
  lines?: Record<string, string>;
  history?: [string, string][];
  /** The pay stub exchange, shown on her page rather than in the thread. */
  demo?: "stub-wrong" | "stub-right";
};

export type Step = {
  id: string;
  beat: number;
  say: Msg[];
  /** Her next text, already typed in the box. A text message has no buttons: the viewer presses Send. */
  reply?: Reply;
  /** Something else she could send instead, offered under the box. */
  alt?: Reply;
  /** A move that is not a text from her: she opens her page, or the guide texts first. */
  next?: { label: string; to: string };
  /** The separate thread on the other adult's phone. */
  other?: { say: { from: "guide" | "her"; text: string }[]; reply?: Reply; gloss?: string };
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
          "She answers by text. Documents are added on her own page, which is just her list and where it stands.",
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
          "The numbered options come from the rule. She can answer with a number or in her own words, and the guide confirms what it understood. It never invents an option.",
      },
      {
        finding: "The guide knows names from the application, not relationships, so it uses names.",
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
          "A photo sent by text sits in the phone's message history. Documents go through the secure page.",
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
      {
        finding:
          "The guide only contacts people on the application. She forwards the letter herself.",
      },
    ],
  },
  {
    n: 9,
    title: "Acting for Hawa",
    notes: [
      { finding: "She agrees from her own phone, not through her daughter's." },
      {
        finding: "The person doing the documents is often not the applicant.",
        rule: "A 2025 Council bill (Intro 1265) lets applicants name a representative. Not confirmed to be in effect.",
      },
      {
        finding:
          "Hawa answers in Spanish and the guide replies in Spanish. The AI understands the words and confirms. It never invents an option.",
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
      {
        finding:
          "A text thread scrolls away. Replying LIST at any time brings back the link to her page and a one-line status.",
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
  "Contact anyone who is not on the application",
];

/** The rule's options, numbered in words. A text message has no buttons, so she replies with a number or in her own words. */
const numbered = (opts: string[]) => opts.map((o, i) => `${i + 1} for ${o}`).join(", ");

const PAY_OPTIONS = ["weekly", "every two weeks", "twice a month", "monthly", "cash"];
const DEPOSIT_OPTIONS = [
  "a loan",
  "a loan repayment",
  "a reimbursement",
  "a gift",
  "a refund",
  "other income",
];

const ASK_OTHER = `Amina has asked to handle your documents for ${GUIDE.building}. Reply YES to allow it, or NO.`;
const OTHER_YES = "Sí, mi hija puede hacerlo por mí.";

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
        text: `The agent needs documents from your household by ${DUE_TEXT}. That is ten weekdays from today. You can answer my questions here by text. Documents go on your own page, which is just your list and where it stands: ${LINK} No app. It opens with a code texted to this phone.`,
      },
      {
        kind: "bot",
        text: `To check this is real: ${GUIDE.agent} is the agent listed under the Contact tab of your Housing Connect application. I am an automated guide. A person at the agent's office can step in at any time. Reply START to begin.`,
      },
    ],
    reply: { text: "START", to: "q-household" },
    alt: { text: "How do I know this is real?", to: "verify" },
  },
  {
    id: "verify",
    beat: 1,
    say: [
      {
        kind: "bot",
        text: `Fair question. Do not trust a link just because I sent it. Log in to Housing Connect yourself, open this application and look at the Contact tab. It names ${GUIDE.agent} and the number this text came from. I will never ask you for a password or a payment. Reply START when you are ready.`,
      },
    ],
    reply: { text: "START", to: "q-household" },
  },
  {
    id: "q-household",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: `A few questions first, so I only ask for what applies to you. Your application lists two adults: you and ${GUIDE.other}. Is that still right? Reply 1 for yes, 2 if something has changed.`,
      },
    ],
    reply: { text: "1", to: "q-pay" },
  },
  {
    id: "q-pay",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: `How are you paid? Reply ${numbered(PAY_OPTIONS)}. Or just tell me.`,
      },
    ],
    reply: { text: "every other friday", to: "q-pay-confirm" },
  },
  {
    id: "q-pay-confirm",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: "I will put that down as 2, every two weeks. Reply YES if that is right, or NO.",
      },
    ],
    reply: { text: "YES", to: "q-pay-other" },
  },
  {
    id: "q-pay-other",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: `And ${GUIDE.other}? Reply ${numbered(PAY_OPTIONS)}, 6 if she is not working. Or just tell me.`,
      },
    ],
    reply: { text: "1", to: "q-benefits" },
  },
  {
    id: "q-benefits",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: `Weekly for ${GUIDE.other}. Does anyone in the household get benefits such as SNAP, Medicaid or cash assistance? If so, one letter may take the place of your pay stubs. Reply 1 for yes, 2 for no.`,
      },
    ],
    reply: { text: "2", to: "q-lease" },
  },
  {
    id: "q-lease",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: "Do you have a lease where you live now? Reply 1 for yes, 2 for no. Or just tell me.",
      },
    ],
    reply: { text: "No, my mother and I live with my aunt", to: "q-lease-check" },
  },
  {
    id: "q-lease-check",
    beat: 2,
    say: [
      {
        kind: "bot",
        text: `No lease, noted. When you say "my mother", is that ${GUIDE.other}, the other adult on your application? Reply 1 for yes, 2 for no.`,
      },
    ],
    reply: { text: "1", to: "list" },
  },
  {
    id: "list",
    beat: 3,
    say: [
      {
        kind: "bot",
        text: `Thank you. You and ${GUIDE.other} live with your aunt and have no lease. Here is your household's list. It only has what applies to you.`,
      },
      {
        kind: "bot",
        text: `You: photo ID, Social Security card or tax ID, 2 pay stubs.\n${GUIDE.other}: photo ID, Social Security card or tax ID, 4 pay stubs.\nHousehold: proof of where you live now. With no lease, that is a signed letter from the relative you live with.`,
      },
      {
        kind: "bot",
        text: `The list is on your page too, with what counts for each one: ${LINK} The agent may ask for more after reviewing these. If they do, it comes here and to your page. Text me any question.`,
      },
    ],
    reply: { text: "what counts as a pay stub?", to: "explain" },
    page: { ready: true },
  },
  {
    id: "explain",
    beat: 4,
    say: [
      {
        kind: "bot",
        text: `A pay stub comes from your employer and shows your name, the pay period and your pay before deductions. You need 2, because you are paid every two weeks. ${GUIDE.other} is paid weekly, so she needs 4. Send your most recent ones, in a row. Your employer's payroll site usually has them the same day. (Handbook §5-4.C)`,
      },
    ],
    reply: { text: "how is my income worked out?", to: "income" },
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
        text: "I cannot tell you whether you qualify. The agent decides that, and I do not calculate it.",
      },
      {
        kind: "bot",
        text: `When you are ready to add a pay stub: please don't text me photos of documents. A text thread isn't a safe place for them. Add them on your page instead: ${LINK}`,
      },
    ],
    next: { label: "Next: she opens her page from the link", to: "upload-wrong" },
  },
  {
    id: "upload-wrong",
    beat: 5,
    say: [{ kind: "system", text: "On her page, she adds a photo for her pay stubs." }],
    next: { label: "Next: she tries again with another photo", to: "upload-right" },
    page: { demo: "stub-wrong" },
  },
  {
    id: "upload-right",
    beat: 5,
    say: [
      { kind: "system", text: "On her page, the second photo is read as a pay stub." },
      {
        kind: "bot",
        text: `Got your pay stub for Oct 12 to 25. That is {STUBS} of 2. ${GUIDE.agent} can see it too. Reply LIST any time to see where things stand.`,
      },
    ],
    reply: { text: "LIST", to: "list-status" },
    page: {
      demo: "stub-right",
      got: { "a-stubs": 1 },
      lines: { "a-stubs": "Pay stub for Oct 12 to 25 received Nov 5, 7:42 pm" },
      history: [["7:42 PM", "Pay stub for Oct 12 to Oct 25 received by the agent"]],
    },
  },
  {
    id: "list-status",
    beat: 5,
    say: [
      {
        kind: "bot",
        text: `{STATUS} Your page: ${LINK}`,
      },
    ],
    next: { label: "Next: the guide asks about the stub", to: "bonus" },
  },
  {
    id: "bonus",
    beat: 6,
    say: [
      {
        kind: "bot",
        text: "One thing on this stub: a line marked Bonus, $400. The agent will likely ask about it, because a regular bonus is counted differently from a one-time one (Handbook §5-4.C). Which is it? Reply 1 for one-time, 2 for regular.",
      },
    ],
    reply: { text: "1", to: "bonus-noted" },
  },
  {
    id: "bonus-noted",
    beat: 6,
    say: [
      {
        kind: "bot",
        text: "Noted as 1, a one-time bonus. I have attached your answer to the stub, so the agent sees it with the document and does not have to ask.",
      },
    ],
    next: { label: `Next: ${GUIDE.other}'s pay stubs`, to: "stuck" },
    page: {
      lines: { "a-stubs": "Note added Nov 5, 7:43 pm: one-time bonus" },
      history: [["7:43 PM", "Note added to the stub: one-time bonus"]],
    },
  },
  {
    id: "stuck",
    beat: 7,
    say: [
      {
        kind: "bot",
        text: `${GUIDE.other} needs 4 pay stubs, because she is paid weekly. Do you have them? Reply 1 for yes, 2 for not yet. Or just tell me.`,
      },
    ],
    reply: { text: "I can't get these in time", to: "stuck-help" },
  },
  {
    id: "stuck-help",
    beat: 7,
    say: [
      {
        kind: "bot",
        text: `That is okay. Three things. First, the rules accept a letter from her employer in place of the stubs. I only contact people on the application, so I will not text her employer. Here is a message you or ${GUIDE.other} can send them.`,
      },
      {
        kind: "draft",
        title: `Message for ${GUIDE.other}'s employer`,
        body: "Hello. I am applying for housing and need a short letter on company letterhead confirming my job, my pay rate, my usual weekly hours and my start date. I need it by Tuesday, Nov 17. Thank you.",
        copy: "Copy to send to her employer",
      },
      {
        kind: "bot",
        text: `Second, I have told ${GUIDE.agent} that you need help with this and are waiting on her employer, so they know before the deadline.`,
      },
      { kind: "system", text: `${GUIDE.agent} notified: help requested, waiting on employer` },
      {
        kind: "bot",
        text: `Third, add what you have on your page. Sending part of the set is allowed. If something is still missing on ${DUE_TEXT}, the agent has to ask you again and give you at least five more weekdays. You are not rejected outright (Handbook §4-5.D.2).`,
      },
    ],
    next: { label: "Next: proof of address", to: "lease" },
    page: {
      stuck: ["m-stubs"],
      lines: { "m-stubs": "Help requested Nov 5, 7:46 pm: waiting on her employer" },
      history: [
        ["7:46 PM", `Help requested: waiting on an employer for ${GUIDE.other}'s pay stubs`],
      ],
    },
  },
  {
    id: "lease",
    beat: 8,
    say: [
      {
        kind: "bot",
        text: "You said you live with your aunt and have no lease. A signed letter from her works. Here is one she can sign.",
      },
      {
        kind: "draft",
        title: "Letter for your relative to sign",
        body: `I confirm that ${GUIDE.applicant} and ${GUIDE.other} live with me at my address and have done so since the date written below. Name, address, date they moved in, signature and today's date.`,
        copy: "Copy to send to your relative",
      },
      {
        kind: "bot",
        text: "It does not need a notary. Since April 2025 the City no longer requires signed statements like this to be notarized.",
      },
      {
        kind: "bot",
        text: `I only contact people on the application, so I have not sent this to your aunt. Copy it and send it to her yourself. When she has signed it, add a photo of it on your page: ${LINK}`,
      },
    ],
    reply: { text: "ok, I'll send it to her", to: "proxy-ask" },
    page: {
      lines: { "h-address": "Letter drafted for your relative to sign, Nov 5, 7:48 pm" },
      history: [["7:48 PM", "Letter drafted for your relative to sign"]],
    },
  },
  {
    id: "proxy-ask",
    beat: 9,
    say: [
      {
        kind: "bot",
        text: `One more thing. You are adding documents for ${GUIDE.other} as well. She has to agree to that herself, so I have texted her on her own phone.`,
      },
    ],
    other: {
      say: [{ from: "guide", text: ASK_OTHER }],
      reply: { text: OTHER_YES, to: "proxy-done" },
    },
  },
  {
    id: "proxy-done",
    beat: 9,
    say: [
      {
        kind: "bot",
        text: `${GUIDE.other} has confirmed. You can add her documents now.`,
      },
    ],
    other: {
      say: [
        { from: "guide", text: ASK_OTHER },
        { from: "her", text: OTHER_YES },
        {
          from: "guide",
          text: "Gracias. Lo anoto como un sí. Amina ya puede añadir documentos por usted. Si quiere cambiar esto, envíe STOP.",
        },
      ],
      gloss:
        "She answered in Spanish, so the guide does too: thank you, noted as a yes. Amina may now add documents for you. To change this, text STOP.",
    },
    reply: { text: "does money my aunt sends me count as income?", to: "question" },
    page: {
      history: [
        ["7:49 PM", `${GUIDE.other} confirmed from her own phone that Amina may add her documents`],
      ],
    },
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
        text: `If the agent sees it on a bank statement they will ask what it was. You can tell them now. Reply ${numbered(DEPOSIT_OPTIONS)}. Or just tell me, with who it came from and why.`,
      },
    ],
    reply: { text: "a gift from my aunt for my birthday", to: "question-noted" },
  },
  {
    id: "question-noted",
    beat: 10,
    say: [
      {
        kind: "bot",
        text: "Recorded as 4, a gift: from your aunt, for your birthday, one time. Reply NO if I have that wrong.",
      },
      { kind: "bot", text: "I cannot tell you whether you qualify. The agent decides that." },
    ],
    reply: { text: "LIST", to: "status" },
    page: { history: [["7:52 PM", "Note recorded: gift from aunt, one time"]] },
  },
  {
    id: "status",
    beat: 11,
    say: [
      {
        kind: "bot",
        text: `{STATUS} 2 items are waiting on other people. Your page has the full list and where each one stands: ${LINK}`,
      },
      {
        kind: "bot",
        text: `What happens next: ${GUIDE.agent} reviews what you add. They may ask for more. Anything new comes here and to your page, with its own date.`,
      },
    ],
  },
];

export type Counts = { rows: [string, string][]; cite: string };

export type ListItem = {
  id: string;
  name: string;
  /** How many documents this item needs. */
  count: number;
  note?: string;
  counts: Counts;
  /** What the rules accept in its place. */
  instead: string;
  /** The text she can send the guide if she is stuck on it. */
  stuckDraft: string;
  /** How to photograph it. */
  how: string[];
};
export type ListGroup = { who: string; items: ListItem[] };

const ID_COUNTS: Counts = {
  rows: [
    [
      "What counts",
      "Any one of: a driver's license, a state non-driver ID, a passport, a military ID, or an NYC municipal ID (IDNYC).",
    ],
    [
      "Not sure",
      "The City's list does not say whether a passport from another country counts. Ask the guide and it will check with the agent.",
    ],
  ],
  cite: "The City's document list (Attachment H-1C)",
};

const SSN_COUNTS: Counts = {
  rows: [
    [
      "What counts",
      "A Social Security card, or an IRS letter showing a tax ID (ITIN). Either is accepted.",
    ],
  ],
  cite: "The City's document request",
};

const CARD_HOW = [
  "Put the whole card in the frame.",
  "No glare: tilt it away from the light.",
  "The front. Add the back too if it has one.",
];
const PAGE_HOW = [
  "Put the whole page in the frame, flat.",
  "No glare or shadow across the text.",
  "One page per photo.",
];

export const LIST: ListGroup[] = [
  {
    who: "Amina",
    items: [
      {
        id: "a-id",
        name: "Photo ID",
        count: 1,
        counts: ID_COUNTS,
        instead:
          "Any other photo ID on the City's list, such as a state non-driver ID, a passport, a military ID or an IDNYC card.",
        stuckDraft: "I can't get my photo ID",
        how: CARD_HOW,
      },
      {
        id: "a-ssn",
        name: "Social Security card or tax ID",
        count: 1,
        counts: SSN_COUNTS,
        instead:
          "An IRS letter showing a tax ID (ITIN) in place of a Social Security card, or the other way round.",
        stuckDraft: "I can't find my Social Security card",
        how: CARD_HOW,
      },
      {
        id: "a-stubs",
        name: "2 pay stubs",
        count: 2,
        note: "Paid every two weeks",
        counts: {
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
        },
        instead: "A letter from your employer confirming your job, pay rate and usual hours.",
        stuckDraft: "I can't get my pay stubs",
        how: PAGE_HOW,
      },
    ],
  },
  {
    who: GUIDE.other,
    items: [
      {
        id: "m-id",
        name: "Photo ID",
        count: 1,
        counts: ID_COUNTS,
        instead:
          "Any other photo ID on the City's list, such as a state non-driver ID, a passport, a military ID or an IDNYC card.",
        stuckDraft: "I can't get Hawa's photo ID",
        how: CARD_HOW,
      },
      {
        id: "m-ssn",
        name: "Social Security card or tax ID",
        count: 1,
        counts: SSN_COUNTS,
        instead:
          "An IRS letter showing a tax ID (ITIN) in place of a Social Security card, or the other way round.",
        stuckDraft: "I can't find Hawa's Social Security card",
        how: CARD_HOW,
      },
      {
        id: "m-stubs",
        name: "4 pay stubs",
        count: 4,
        note: "Paid weekly",
        counts: {
          rows: [
            [
              "What counts",
              "A pay stub from her employer that shows her name, the pay period and her pay before deductions.",
            ],
            ["How many", "4, because she is paid weekly. They cover one month."],
            ["How recent", "Her most recent ones, in a row, with no gap between them."],
          ],
          cite: "Handbook §5-4.C; the City's document list (Attachment H-1C)",
        },
        instead: "A letter from her employer confirming her job, pay rate and usual weekly hours.",
        stuckDraft: "I can't get Hawa's pay stubs",
        how: PAGE_HOW,
      },
    ],
  },
  {
    who: "The household",
    items: [
      {
        id: "h-address",
        name: "Proof of where you live now",
        count: 1,
        note: "No lease: a signed letter from the relative you live with",
        counts: {
          rows: [
            [
              "What counts",
              "A lease, a utility bill, or a signed letter from the person you live with.",
            ],
            ["Good to know", "No notary needed since April 2025."],
          ],
          cite: "The City's document list (Attachment H-1C)",
        },
        instead: "A signed letter from the relative you live with. No notary is needed.",
        stuckDraft: "I can't get proof of where I live",
        how: PAGE_HOW,
      },
    ],
  },
];

export const TOTAL_DOCS = LIST.reduce((n, g) => n + g.items.reduce((m, it) => m + it.count, 0), 0);
export const ALL_ITEMS = LIST.flatMap((g) => g.items);

/** What the guide says it sees when a photo is added on her page. */
export const SEEN: Record<string, string> = {
  "a-id": "a New York State driver's license",
  "a-ssn": "a Social Security card",
  "a-stubs": "a pay stub",
  "m-id": "a New York State non-driver ID",
  "m-ssn": "a Social Security card",
  "m-stubs": "a pay stub",
  "h-address": "a signed letter from the person you live with",
};
