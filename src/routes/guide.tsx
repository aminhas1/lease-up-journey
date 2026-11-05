import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Agent, City, Family } from "@/components/Characters";
import {
  BEATS,
  DEPOSIT_KINDS,
  DUE_TEXT,
  GUIDE,
  HISTORY,
  LIST,
  NEVER,
  STEPS,
  type Chip,
  type ListPhase,
  type Msg,
} from "@/data/guide";
import { GITHUB_URL } from "@/data/links";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "An AI guide for the document request: a prototype" },
      {
        name: "description",
        content:
          "A scripted conversation showing how an applicant in the NYC housing lottery might be guided through a document request. Invented household, real rules.",
      },
      { property: "og:title", content: "An AI guide for the document request" },
    ],
  }),
  component: Guide,
});

/** One step of the conversation the reader has reached, and the reply that led there. */
type Turn = { stepId: string; via?: string };

const stepById = (id: string) => STEPS.find((s) => s.id === id) ?? STEPS[0]!;

function statePill(state: string) {
  if (state.includes("received")) return "border-city/30 bg-city-soft text-city";
  if (state === "Not started") return "border-border/30 bg-muted text-muted-foreground";
  return "border-harm bg-harm-soft text-foreground";
}

function ListCard({ phase }: { phase: ListPhase }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
      <div className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {phase === "start" ? "Your list" : "Your list tonight"}
      </div>
      {LIST.map((g) => (
        <div key={g.who} className="mt-2">
          <div className="font-display text-[13px] font-semibold">{g.who}</div>
          <ul className="mt-1 space-y-1.5">
            {g.items.map((it) => (
              <li
                key={it.name}
                className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5"
              >
                <span className="min-w-0">
                  {it.name}
                  {it.note && (
                    <span className="block text-xs text-muted-foreground">{it.note}</span>
                  )}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-display text-[11px] font-bold ${statePill(it.state[phase])}`}
                >
                  {it.state[phase]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Message({ m }: { m: Msg }) {
  switch (m.kind) {
    case "bot":
      return (
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border/30 bg-agt-soft px-3 py-2 text-sm">
          {m.text}
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
        <div className="ml-auto flex w-24 flex-col items-center rounded-xl border border-border bg-secondary p-2">
          <div aria-hidden className="h-20 w-16 rounded-sm border border-border/50 bg-card p-1.5">
            <div className="h-1 w-8 rounded bg-border/40" />
            <div className="mt-1.5 h-1 w-full rounded bg-border/25" />
            <div className="mt-1 h-1 w-full rounded bg-border/25" />
            <div className="mt-1 h-1 w-9 rounded bg-border/25" />
            <div className="mt-2 h-1 w-full rounded bg-border/25" />
            <div className="mt-1 h-1 w-10 rounded bg-border/25" />
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{m.label}</div>
        </div>
      );
    case "list":
      return <ListCard phase={m.phase} />;
    case "explain":
      return (
        <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
          <div className="font-display text-sm font-bold">{m.title}</div>
          <dl className="mt-2 space-y-2">
            {m.rows.map(([k, v]) => (
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
            <span className="font-mono">{m.cite}</span>
          </div>
        </div>
      );
    case "draft":
      return (
        <div className="rounded-xl border border-dashed border-border bg-card p-3 text-sm">
          <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {m.title}
          </div>
          <p className="mt-1">{m.body}</p>
        </div>
      );
    case "receipt":
      return (
        <div className="flex items-start gap-2 rounded-xl border border-city/30 bg-city-soft px-3 py-1.5 text-xs">
          <span aria-hidden className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-city" />
          <span>{m.text}</span>
        </div>
      );
    case "history":
      return (
        <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
          <div className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
            What was sent, Thu, Nov 5
          </div>
          <ol className="mt-1 text-xs">
            {HISTORY.map(([t, text]) => (
              <li
                key={t}
                className="grid grid-cols-[auto_1fr] gap-2 border-t border-dotted border-border/40 py-1"
              >
                <span className="font-mono text-muted-foreground">{t}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "kinds":
      return (
        <div className="flex flex-wrap gap-1.5">
          {DEPOSIT_KINDS.map((k) => (
            <span
              key={k}
              className="rounded-full border border-border/40 bg-card px-2.5 py-1 font-display text-xs font-semibold"
            >
              {k}
            </span>
          ))}
        </div>
      );
  }
}

function Guide() {
  const [turns, setTurns] = useState<Turn[]>([{ stepId: "hello" }]);
  const [person, setPerson] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const current = stepById(turns[turns.length - 1]!.stepId);
  const beat = BEATS.find((b) => b.n === current.beat) ?? BEATS[0]!;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length, person]);

  const choose = (c: Chip) => {
    setPerson(false);
    setTurns((t) => [...t, { stepId: c.to, via: c.label }]);
  };
  const back = () => {
    setPerson(false);
    setTurns((t) => (t.length > 1 ? t.slice(0, -1) : t));
  };
  const restart = () => {
    setPerson(false);
    setTurns([{ stepId: "hello" }]);
  };

  return (
    <main className="min-h-screen px-4 pb-16">
      <div className="mx-auto max-w-6xl">
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
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {GUIDE.applicant}'s number has come up for {GUIDE.building}. She is doing the documents
            for herself and her mother. Tap the replies to follow one path through the conversation.
            The notes next to it say which problem each moment answers and the rule behind it.
          </p>
        </header>

        <div className="grid items-start gap-6 min-[920px]:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* The phone */}
          <div>
            <div className="mx-auto flex h-[640px] max-h-[80vh] w-full max-w-[420px] flex-col overflow-hidden rounded-[2rem] border-2 border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-agt-soft px-3 py-2">
                <Agent className="h-8 w-10 shrink-0" />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate font-display text-sm font-bold">{GUIDE.agent}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Document guide · automated
                  </div>
                </div>
                <button
                  onClick={() => setPerson((p) => !p)}
                  aria-expanded={person}
                  className="whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 font-display text-xs font-semibold shadow-sm"
                >
                  Talk to a person
                </button>
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
                        <Message key={j} m={m} />
                      ))}
                    </div>
                  );
                })}
                {person && (
                  <div className="animate-pop-in rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
                    <div className="font-display text-sm font-bold">{GUIDE.agent}</div>
                    <p className="mt-1">
                      Call or text 212-555-0142, Monday to Friday, 9 to 5. You can also ask for an
                      appointment in person, with a free interpreter, in the evening or at the
                      weekend.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Everything you have sent here goes with you. You will not have to start again.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-border/40 bg-card p-3">
                {current.chips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {current.chips.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => choose(c)}
                        className="rounded-full border border-border bg-primary px-3 py-1.5 text-left font-display text-sm font-semibold text-primary-foreground shadow-sm transition active:translate-y-0.5"
                      >
                        {c.label}
                      </button>
                    ))}
                    {current.others?.map((o) => (
                      <span
                        key={o}
                        title="This sketch follows one path"
                        className="rounded-full border border-dashed border-border/40 px-3 py-1.5 font-display text-sm text-muted-foreground"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>That is the end of this path.</span>
                    <button
                      onClick={restart}
                      className="rounded-full border border-border bg-accent px-3 py-1.5 font-display text-sm font-semibold text-foreground shadow-sm"
                    >
                      Start over
                    </button>
                  </div>
                )}
                {current.others && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Greyed-out replies are other answers an applicant could give. This sketch
                    follows one.
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
                Restart
              </button>
            </div>
          </div>

          {/* The rail */}
          <aside className="space-y-4">
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
                    <div className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      The problem it answers
                    </div>
                    <p className="mt-0.5 font-semibold">{n.finding}</p>
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
              <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
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
          marketing agent and the phone number are invented. Rules cited are from the{" "}
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
