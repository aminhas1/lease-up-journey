import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Agent, City, Family } from "@/components/Characters";
import {
  BEATS,
  DUE_TEXT,
  GUIDE,
  LINK,
  LIST,
  NEVER,
  NOT_STARTED,
  STEPS,
  WHAT_COUNTS,
  type Msg,
  type PagePatch,
} from "@/data/guide";
import { GITHUB_URL } from "@/data/links";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "An AI guide for the document request: a prototype" },
      {
        name: "description",
        content:
          "A scripted text conversation, and the page behind it, showing how an applicant in the NYC housing lottery might be guided through a document request. Invented household, real rules.",
      },
      { property: "og:title", content: "An AI guide for the document request" },
    ],
  }),
  component: Guide,
});

/** One step of the conversation the reader has reached, and the reply that led there. */
type Turn = { stepId: string; via?: string };
type Tab = "texts" | "page" | "notes";

type PageState = {
  ready: boolean;
  expanded?: string;
  states: Record<string, string>;
  receipts: [string, string][];
};

const stepById = (id: string) => STEPS.find((s) => s.id === id) ?? STEPS[0]!;

/** Her page is the lasting record: fold what each step changed, in the order she took them. */
function pageAt(turns: Turn[]): PageState {
  const page: PageState = { ready: false, states: {}, receipts: [] };
  for (const t of turns) {
    const patch: PagePatch | undefined = stepById(t.stepId).page;
    if (!patch) continue;
    if (patch.ready) page.ready = true;
    if (patch.expanded) page.expanded = patch.expanded;
    if (patch.states) Object.assign(page.states, patch.states);
    if (patch.receipts) page.receipts.push(...patch.receipts);
  }
  return page;
}

