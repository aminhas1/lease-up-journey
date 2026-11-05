import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Agent, City, Family } from "@/components/Characters";
import {
  ALL_ITEMS,
  BEATS,
  DUE2_TEXT,
  DUE_TEXT,
  FOLLOW_UP,
  GUIDE,
  LINK,
  LIST,
  NEVER,
  REVIEW_TEXT,
  SEEN,
  STEPS,
  TOTAL_DOCS,
  type ListItem,
  type Msg,
  type PagePatch,
  type Reply,
  type Step,
} from "@/data/guide";
import { GITHUB_URL } from "@/data/links";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "An AI guide for the document request: a prototype" },
      {
        name: "description",
        content:
          "A scripted text conversation, and the page where documents are added, showing how an applicant in the NYC housing lottery might be guided through a document request. Invented household, real rules.",
      },
      { property: "og:title", content: "An AI guide for the document request" },
    ],
  }),
  component: Guide,
});

/** One step of the conversation the reader has reached, and the reply that led there. */
type Turn = { stepId: string; via?: string };
type Tab = "texts" | "page" | "notes";

/** Something she did on her page, outside the script. `at` is how many turns the thread had then. */
type PageEvent = { kind: "got" | "stuck"; id: string; at: number; time: string };
/** An exchange in the thread that started on her page, not in the script. */
type Extra = { at: number; me?: string; say: Msg[] };

type PageState = {
  ready: boolean;
  expanded?: string;
  got: Record<string, number>;
  stuck: string[];
  lines: Record<string, string[]>;
  history: [string, string][];
  /** Set once the agent has reviewed the first request. `more` are the rows that led to a follow-up. */
  review?: { more: string[] };
};

type Demo = NonNullable<PagePatch["demo"]>;

/** The one control that moves the scripted path forward right now. */
type Target = "send" | "next" | "retry" | "other" | "restart";
/** What the last move changed, lit for about a second. `n` restarts the highlight on each move. */
type Lit = { n: number; rows: string[]; extra: boolean; focus: "phone" | "other" | "row" };

const GLOW = "glow-next";
const BOX_GLOW = "border-ring ring-2 ring-ring/40";

/** A brief highlight laid over whatever just changed. The parent must be `relative`. */
function Spot({ n }: { n: number }) {
  return <span key={n} aria-hidden className="spot" />;
}

const stepById = (id: string) => STEPS.find((s) => s.id === id) ?? STEPS[0]!;
const itemById = (id: string) =>
  [...ALL_ITEMS, ...FOLLOW_UP.items].find((it) => it.id === id) ?? ALL_ITEMS[0]!;
const isFollow = (id: string) => FOLLOW_UP.items.some((it) => it.id === id);
const whoOf = (id: string) => LIST.find((g) => g.items.some((it) => it.id === id))?.who ?? "";
const labelOf = (id: string) =>
  `${itemById(id).name}${whoOf(id) === GUIDE.other ? ` (${GUIDE.other})` : ""}`;
/** Times on the first day are bare ("7:42 PM"); later ones carry their own date. */
const dated = (time: string) => (time.includes(",") ? time : `Nov 5, ${time}`);
const stamp = (time: string) => dated(time).replace(/[AP]M$/, (m) => m.toLowerCase());
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Her page is her list and where it stands: fold the script and what she did on the page, in order. */
function pageAt(turns: Turn[], events: PageEvent[]): PageState {
  const page: PageState = { ready: false, got: {}, stuck: [], lines: {}, history: [] };
  const line = (id: string, text: string) => {
    page.lines[id] = [...(page.lines[id] ?? []), text];
  };
  const add = (id: string, n: number) => {
    page.got[id] = Math.min(itemById(id).count, (page.got[id] ?? 0) + n);
  };
  const stuck = (id: string) => {
    if (!page.stuck.includes(id)) page.stuck.push(id);
  };
  turns.forEach((t, i) => {
    const patch: PagePatch | undefined = stepById(t.stepId).page;
    if (patch) {
      if (patch.ready) page.ready = true;
      if (patch.expanded) page.expanded = patch.expanded;
      if (patch.review) page.review = patch.review;
      for (const [id, n] of Object.entries(patch.got ?? {})) add(id, n);
      for (const id of patch.stuck ?? []) stuck(id);
      for (const [id, text] of Object.entries(patch.lines ?? {})) line(id, text);
      if (patch.history) page.history.push(...patch.history);
    }
    for (const e of events) {
      if (e.at !== i + 1) continue;
      if (e.kind === "got") {
        add(e.id, 1);
        line(e.id, `Received ${stamp(e.time)}`);
        page.history.push([e.time, `${labelOf(e.id)} received by the agent`]);
      } else {
        stuck(e.id);
        line(e.id, `Help requested ${stamp(e.time)}`);
        page.history.push([e.time, `Help requested: ${labelOf(e.id)}`]);
      }
    }
  });
  return page;
}

const receivedCount = (page: PageState) =>
  ALL_ITEMS.reduce((n, it) => n + Math.min(it.count, page.got[it.id] ?? 0), 0);
/** How many of the things asked for after review are fully in. */
const followDone = (page: PageState) =>
  FOLLOW_UP.items.filter((it) => (page.got[it.id] ?? 0) >= it.count).length;

const WAITING = "Waiting";
const RECEIVED = "Received by the agent";
const STUCK = "Help requested";
const REVIEWED = "Reviewed by the agent";
const MORE = "Agent needs more";

function rowState(it: ListItem, page: PageState) {
  const got = page.got[it.id] ?? 0;
  if (page.review?.more.includes(it.id)) return MORE;
  if (got >= it.count) return page.review && !isFollow(it.id) ? REVIEWED : RECEIVED;
  if (page.stuck.includes(it.id)) return STUCK;
  if (got > 0) return it.count - got === 1 ? "Needs another" : `Needs ${it.count - got} more`;
  return WAITING;
}

function statePill(state: string) {
  if (state === RECEIVED || state === REVIEWED) return "border-city/30 bg-city-soft text-city";
  if (state === WAITING) return "border-border/30 bg-muted text-muted-foreground";
  if (state === STUCK) return "border-agt/40 bg-agt-soft text-foreground";
  return "border-harm bg-harm-soft text-foreground";
}

/** A text body. The link to her page is tappable and switches to the page. */
function TextBody({ text, onLink }: { text: string; onLink: () => void }) {
  const parts = text.split(LINK);
  return (
    <span className="whitespace-pre-line">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <button
              onClick={onLink}
              className="font-semibold text-agt underline underline-offset-2"
            >
              {LINK}
            </button>
          )}
        </span>
      ))}
    </span>
  );
}

/** A text the guide drafted for someone it will not contact. She copies it and sends it herself. */
function Draft({ m }: { m: Extract<Msg, { kind: "draft" }> }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = () => {
    // The clipboard can be refused; the sketch still shows the confirmation.
    if ("clipboard" in navigator) navigator.clipboard.writeText(m.body).catch(() => undefined);
    setCopied(true);
  };
  return (
    <div className="max-w-[88%]">
      <div className="rounded-2xl rounded-bl-sm border border-border/30 bg-secondary px-3 py-2 text-sm">
        <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {m.title}
        </div>
        <p className="mt-1 border-l-2 border-border/40 pl-2">{m.body}</p>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          title="On a phone she would press and hold the message to copy it"
          className="rounded-full border border-border bg-card px-2.5 py-0.5 font-display text-[11px] font-semibold shadow-sm transition active:translate-y-0.5"
        >
          {m.copy}
        </button>
        {copied && (
          <span
            role="status"
            className="animate-pop-in font-display text-[11px] font-bold text-city"
          >
            Copied
          </span>
        )}
      </div>
    </div>
  );
}

function Message({ m, onLink }: { m: Msg; onLink: () => void }) {
  switch (m.kind) {
    case "bot":
      return (
        <div className="max-w-[88%]">
          <div className="inline-block rounded-2xl rounded-bl-sm border border-border/30 bg-secondary px-3 py-2 text-sm">
            <TextBody text={m.text} onLink={onLink} />
          </div>
        </div>
      );
    case "system":
      return (
        <div className="mx-auto max-w-[92%] rounded-xl border border-dashed border-border/40 px-3 py-1 text-center text-[11px] text-muted-foreground">
          {m.text}
        </div>
      );
    case "draft":
      return <Draft m={m} />;
  }
}

/** The other adult's own thread with the guide, on her own phone. */
function OtherPhone({
  thread,
  glow,
  lit,
  onSend,
}: {
  thread: NonNullable<Step["other"]>;
  glow: boolean;
  lit: Lit | null;
  onSend: (r: Reply) => void;
}) {
  const reply = thread.reply;
  const newest = thread.say.length - 1;
  return (
    <div data-other-phone className="animate-pop-in mx-auto w-full max-w-[320px] scroll-mt-28">
      <div className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
        On {GUIDE.other}'s phone
      </div>
      <div className="flex flex-col overflow-hidden rounded-[1.75rem] border-2 border-border bg-card shadow-sm">
        <div className="border-b border-border/40 bg-secondary px-3 py-1.5 text-center leading-tight">
          <div className="font-display text-xs font-bold">{GUIDE.agent}</div>
          <div className="text-[10px] text-muted-foreground">Text message · automated guide</div>
        </div>
        <div className="space-y-2 bg-background px-3 py-3 text-[13px]">
          {thread.say.map((m, i) =>
            m.from === "guide" ? (
              <div key={i} className="relative max-w-[88%]">
                <div className="inline-block rounded-2xl rounded-bl-sm border border-border/30 bg-secondary px-3 py-2">
                  {m.text}
                </div>
                {lit && i === newest && <Spot n={lit.n} />}
              </div>
            ) : (
              <div key={i} className="relative flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
                  {m.text}
                </div>
                {lit && i === newest && <Spot n={lit.n} />}
              </div>
            ),
          )}
        </div>
        <div className="flex items-end gap-2 border-t border-border/40 bg-card p-2.5">
          <div
            className={`min-w-0 flex-1 break-words rounded-2xl border px-3 py-1.5 text-[13px] ${reply ? `bg-card ${glow ? BOX_GLOW : "border-border"}` : "border-border/40 bg-background text-muted-foreground"}`}
          >
            {reply?.text ?? "Text message"}
          </div>
          <button
            onClick={() => reply && onSend(reply)}
            disabled={!reply}
            className={`whitespace-nowrap rounded-full border border-border bg-primary px-3 py-1.5 font-display text-xs font-semibold text-primary-foreground shadow-sm transition active:translate-y-0.5 disabled:opacity-30 ${glow && reply ? GLOW : ""}`}
          >
            Send
          </button>
        </div>
      </div>
      {thread.gloss && <p className="mt-2 text-[11px] text-muted-foreground">{thread.gloss}</p>}
    </div>
  );
}