function statePill(state: string) {
  if (state.includes("received")) return "border-city/30 bg-city-soft text-city";
  if (state === NOT_STARTED) return "border-border/30 bg-muted text-muted-foreground";
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

function Message({ m, onLink }: { m: Msg; onLink: () => void }) {
  switch (m.kind) {
    case "bot":
      return (
        <div className="max-w-[88%]">
          {m.to && (
            <div className="mb-0.5 font-display text-[11px] font-bold text-muted-foreground">
              {m.to}
            </div>
          )}
          <div className="inline-block rounded-2xl rounded-bl-sm border border-border/30 bg-secondary px-3 py-2 text-sm">
            <TextBody text={m.text} onLink={onLink} />
          </div>
        </div>
      );
    case "other":
      return (
        <div className="max-w-[88%]">
          <div className="mb-0.5 font-display text-[11px] font-bold text-muted-foreground">
            {m.name}
          </div>
          <div className="inline-block rounded-2xl rounded-bl-sm border border-border/30 bg-fam-soft px-3 py-2 text-sm">
            {m.text}
          </div>
        </div>
      );
    case "system":
      return (
        <div className="mx-auto max-w-[92%] rounded-xl border border-dashed border-border/40 px-3 py-1 text-center text-[11px] text-muted-foreground">
          {m.text}
        </div>
      );
    case "photo":
      return (
        <div className="ml-auto flex w-24 flex-col items-center rounded-2xl rounded-br-sm bg-primary p-2">
          <div aria-hidden className="h-20 w-16 rounded-sm bg-card p-1.5">
            <div className="h-1 w-8 rounded bg-border/40" />
            <div className="mt-1.5 h-1 w-full rounded bg-border/25" />
            <div className="mt-1 h-1 w-full rounded bg-border/25" />
            <div className="mt-1 h-1 w-9 rounded bg-border/25" />
            <div className="mt-2 h-1 w-full rounded bg-border/25" />
            <div className="mt-1 h-1 w-10 rounded bg-border/25" />
          </div>
          <div className="mt-1 text-[11px] text-primary-foreground">{m.label}</div>
        </div>
      );
    case "draft":
      return (
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border/30 bg-secondary px-3 py-2 text-sm">
          <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {m.title}
          </div>
          <p className="mt-1 border-l-2 border-border/40 pl-2">{m.body}</p>
        </div>
      );
  }
}

/** Her page: the lasting record, opened from the link in her texts. */
function HerPage({ page, flash }: { page: PageState; flash: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [stuck, setStuck] = useState<string | null>(null);
  const [person, setPerson] = useState(false);

  // The conversation can open an item ("What counts as a pay stub?").
  useEffect(() => {
    if (page.expanded) setOpen(page.expanded);
  }, [page.expanded]);

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-card shadow-sm transition ${flash ? "border-agt ring-4 ring-agt/40" : "border-border"}`}
    >
      <div className="flex items-center gap-2 border-b border-border/40 bg-secondary px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
        <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-city" />
        <span className="truncate">{LINK}</span>
        <span className="ml-auto whitespace-nowrap font-sans">No app · no password</span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-lg font-bold leading-tight">{GUIDE.building}</div>
            <div className="text-xs text-muted-foreground">
              {GUIDE.agent}, marketing agent · log number {GUIDE.log}
            </div>
          </div>
          <Agent className="h-9 w-11 shrink-0" />
        </div>

        <div className="mt-3 rounded-xl border border-harm bg-harm-soft px-3 py-2 text-sm">
          <span className="font-display font-bold">10 weekdays left.</span> Everything is due{" "}
          {DUE_TEXT}.
        </div>

        {!page.ready ? (
          <p className="mt-4 rounded-xl border border-dashed border-border/40 p-4 text-sm text-muted-foreground">
            A few questions first, then your list appears here.
          </p>
        ) : (
          <div key="list" className="animate-pop-in">
            {LIST.map((g) => (
              <div key={g.who} className="mt-4">
                <div className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {g.who}
                </div>
                <ul className="mt-1 divide-y divide-border/20">
                  {g.items.map((it) => {
                    const state = page.states[it.id] ?? NOT_STARTED;
                    const hasCounts = it.id === WHAT_COUNTS.item;
                    return (
                      <li key={it.id} className="py-2 text-sm">
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
                        <div className="mt-1 flex flex-wrap gap-x-3 font-display text-xs font-semibold text-muted-foreground">
                          {hasCounts && (
                            <button
                              onClick={() => setOpen(open === it.id ? null : it.id)}
                              aria-expanded={open === it.id}
                              className="underline underline-offset-2"
                            >
                              What counts
                            </button>
                          )}
                          <button
                            onClick={() => setStuck(stuck === it.id ? null : it.id)}
                            aria-expanded={stuck === it.id}
                            className="underline underline-offset-2"
                          >
                            I can't get this
                          </button>
                        </div>
                        {hasCounts && open === it.id && (
                          <div className="animate-pop-in mt-2 rounded-xl border border-border bg-secondary/50 p-3">
                            <dl className="space-y-2">
                              {WHAT_COUNTS.rows.map(([k, v]) => (
                                <div key={k}>
                                  <dt className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {k}
                                  </dt>
                                  <dd>{v}</dd>
                                </div>
                              ))}
                            </dl>
                            <div className="mt-2 flex items-center gap-1.5 border-t border-dotted border-border/40 pt-2 text-[11px] text-muted-foreground">
                              <City className="h-5 w-6 shrink-0" />
                              <span className="font-mono">{WHAT_COUNTS.cite}</span>
                            </div>
                          </div>
                        )}
                        {stuck === it.id && (
                          <p className="animate-pop-in mt-2 rounded-xl border border-dashed border-border/40 p-3 text-xs text-muted-foreground">
                            The guide offers what the rules accept in its place, drafts a message
                            for whoever has to supply it, and tells {GUIDE.agent} you are waiting,
                            so they know before the deadline.
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-4">
              <div className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                What has been sent · Thu, Nov 5
              </div>
              {page.receipts.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing yet. Each document gets a dated line here that the agent can see too.
                </p>
              ) : (
                <ol className="mt-1 text-xs">
                  {page.receipts.map(([t, text]) => (
                    <li
                      key={t}
                      className="grid grid-cols-[auto_1fr] gap-2 border-t border-dotted border-border/40 py-1"
                    >
                      <span className="font-mono text-muted-foreground">{t}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-border/20 pt-3">
          <button
            onClick={() => setPerson((p) => !p)}
            aria-expanded={person}
            className="rounded-full border border-border bg-card px-3 py-1.5 font-display text-sm font-semibold shadow-sm"
          >
            Talk to a person
          </button>
          {person && (
            <div className="animate-pop-in mt-2 rounded-xl border border-border bg-secondary/50 p-3 text-sm">
              <p>
                Call or text 212-555-0142, Monday to Friday, 9 to 5. You can also ask for an
                appointment in person, with a free interpreter, in the evening or at the weekend.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Everything you have sent goes with you. You will not have to start again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Guide() {
  const [turns, setTurns] = useState<Turn[]>([{ stepId: "hello" }]);
  const [tab, setTab] = useState<Tab>("texts");
  const [flash, setFlash] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const current = stepById(turns[turns.length - 1]!.stepId);
  const beat = BEATS.find((b) => b.n === current.beat) ?? BEATS[0]!;
  const page = pageAt(turns);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 1400);
    return () => clearTimeout(id);
  }, [flash]);

  const go = (to: string, via: string) => setTurns((t) => [...t, { stepId: to, via }]);
  const back = () => setTurns((t) => (t.length > 1 ? t.slice(0, -1) : t));
  const restart = () => setTurns([{ stepId: "hello" }]);
  const openPage = () => {
    setTab("page");
    setFlash(true);
  };

  const show = (t: Tab) => `${tab === t ? "" : "hidden"} min-[920px]:block`;
  const atEnd = current.chips.length === 0 && !current.typed;

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
            for herself and her mother. She can stay in her texts or open her own page from the
            link, and both show the same record. A first version would be the texts alone. Tap a
            suggested reply, or send the one already typed, to follow one path. The notes say which
            problem each moment answers and the rule behind it.
          </p>
        </header>

        {/* Small screens: one surface at a time. */}
        <div
          role="tablist"
          className="mb-3 grid grid-cols-3 gap-1 rounded-full border border-border bg-card p-1 min-[920px]:hidden"
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
              className={`rounded-full px-2 py-1.5 font-display text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 min-[920px]:grid-cols-[minmax(0,380px)_minmax(0,1fr)] min-[1240px]:grid-cols-[minmax(0,380px)_minmax(0,400px)_minmax(0,1fr)]">
          {/* Her texts */}
          <div className={show("texts")}>
            <div className="mb-2 hidden font-display text-xs font-bold uppercase tracking-widest text-muted-foreground min-[920px]:block">
              Her texts
            </div>
            <div className="mx-auto flex h-[640px] max-h-[80vh] w-full max-w-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-border bg-card shadow-sm">
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
                    <div key={i} className={`space-y-2 ${last ? "animate-pop-in" : ""}`}>
                      {t.via && (
                        <div className="flex items-end justify-end gap-1.5">
                          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                            {t.via}
                          </div>
                          <Family className="h-6 w-8 shrink-0" />
                        </div>
                      )}
                      {s.say.map((m, j) => (
                        <Message key={j} m={m} onLink={openPage} />
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border/40 bg-card p-3">
                {(current.chips.length > 0 || current.others) && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {current.chips.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => go(c.to, c.label)}
                        className="rounded-full border border-border bg-accent px-3 py-1 text-left font-display text-sm font-semibold shadow-sm transition active:translate-y-0.5"
                      >
                        {c.label}
                      </button>
                    ))}
                    {current.others?.map((o) => (
                      <span
                        key={o}
                        title="This sketch follows one path"
                        className="rounded-full border border-dashed border-border/40 px-3 py-1 font-display text-sm text-muted-foreground"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                )}

                {atEnd ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>That is the end of this path.</span>
                    <button
                      onClick={restart}
                      className="rounded-full border border-border bg-accent px-3 py-1.5 font-display text-sm font-semibold text-foreground shadow-sm"
                    >
                      Start over
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className={`min-w-0 flex-1 truncate rounded-full border px-3 py-2 text-sm ${current.typed ? "border-border bg-card" : "border-border/40 bg-background text-muted-foreground"}`}
                    >
                      {current.typed ? current.typed.text : "Type a reply, or tap one"}
                    </div>
                    <button
                      onClick={() => current.typed && go(current.typed.to, current.typed.text)}
                      disabled={!current.typed}
                      className="whitespace-nowrap rounded-full border border-border bg-primary px-3 py-2 font-display text-sm font-semibold text-primary-foreground shadow-sm transition active:translate-y-0.5 disabled:opacity-30"
                    >
                      Send
                    </button>
                  </div>
                )}

                {!atEnd && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {current.typed
                      ? "She typed this in her own words. Suggested replies come from the rule."
                      : "Suggested replies come from the rule. She can also type her own. Greyed-out ones are other answers; this sketch follows one."}
                  </p>
                )}
              </div>
            </div>

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
            <div className="mb-2 hidden font-display text-xs font-bold uppercase tracking-widest text-muted-foreground min-[920px]:block">
              Her page · the lasting record · comes after the first version
            </div>
            <HerPage page={page} flash={flash} />
            <p className="mt-2 text-xs text-muted-foreground">
              The page opens from the link in her texts and updates as the conversation goes on.
              Texting LIST sends the link again with a one-line status.
            </p>
          </div>

          {/* Notes */}
          <aside
            className={`space-y-4 min-[920px]:col-span-2 min-[1240px]:col-span-1 ${show("notes")}`}
          >
            <div
              key={beat.n}
              className="animate-pop-in rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                What the guide is doing · beat {beat.n} of {BEATS.length}
              </div>
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