/** A drawn stand-in for the photo she just took. No real image is taken or stored. */
function Shot({ kind, cropped }: { kind: "card" | "page" | "statement"; cropped?: boolean }) {
  return (
    <div
      aria-hidden
      className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted"
    >
      {kind === "card" ? (
        <div
          className={`flex h-11 w-[72px] gap-1.5 rounded border border-border/50 bg-card p-1.5 ${cropped ? "translate-y-7" : ""}`}
        >
          <div className="h-5 w-4 rounded-sm bg-border/40" />
          <div className="flex-1 space-y-1">
            <div className="h-1 w-full rounded bg-border/40" />
            <div className="h-1 w-8 rounded bg-border/25" />
            <div className="h-1 w-6 rounded bg-border/25" />
          </div>
        </div>
      ) : (
        <div className="h-[68px] w-14 rounded-sm border border-border/50 bg-card p-1.5">
          <div className="h-1 w-7 rounded bg-border/40" />
          {kind === "statement" ? (
            <div className="mt-1.5 space-y-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-1">
                  <div className="h-1 flex-1 rounded bg-border/25" />
                  <div className="h-1 w-2 rounded bg-border/25" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-1.5 space-y-1">
              <div className="h-1 w-full rounded bg-border/25" />
              <div className="h-1 w-9 rounded bg-border/25" />
              <div className="mt-2 h-1 w-full rounded bg-border/25" />
              <div className="h-1 w-6 rounded bg-border/25" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PILL =
  "rounded-full border border-border px-3 py-1 font-display text-xs font-semibold shadow-sm transition active:translate-y-0.5";
const PANEL = "animate-pop-in mt-2 rounded-xl border border-border bg-secondary/50 p-3";

type Panel = { id: string; kind: "add" | "counts" | "stuck"; stage: "how" | "retry" | "done" };

/** Her page: a list of the documents that are waiting, plus one line on where it stands. */
function HerPage({
  page,
  demo,
  flash,
  glowRetry,
  lit,
  onAdd,
  onStuck,
  onTextGuide,
  onDemoRetry,
}: {
  page: PageState;
  demo: Demo | undefined;
  flash: boolean;
  glowRetry: boolean;
  lit: Lit | null;
  onAdd: (id: string) => void;
  onStuck: (id: string) => void;
  onTextGuide: (id?: string) => void;
  onDemoRetry: () => void;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [history, setHistory] = useState(false);
  const [person, setPerson] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  // The conversation can open an item ("What counts as a pay stub?").
  useEffect(() => {
    if (page.expanded) setPanel({ id: page.expanded, kind: "counts", stage: "how" });
  }, [page.expanded]);

  // The pay stub exchange happens here, so bring it into view.
  useEffect(() => {
    if (demo) {
      setPanel(null);
      demoRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [demo]);

  const toggle = (id: string, kind: Panel["kind"]) =>
    setPanel(panel?.id === id && panel.kind === kind ? null : { id, kind, stage: "how" });

  const got = receivedCount(page);
  const groups = page.review ? [...LIST, FOLLOW_UP] : LIST;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-card shadow-sm transition ${flash ? "border-agt ring-4 ring-agt/40" : "border-border"}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-border/40 bg-secondary px-3 py-1.5 text-[11px] text-muted-foreground">
        <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-city" />
        <span className="truncate font-mono">{LINK}</span>
        <span className="min-[420px]:ml-auto">No app. Opens with a code texted to your phone.</span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold leading-tight">Your documents</h2>
            <div className="text-xs text-muted-foreground">
              {GUIDE.building} · {GUIDE.agent}, marketing agent · log number {GUIDE.log}
            </div>
          </div>
          <Agent className="h-9 w-11 shrink-0" />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-harm bg-harm-soft px-3 py-2 text-sm">
          <span className="min-w-[12rem] flex-1 font-display font-bold">
            {page.review
              ? `${GUIDE.agent} reviewed your documents on ${REVIEW_TEXT} and asked for ${FOLLOW_UP.items.length} more things. ${followDone(page)} of ${FOLLOW_UP.items.length} received · due ${DUE2_TEXT}`
              : `${page.ready ? `${got} of ${TOTAL_DOCS} received · ` : ""}10 weekdays left · due ${DUE_TEXT}`}
          </span>
          <button onClick={() => onTextGuide()} className={`${PILL} bg-card`}>
            Text the guide
          </button>
        </div>

        {!page.ready ? (
          <p className="mt-4 rounded-xl border border-dashed border-border/40 p-4 text-sm text-muted-foreground">
            A few questions by text first, then your list appears here.
          </p>
        ) : (
          <div key="list" className="animate-pop-in">
            {!page.review && (
              <p className="mt-2 text-xs text-muted-foreground">
                This is the first request. {GUIDE.agent} may ask for more after they review it.
              </p>
            )}
            <h3 className="mt-4 font-display text-sm font-bold">First request</h3>
            {groups.map((g) => (
              <div
                key={g.who}
                className={g === FOLLOW_UP ? "mt-5 border-t border-border/40 pt-4" : "mt-3"}
              >
                {g === FOLLOW_UP ? (
                  <>
                    <h3 className="font-display text-sm font-bold">{g.who}</h3>
                    <p className="text-xs text-muted-foreground">
                      {GUIDE.agent} asked for these on {REVIEW_TEXT}. Due {DUE2_TEXT}.
                    </p>
                  </>
                ) : (
                  <div className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {g.who}
                  </div>
                )}
                <ul className="mt-1 divide-y divide-border/20">
                  {g.items.map((it) => {
                    const state = rowState(it, page);
                    const have = page.got[it.id] ?? 0;
                    const done = have >= it.count;
                    const told = page.stuck.includes(it.id);
                    const mine = panel?.id === it.id ? panel : null;
                    const inDemo = demo && it.id === "a-stubs";
                    const kind = it.how[0]?.includes("card") ? "card" : "page";
                    return (
                      <li
                        key={it.id}
                        data-row={it.id}
                        className="relative scroll-mt-28 py-2.5 text-sm"
                      >
                        {lit?.rows.includes(it.id) && <Spot n={lit.n} />}
                        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                          <span className="min-w-0">
                            {it.name}
                            {it.note && (
                              <span className="block text-xs text-muted-foreground">{it.note}</span>
                            )}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 font-display text-[11px] font-bold ${statePill(state)}`}
                          >
                            {state}
                          </span>
                        </div>
                        {it.reason && (
                          <p className="mt-1 flex items-start gap-1.5 text-xs">
                            <Agent className="h-5 w-6 shrink-0" />
                            <span>
                              {GUIDE.agent}: {it.reason}
                            </span>
                          </p>
                        )}
                        {(page.lines[it.id] ?? []).map((l, i) => (
                          <div
                            key={i}
                            className="mt-0.5 font-mono text-[11px] text-muted-foreground"
                          >
                            {l}
                          </div>
                        ))}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-xs font-semibold text-muted-foreground">
                          {!done && !inDemo && (
                            <button
                              onClick={() => toggle(it.id, "add")}
                              aria-expanded={mine?.kind === "add"}
                              className={`${PILL} bg-primary text-primary-foreground`}
                            >
                              {have > 0 ? "Add another" : "Add"}
                            </button>
                          )}
                          <button
                            onClick={() => toggle(it.id, "counts")}
                            aria-expanded={mine?.kind === "counts"}
                            className="underline underline-offset-2"
                          >
                            What counts
                          </button>
                          {!done && !it.reason && (
                            <button
                              onClick={() => toggle(it.id, "stuck")}
                              aria-expanded={mine?.kind === "stuck"}
                              className="underline underline-offset-2"
                            >
                              I can't get this
                            </button>
                          )}
                        </div>

                        {inDemo && (
                          <div ref={demoRef} className={`${PANEL} flex gap-3`}>
                            <Shot kind={demo === "stub-wrong" ? "statement" : "page"} />
                            {demo === "stub-wrong" ? (
                              <div className="min-w-0">
                                <p>
                                  This looks like a bank statement, not a pay stub. A pay stub shows
                                  your employer, the pay period and your pay before deductions.
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Nothing has been sent to {GUIDE.agent}.
                                </p>
                                <button
                                  onClick={onDemoRetry}
                                  className={`${PILL} mt-2 bg-primary text-primary-foreground ${glowRetry ? GLOW : ""}`}
                                >
                                  Try again
                                </button>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <p>
                                  This looks like a pay stub for Oct 12 to Oct 25. That is {have} of{" "}
                                  {it.count}. Sent to {GUIDE.agent}. They decide whether it is
                                  accepted.
                                </p>
                                <button
                                  onClick={() => onTextGuide()}
                                  className={`${PILL} mt-2 bg-card`}
                                >
                                  Back to my texts
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {mine?.kind === "add" && !inDemo && (
                          <div className={PANEL}>
                            {mine.stage === "how" && (
                              <>
                                <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Before you take the photo
                                </div>
                                <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                                  {it.how.map((h) => (
                                    <li key={h}>{h}</li>
                                  ))}
                                </ol>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      if (it.id === "a-id") {
                                        setPanel({ ...mine, stage: "retry" });
                                      } else {
                                        onAdd(it.id);
                                        setPanel({ ...mine, stage: "done" });
                                      }
                                    }}
                                    className={`${PILL} bg-primary text-primary-foreground`}
                                  >
                                    Take a photo
                                  </button>
                                  <button
                                    onClick={() => setPanel(null)}
                                    className={`${PILL} bg-card`}
                                  >
                                    Not now
                                  </button>
                                </div>
                              </>
                            )}
                            {mine.stage === "retry" && (
                              <div className="flex gap-3">
                                <Shot kind="card" cropped />
                                <div className="min-w-0">
                                  <p>
                                    I can't read the bottom edge. Try again with the whole card in
                                    the frame.
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Nothing has been sent to {GUIDE.agent}.
                                  </p>
                                  <button
                                    onClick={() => {
                                      onAdd(it.id);
                                      setPanel({ ...mine, stage: "done" });
                                    }}
                                    className={`${PILL} mt-2 bg-primary text-primary-foreground`}
                                  >
                                    Try again
                                  </button>
                                </div>
                              </div>
                            )}
                            {mine.stage === "done" && (
                              <div className="flex gap-3">
                                <Shot kind={kind} />
                                <div className="min-w-0">
                                  <p>
                                    This looks like {SEEN[it.id] ?? "the right document"}.
                                    {it.id === "a-id"
                                      ? " I could read the name and the expiry date."
                                      : ""}{" "}
                                    Sent to {GUIDE.agent}. They decide whether it is accepted.
                                  </p>
                                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                    {(page.lines[it.id] ?? []).at(-1)}
                                  </p>
                                  <button
                                    onClick={() => setPanel(null)}
                                    className={`${PILL} mt-2 bg-card`}
                                  >
                                    Back to the list
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {mine?.kind === "counts" && (
                          <div className={PANEL}>
                            <dl className="space-y-2">
                              {it.counts.rows.map(([k, v]) => (
                                <div key={k}>
                                  <dt className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {k}
                                  </dt>
                                  <dd>{v}</dd>
                                </div>
                              ))}
                            </dl>
                            <div className="mt-2 flex items-center gap-1.5 border-t border-dotted border-border/40 pt-2 text-[11px] text-muted-foreground">
                              {it.reason ? (
                                <Agent className="h-5 w-6 shrink-0" />
                              ) : (
                                <City className="h-5 w-6 shrink-0" />
                              )}
                              <span className="font-mono">{it.counts.cite}</span>
                            </div>
                          </div>
                        )}

                        {mine?.kind === "stuck" && (
                          <div className={PANEL}>
                            <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              What the rules accept instead
                            </div>
                            <p className="mt-1">{it.instead}</p>
                            {told && (
                              <p className="animate-pop-in mt-2 rounded-lg border border-agt/40 bg-agt-soft px-2 py-1.5">
                                {GUIDE.agent} knows you need help with this. You have not lost your
                                place.
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {!told && (
                                <button
                                  onClick={() => onStuck(it.id)}
                                  className={`${PILL} bg-primary text-primary-foreground`}
                                >
                                  Tell the agent I need help with this
                                </button>
                              )}
                              <button
                                onClick={() => onTextGuide(it.id)}
                                className={`${PILL} bg-card`}
                              >
                                Text the guide about this
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/20 pt-3 font-display text-xs font-semibold text-muted-foreground">
          {page.ready && (
            <button
              onClick={() => setHistory((h) => !h)}
              aria-expanded={history}
              className="underline underline-offset-2"
            >
              History ({page.history.length})
            </button>
          )}
          <button
            onClick={() => setPerson((p) => !p)}
            aria-expanded={person}
            className="underline underline-offset-2"
          >
            Talk to a person
          </button>
        </div>
        {page.ready && history && (
          <div className="animate-pop-in mt-2 text-xs">
            {page.history.length === 0 ? (
              <p className="text-muted-foreground">
                Nothing yet. Each document you add gets a dated line here.
              </p>
            ) : (
              <ol>
                {page.history.map(([t, text], i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[auto_1fr] gap-2 border-t border-dotted border-border/40 py-1"
                  >
                    <span className="font-mono text-muted-foreground">{dated(t)}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
        {person && (
          <div className="animate-pop-in mt-2 rounded-xl border border-border bg-secondary/50 p-3 text-sm">
            <p>
              Call or text 212-555-0142, Monday to Friday, 9 to 5. You can also ask for an
              appointment in person, with a free interpreter, in the evening or at the weekend.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Everything you have added goes with you. You will not have to start again.
            </p>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Only {GUIDE.agent} can see what you add here.
        </p>
      </div>
    </div>
  );
}

function Guide() {
  const [turns, setTurns] = useState<Turn[]>([{ stepId: "hello" }]);
  // What she does on her page outside the script, and the texts that follow from it.
  const [events, setEvents] = useState<PageEvent[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  // A reply started from her page, waiting in the type box.
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  // Which of the step's pre-typed replies is in the box: the main one, or the alternative.
  const [choice, setChoice] = useState(0);
  const [tab, setTab] = useState<Tab>("texts");
  const [flash, setFlash] = useState<"texts" | "page" | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [lit, setLit] = useState<Lit | null>(null);
  const litCount = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);

  const current = stepById(turns[turns.length - 1]!.stepId);
  const beat = BEATS.find((b) => b.n === current.beat) ?? BEATS[0]!;
  const page = pageAt(turns, events);
  const now = page.history[page.history.length - 1]?.[0] ?? "7:40 PM";

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length, extras.length]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(id);
  }, [flash]);

  // After a move, bring what changed into view and let the highlight fade.
  useEffect(() => {
    if (!lit) return;
    const shown = (sel: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(sel)).find(
        (el) => el.offsetParent !== null,
      );
    const el =
      lit.focus === "row"
        ? shown(`[data-row="${lit.rows[0]}"]`)
        : lit.focus === "other"
          ? shown("[data-other-phone]")
          : phone.current;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const id = setTimeout(() => setLit(null), 1200);
    return () => clearTimeout(id);
  }, [lit]);

  const openPage = () => {
    setTab("page");
    setFlash("page");
  };
  const openTexts = () => {
    setTab("texts");
    setFlash("texts");
  };
  const go = (to: string, via?: string) => {
    // Steps that happen on her page are not texts from her, so they leave no bubble.
    const onPage = Boolean(stepById(to).page?.demo ?? stepById(to).page?.show);
    setTurns((t) => [...t, onPage || via === undefined ? { stepId: to } : { stepId: to, via }]);
    setDraft(null);
    setChoice(0);
    if (onPage) openPage();
  };
  const back = () => {
    if (turns.length <= 1) return;
    const n = turns.length - 1;
    setTurns(turns.slice(0, n));
    setChoice(0);
    setEvents((ev) => ev.map((e) => (e.at > n ? { ...e, at: n } : e)));
    setExtras((ex) => ex.map((e) => (e.at > n ? { ...e, at: n } : e)));
  };
  const restart = () => {
    setTurns([{ stepId: "hello" }]);
    setEvents([]);
    setExtras([]);
    setDraft(null);
    setChoice(0);
    setEpoch((e) => e + 1);
  };
  /** Light up what a move changed: the new text, and any row of her list the step touched. */
  const spot = (to?: string) => {
    const s = to ? stepById(to) : undefined;
    const patch = s?.page;
    const onPage = Boolean(patch?.demo ?? patch?.show);
    const rows = patch?.review
      ? [...patch.review.more, ...FOLLOW_UP.items.map((it) => it.id)]
      : patch
        ? [
            ...new Set([
              ...(patch.demo ? ["a-stubs"] : []),
              ...(patch.show ? [patch.show] : []),
              ...Object.keys(patch.got ?? {}),
              ...(patch.stuck ?? []),
              ...Object.keys(patch.lines ?? {}),
              ...(patch.expanded ? [patch.expanded] : []),
            ]),
          ]
        : [];
    if (!onPage) setTab("texts");
    litCount.current += 1;
    setLit({
      n: litCount.current,
      rows,
      extra: !to,
      focus: onPage ? "row" : s?.other ? "other" : "phone",
    });
  };
  /** A scripted move, from the control that glows or from Next step. */
  const move = (to: string, via?: string) => {
    go(to, via);
    spot(to);
  };

  const addOnPage = (id: string) => {
    const at = turns.length;
    const forWho = whoOf(id) === GUIDE.other ? ` for ${GUIDE.other}` : "";
    setEvents((ev) => [...ev, { kind: "got", id, at, time: now }]);
    setExtras((ex) => [
      ...ex,
      {
        at,
        say: [
          { kind: "system", text: `Added on her page: ${labelOf(id)}` },
          {
            kind: "bot",
            text: `Got it. ${itemById(id).name}${forWho} received. ${GUIDE.agent} can see it too. Reply LIST any time to see where things stand.`,
          },
        ],
      },
    ]);
  };
  const stuckOnPage = (id: string) => {
    const at = turns.length;
    setEvents((ev) => [...ev, { kind: "stuck", id, at, time: now }]);
    setExtras((ex) => [
      ...ex,
      {
        at,
        say: [
          { kind: "system", text: `${GUIDE.agent} notified: help requested with ${labelOf(id)}` },
        ],
      },
    ]);
  };
  const textGuide = (id?: string) => {
    if (id) setDraft({ id, text: itemById(id).stuckDraft });
    openTexts();
  };
  const sendDraft = () => {
    if (!draft) return;
    const next = page.stuck.includes(draft.id)
      ? `${GUIDE.agent} already knows you need help with this, so you have not lost your place.`
      : `If none of that works, tap "Tell the agent I need help with this" on your page and ${GUIDE.agent} will know before the deadline: ${LINK}`;
    setExtras((ex) => [
      ...ex,
      {
        at: turns.length,
        me: draft.text,
        say: [
          {
            kind: "bot",
            text: `The rules also accept ${lowerFirst(itemById(draft.id).instead)} ${next} Or reply PERSON to reach someone.`,
          },
        ],
      },
    ]);
    setDraft(null);
  };

  /** LIST and the stub receipt are counted as of that point in the thread, page uploads included. */
  const fill = (text: string, i: number) => {
    if (!text.includes("{")) return text;
    const then = pageAt(
      turns.slice(0, i + 1),
      events.filter((e) => e.at <= i),
    );
    return text
      .replace(
        "{STATUS}",
        then.review
          ? `${GUIDE.agent} reviewed your first request on ${REVIEW_TEXT} and asked for ${FOLLOW_UP.items.length} more things. ${followDone(then)} of ${FOLLOW_UP.items.length} received. Due ${DUE2_TEXT}.`
          : `${receivedCount(then)} of ${TOTAL_DOCS} documents received. 10 weekdays left, due ${DUE_TEXT}.`,
      )
      .replace("{FOLLOW}", String(followDone(then)))
      .replace("{STUBS}", String(then.got["a-stubs"] ?? 0));
  };

  const show = (t: Tab) => `${tab === t ? "" : "hidden"} min-[920px]:block`;
  // A text message has no buttons: her reply is already typed and the viewer presses Send.
  const options = [current.reply, current.alt].filter((r): r is Reply => Boolean(r));
  const picked = options[choice] ?? options[0];
  const unpicked = options.length > 1 ? options[choice === 0 ? 1 : 0] : undefined;
  const boxText = draft?.text ?? picked?.text;
  const swap = draft
    ? picked && { text: picked.text, pick: () => setDraft(null) }
    : unpicked && { text: unpicked.text, pick: () => setChoice(choice === 0 ? 1 : 0) };
  const send = () => {
    if (draft) {
      sendDraft();
      spot();
    } else if (picked) move(picked.to, picked.text);
  };
  // A move that is not a text from her: she opens her page, or the guide texts first.
  const next = current.next;
  const followLink = () => {
    if (next && stepById(next.to).page?.demo) go(next.to);
    else openPage();
  };
  const atEnd = !picked && !next && !current.other?.reply && !draft;
  const otherReply = current.other?.reply;
  // Exactly one control moves the script forward at any moment. It glows, and Next step presses it.
  const target: Target =
    draft || picked
      ? "send"
      : otherReply
        ? "other"
        : next
          ? current.page?.demo === "stub-wrong"
            ? "retry"
            : "next"
          : "restart";
  // On a small screen the glowing control can be on another tab; then the tab that leads to it glows.
  const targetTab: Tab = target === "retry" ? "page" : "texts";
  const advance = () => {
    if (target === "send") send();
    else if (otherReply) move(otherReply.to);
    else if (next) move(next.to);
    else {
      restart();
      spot("hello");
    }
  };
  const lastExtra = extras.reduce((last, x, k) => (x.at === turns.length ? k : last), -1);
  const stepButtons = (
    <div className="ml-auto flex items-center gap-1">
      <button
        onClick={back}
        disabled={turns.length === 1}
        className="rounded-full px-2.5 py-1.5 font-display text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline disabled:opacity-40 disabled:hover:no-underline"
      >
        Back
      </button>
      <button
        onClick={advance}
        className="whitespace-nowrap rounded-full border border-border bg-primary px-4 py-1.5 font-display text-sm font-semibold text-primary-foreground shadow-sm transition active:translate-y-0.5"
      >
        {target === "restart" ? "Start over" : "Next step"}
      </button>
    </div>
  );

  return (
    <main className="min-h-screen px-4 pb-16">
      <div className="mx-auto max-w-7xl">
        <nav className="flex flex-wrap gap-x-5 gap-y-1 pt-6 font-display text-sm font-semibold text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            ← The journey map
          </Link>
        </nav>

        <header className="pt-4 pb-6">
          <div className="inline-block rounded-full border border-dashed border-border bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-sm">
            Prototype · invented household · a sketch of the PRD
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            An AI guide for the document request
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {GUIDE.applicant}'s number has come up for {GUIDE.building}. She is doing the documents
            for herself and her mother, Hawa. She answers the guide by text. Her documents go on her
            own page, which is only her list and where it stands. A first version would be the texts
            plus a secure link for adding documents. Her replies are already typed in the text box:
            press Send to follow one path. The notes say which problem each moment answers and the
            rule behind it.
          </p>
        </header>

        {/* Small screens: one surface at a time. */}
        <div className="sticky top-0 z-20 -mx-4 mb-1 bg-background/95 px-4 py-2 backdrop-blur min-[1240px]:hidden">
          <div
            role="tablist"
            className="mb-2 grid grid-cols-3 gap-1 rounded-full border border-border bg-card p-1 min-[920px]:hidden"
          >
            {(
              [
                ["texts", "Texts"],
                ["page", "Her page"],
                ["notes", "Notes"],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-full px-2 py-1.5 font-display text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"} ${k === targetTab && tab !== k ? GLOW : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pl-1">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Beat {beat.n} of {BEATS.length}
            </span>
            {stepButtons}
          </div>
        </div>

        <div className="grid items-start gap-6 min-[920px]:grid-cols-[minmax(0,380px)_minmax(0,1fr)] min-[1240px]:grid-cols-[minmax(0,380px)_minmax(0,400px)_minmax(0,1fr)]">
          {/* Her texts */}
          <div className={show("texts")}>
            <div className="mb-2 hidden font-display text-xs font-bold uppercase tracking-widest text-muted-foreground min-[920px]:block">
              Her texts
            </div>
            <div
              ref={phone}
              className={`mx-auto flex h-[640px] max-h-[80vh] w-full max-w-[420px] scroll-mt-28 flex-col overflow-hidden rounded-[2rem] border-2 bg-card shadow-sm transition ${flash === "texts" ? "border-agt ring-4 ring-agt/40" : "border-border"}`}
            >
              <div className="border-b border-border/40 bg-secondary px-3 py-2 text-center leading-tight">
                <div className="font-display text-sm font-bold">{GUIDE.agent}</div>
                <div className="text-[11px] text-muted-foreground">
                  Text message · automated guide · reply PERSON to reach someone
                </div>
              </div>

              <div
                ref={scroller}
                className="flex-1 space-y-2 overflow-y-auto bg-background px-3 py-3"
              >
                {turns.map((t, i) => {
                  const s = stepById(t.stepId);
                  const last = i === turns.length - 1;
                  return (
                    <div key={i} className={`relative space-y-2 ${last ? "animate-pop-in" : ""}`}>
                      {lit && last && !lit.extra && <Spot n={lit.n} />}
                      {t.via && (
                        <div className="flex items-end justify-end gap-1.5">
                          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                            {t.via}
                          </div>
                          <Family className="h-6 w-8 shrink-0" />
                        </div>
                      )}
                      {s.say.map((m, j) => (
                        <Message
                          key={j}
                          m={m.kind === "bot" ? { ...m, text: fill(m.text, i) } : m}
                          onLink={followLink}
                        />
                      ))}
                      {extras
                        .filter((x) => x.at === i + 1)
                        .map((x, k) => (
                          <div key={`x${k}`} className="relative space-y-2">
                            {lit?.extra && extras.indexOf(x) === lastExtra && <Spot n={lit.n} />}
                            {x.me && (
                              <div className="flex items-end justify-end gap-1.5">
                                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                                  {x.me}
                                </div>
                                <Family className="h-6 w-8 shrink-0" />
                              </div>
                            )}
                            {x.say.map((m, j) => (
                              <Message key={j} m={m} onLink={followLink} />
                            ))}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border/40 bg-card p-3">
                {atEnd ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>That is the end of this path.</span>
                    <button
                      onClick={advance}
                      className={`rounded-full border border-border bg-accent px-3 py-1.5 font-display text-sm font-semibold text-foreground shadow-sm ${GLOW}`}
                    >
                      Start over
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <div
                      className={`min-w-0 flex-1 break-words rounded-2xl border px-3 py-2 text-sm ${boxText ? `bg-card ${BOX_GLOW}` : "border-border/40 bg-background text-muted-foreground"}`}
                    >
                      {boxText ?? "Text message"}
                    </div>
                    <button
                      onClick={send}
                      disabled={!boxText}
                      className={`whitespace-nowrap rounded-full border border-border bg-primary px-3 py-2 font-display text-sm font-semibold text-primary-foreground shadow-sm transition active:translate-y-0.5 disabled:opacity-30 ${boxText ? GLOW : ""}`}
                    >
                      Send
                    </button>
                  </div>
                )}
                {!atEnd && swap && (
                  <button
                    onClick={swap.pick}
                    className="mt-2 text-left text-[11px] text-muted-foreground underline underline-offset-2"
                  >
                    or send: {swap.text}
                  </button>
                )}
              </div>
            </div>

            {next && (
              <button
                onClick={() => move(next.to)}
                className={`mx-auto mt-3 block w-full max-w-[420px] rounded-full border border-dashed border-border bg-accent px-3 py-2 font-display text-sm font-semibold shadow-sm transition active:translate-y-0.5 ${target === "next" ? GLOW : ""}`}
              >
                {next.label}
              </button>
            )}
            {current.other?.reply && (
              <p className="mx-auto mt-3 max-w-[420px] text-center text-sm font-semibold">
                Waiting on {GUIDE.other}. Press Send on {GUIDE.other}'s phone.
              </p>
            )}
            {current.other && (
              <div className="mt-5 min-[920px]:hidden">
                <OtherPhone
                  thread={current.other}
                  glow={target === "other"}
                  lit={lit}
                  onSend={(r) => move(r.to)}
                />
              </div>
            )}
            <p className="mx-auto mt-3 max-w-[420px] text-center text-[11px] text-muted-foreground">
              Her replies are pre-typed for this sketch. Press Send to follow one path.
            </p>

            <div className="mx-auto mt-3 flex max-w-[420px] items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={turns.length === 1}
                className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 font-display text-sm font-semibold shadow-sm disabled:opacity-40"
              >
                ← Back
              </button>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Beat {beat.n} of {BEATS.length}
              </span>
              <button
                onClick={restart}
                disabled={turns.length === 1}
                className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 font-display text-sm font-semibold shadow-sm disabled:opacity-40"
              >
                Start over
              </button>
            </div>
          </div>

          {/* Her page */}
          <div className={show("page")}>
            {current.other && (
              <div className="mb-6 hidden min-[920px]:block">
                <OtherPhone
                  thread={current.other}
                  glow={target === "other"}
                  lit={lit}
                  onSend={(r) => move(r.to)}
                />
              </div>
            )}
            <div className="mb-2 hidden font-display text-xs font-bold uppercase tracking-widest text-muted-foreground min-[920px]:block">
              Her page · just the list and where it stands
            </div>
            <HerPage
              key={epoch}
              page={page}
              demo={current.page?.demo}
              flash={flash === "page"}
              glowRetry={target === "retry"}
              lit={lit}
              onAdd={addOnPage}
              onStuck={stuckOnPage}
              onTextGuide={textGuide}
              onDemoRetry={() => move("upload-right")}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              The page opens from the link in her texts, with a code sent to her phone. Documents
              are added here, not sent as photos in the thread. Texting LIST sends the link again
              with a one-line status.
            </p>
          </div>

          {/* Notes */}
          <aside
            className={`space-y-4 min-[920px]:col-span-2 min-[1240px]:col-span-1 ${show("notes")}`}
          >
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  What the guide is doing · beat {beat.n} of {BEATS.length}
                </div>
                {stepButtons}
              </div>
              <div key={beat.n} className="animate-pop-in">
                <h2 className="mt-1 text-2xl font-bold">{beat.title}</h2>
                <div className="mt-2 flex gap-1" aria-hidden>
                  {BEATS.map((b) => (
                    <span
                      key={b.n}
                      className={`h-1.5 flex-1 rounded-full ${b.n === beat.n ? "bg-primary" : b.n < beat.n ? "bg-primary/35" : "bg-border/20"}`}
                    />
                  ))}
                </div>
                <ul className="mt-4 space-y-3">
                  {beat.notes.map((n) => (
                    <li
                      key={n.finding}
                      className="rounded-xl border border-border bg-secondary/50 p-3 text-sm"
                    >
                      <p className="font-semibold">{n.finding}</p>
                      {n.rule && (
                        <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                          <City className="h-6 w-8 shrink-0" />
                          <span>{n.rule}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-harm-soft p-5 text-sm">
              <div className="font-display text-xs font-bold uppercase tracking-wider">
                What the guide never does
              </div>
              <ul className="mt-2 space-y-1">
                {NEVER.map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground"
                    />
                    {n}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                The rules decide which documents a household owes. The guide handles the
                conversation and reads what is sent. The marketing agent decides who qualifies.
              </p>
            </div>
          </aside>
        </div>

        <footer className="mt-8 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          A sketch to make the PRD concrete, not a specification. The household, the building, the
          marketing agent, the link and the phone number are invented. Rules cited are from the{" "}
          <a
            className="underline underline-offset-2"
            href="https://www.nyc.gov/assets/hpd/downloads/pdfs/services/marketing-handbook.pdf"
          >
            HPD/HDC Marketing Handbook
          </a>
          . The deadline shown, {DUE_TEXT}, is ten weekdays from a fixed date. Nothing here is sent
          anywhere.{" "}
          <a href={GITHUB_URL} className="underline underline-offset-2">
            Source on GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
