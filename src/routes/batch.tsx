import { Link, createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { APPLICANTS, BATCH, MAP_STEP, RULES, TODAY, type Applicant } from "@/data/batch";
import { Agent, City, Family } from "@/components/Characters";
import {
  actionFor,
  apply,
  clockText,
  derive,
  fmt,
  sortKey,
  type ActionKind,
  type Derived,
  type Status,
} from "@/lib/clock";

export const Route = createFileRoute("/batch")({
  head: () => ({
    meta: [
      { title: "Batch Clock: one agent's batch on the handbook's clocks" },
      {
        name: "description",
        content:
          "A learning prototype: twelve invented applicants in one lease-up batch, each on a deadline set by the HPD/HDC Marketing Handbook.",
      },
      { property: "og:title", content: "Batch Clock" },
      {
        property: "og:description",
        content:
          "A marketing agent's queue for one building, sorted by whichever handbook deadline runs out first.",
      },
    ],
  }),
  component: Batch,
});

type Filter = "all" | "today" | "soon" | "docs" | "review" | "closed";

const FILTERS: { k: Filter; label: string }[] = [
  { k: "all", label: "all open files" },
  { k: "today", label: "expiring today or overdue" },
  { k: "soon", label: "expiring within 3 weekdays" },
  { k: "docs", label: "waiting on documents" },
  { k: "review", label: "in my review" },
  { k: "closed", label: "closed" },
];

const CLOCK: Record<Status, string> = {
  today: "border-fam/40 bg-fam-soft text-fam",
  soon: "border-harm bg-harm-soft text-foreground",
  ok: "border-city/30 bg-city-soft text-city",
  done: "border-border/30 bg-muted text-muted-foreground",
};

/** Mono chip for a handbook section. Citations are content, not decoration. */
function Cite({ c, className = "" }: { c: string; className?: string }) {
  if (!c) return null;
  return (
    <span
      className={`rounded bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ${className}`}
    >
      {c}
    </span>
  );
}

/** Where the file sits on the journey map: eight dots, filled up to the current step, linking to that step. */
function StepMarker({ stage, className = "" }: { stage: Applicant["stage"]; className?: string }) {
  const { n, note } = MAP_STEP[stage];
  return (
    <Link
      to="/"
      search={{ step: n }}
      onClick={(e) => e.stopPropagation()}
      title={`Step ${n} of 8 on the map: ${note}`}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted-foreground underline-offset-2 hover:underline ${className}`}
    >
      <span className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i + 1 === n ? "bg-primary" : i + 1 < n ? "bg-primary/35" : "bg-border/20"}`}
          />
        ))}
      </span>
      step {n} of 8
    </Link>
  );
}

function matches(filter: Filter, a: Applicant, d: Derived): boolean {
  if (filter === "closed") return a.stage === "closed";
  if (a.stage === "closed") return false;
  if (filter === "today") return d.status === "today";
  if (filter === "soon") return d.status === "today" || d.status === "soon";
  if (filter === "docs") return a.stage === "first" || a.stage === "second";
  if (filter === "review") return a.stage === "review";
  return true;
}

function Batch() {
  // State is in memory only; a reload resets the sample.
  const [apps, setApps] = useState<Applicant[]>(APPLICANTS);
  const [filter, setFilter] = useState<Filter>("all");
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const rows = useMemo(() => apps.map((a) => ({ a, d: derive(a) })), [apps]);
  const open = rows.filter((r) => r.a.stage !== "closed");
  const counts = {
    today: open.filter((r) => r.d.status === "today").length,
    soon: open.filter((r) => r.d.status === "today" || r.d.status === "soon").length,
    docs: open.filter((r) => r.a.stage === "first" || r.a.stage === "second").length,
    review: open.filter((r) => r.a.stage === "review").length,
    all: open.length,
  };
  const visible = rows
    .filter((r) => matches(filter, r.a, r.d))
    .sort((x, y) => sortKey(x.a, x.d) - sortKey(y.a, y.d));

  const act = (log: string, kind: ActionKind) => {
    const a = apps.find((x) => x.log === log);
    if (!a) return;
    const next = apply(a, kind);
    setApps(apps.map((x) => (x.log === log ? next.applicant : x)));
    setToast(next.toast);
  };

  const tiles: { k: Filter; n: number; label: string; tone: string }[] = [
    { k: "today", n: counts.today, label: "expire today or overdue", tone: "text-fam" },
    { k: "soon", n: counts.soon, label: "expire within 3 weekdays", tone: "text-foreground" },
    { k: "docs", n: counts.docs, label: "waiting on documents", tone: "text-primary" },
    { k: "review", n: counts.review, label: "in my review", tone: "text-primary" },
    { k: "all", n: counts.all, label: "open files", tone: "text-primary" },
  ];

  return (
    <main className="min-h-screen px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        <nav className="pt-6 text-sm">
          <Link
            to="/"
            className="font-display font-semibold text-muted-foreground underline-offset-4 hover:underline"
          >
            ← The journey map
          </Link>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-4 pb-6">
          <div className="min-w-0">
            <div className="inline-block rounded-full border border-dashed border-border bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-sm">
              Prototype · sample data · built to learn the agent's job
            </div>
            <div className="mt-4 flex items-end gap-3">
              <Agent className="h-14 w-[70px] shrink-0" />
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">{BATCH.title}</h1>
            </div>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A marketing agent's queue for one building. Each applicant has a deadline set by the
              handbook, and the list is sorted by whichever deadline runs out first.
            </p>
          </div>
          <div className="text-sm text-muted-foreground sm:text-right">
            Today{" "}
            <b className="font-mono text-foreground">
              {TODAY.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </b>
            <br />
            Batch pulled <b className="font-mono text-foreground">{BATCH.pulled}</b> · {apps.length}{" "}
            applicants · {BATCH.units} units open
          </div>
        </header>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {tiles.map((t) => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k)}
              aria-pressed={filter === t.k}
              className={`rounded-xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${
                filter === t.k ? "border-primary ring-2 ring-primary/60" : "border-border"
              }`}
            >
              <div
                className={`font-display text-3xl font-bold leading-none tabular-nums ${t.tone}`}
              >
                {t.n}
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">{t.label}</div>
            </button>
          ))}
        </div>

        {/* Filter control */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            Show
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm text-foreground"
            >
              {FILTERS.map((f) => (
                <option key={f.k} value={f.k}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <span>
            {visible.length} of {apps.length} applicants
          </span>
        </div>

        {/* The batch */}
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[20px_minmax(0,1fr)] items-center gap-x-3 bg-secondary px-4 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid-cols-[20px_1.4fr_1fr_1.1fr_1.2fr]">
            <span />
            <span>Applicant</span>
            <span className="hidden md:block">Clock</span>
            <span className="hidden md:block">Stage</span>
            <span className="hidden md:block">Documents</span>
          </div>

          {visible.length === 0 && (
            <div className="p-7 text-center italic text-muted-foreground">
              Nothing here. Change the filter above.
            </div>
          )}

          {visible.map(({ a, d }) => {
            const rule = RULES[a.stage];
            const isOpen = openLog === a.log;
            const quiet = (a.stage === "first" || a.stage === "second") && d.received === 0;
            const docsStage = a.stage === "first" || a.stage === "second";
            const docsWord =
              a.stage === "offer"
                ? "complete"
                : a.stage === "appeal"
                  ? "appeal letter"
                  : a.stage === "review"
                    ? "complete, in review"
                    : "—";
            const toggle = () => setOpenLog(isOpen ? null : a.log);
            const action = actionFor(a, d);
            const clockPill = (
              <span
                className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 font-display text-xs font-bold ${
                  a.stage === "review" ? "border-agt/30 bg-agt-soft text-agt" : CLOCK[d.status]
                }`}
              >
                {clockText(a, d)}
              </span>
            );

            return (
              <Fragment key={a.log}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  className={`grid cursor-pointer grid-cols-[20px_minmax(0,1fr)] items-center gap-x-3 border-t border-border/40 px-4 py-3 transition md:grid-cols-[20px_1.4fr_1fr_1.1fr_1.2fr] ${
                    isOpen ? "bg-secondary/60" : "hover:bg-secondary/40"
                  }`}
                >
                  <span
                    className={`font-display text-sm text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                  >
                    ›
                  </span>

                  <div className="flex min-w-0 items-center gap-2">
                    <div className="relative shrink-0">
                      {quiet && (
                        <span className="absolute -top-2.5 right-0 font-display text-[10px] font-bold text-muted-foreground">
                          z z z
                        </span>
                      )}
                      <Family sleepy={quiet} className="h-8 w-10" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{a.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Log <span className="font-mono">{a.log}</span> · household of {a.household}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                        {clockPill}
                        <span className="text-xs text-muted-foreground">
                          {docsStage ? `${d.received} of ${a.docs.length} in` : docsWord}
                        </span>
                        <StepMarker stage={a.stage} />
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block">{clockPill}</div>

                  <div className="hidden text-sm md:block">
                    {rule.label}
                    <div className="font-mono text-[11px] text-muted-foreground">{rule.cite}</div>
                    <StepMarker stage={a.stage} className="mt-1" />
                  </div>

                  <div className="hidden text-sm md:block">
                    {docsStage ? (
                      <>
                        {d.received} of {a.docs.length} in
                        <div className="mt-1 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-border/20">
                          <div
                            className="h-full bg-city"
                            style={{ width: `${Math.round((d.received / a.docs.length) * 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{docsWord}</span>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="animate-pop-in grid gap-5 border-t border-dashed border-border/50 bg-secondary/40 px-4 py-5 md:grid-cols-[1.2fr_1fr] md:pl-12">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Documents · {d.received} of {a.docs.length} received
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {a.docs.map((doc) => (
                          <li
                            key={doc.name}
                            className="grid grid-cols-[14px_1fr_auto] items-start gap-2 text-sm"
                          >
                            <span
                              aria-label={doc.received ? "received" : "missing"}
                              className={`mt-1 inline-block h-3.5 w-3.5 rounded-full ${doc.received ? "bg-city" : "border-2 border-fam"}`}
                            />
                            <span className={doc.received ? "text-muted-foreground" : ""}>
                              {doc.name}
                            </span>
                            <Cite c={doc.cite} />
                          </li>
                        ))}
                      </ul>
                      {action && (
                        <div className="mt-4">
                          {action.kind === "disabled" ? (
                            <button
                              disabled
                              className="rounded-full border border-border bg-card px-4 py-2 font-display text-sm font-semibold opacity-50"
                            >
                              {action.label}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                act(a.log, action.kind);
                              }}
                              className="rounded-full border border-border bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground shadow-sm transition active:translate-y-0.5"
                            >
                              {action.label}
                            </button>
                          )}
                          {"note" in action && action.note && (
                            <p className="mt-2 max-w-md text-xs text-muted-foreground">
                              {action.note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="rounded-xl border border-border bg-card p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <City className="h-7 w-9 shrink-0" />
                          <div className="font-display text-xs font-bold uppercase tracking-wider">
                            Why this deadline
                          </div>
                        </div>
                        <p className="mt-2">
                          <b>{rule.label}</b>
                          {rule.days ? ` · ${rule.days} weekdays` : ""}{" "}
                          <Cite c={rule.cite} className="bg-secondary" />
                        </p>
                        {rule.text && <p className="mt-1 text-muted-foreground">{rule.text}</p>}
                      </div>
                      <ol className="mt-3 text-xs text-muted-foreground">
                        {a.history.map((h, i) => (
                          <li
                            key={i}
                            className="grid grid-cols-[auto_1fr] gap-2.5 border-t border-dotted border-border/40 py-1"
                          >
                            <span className="font-mono">{h.date}</span>
                            <span>
                              {h.text}
                              {h.cite && <Cite c={h.cite} className="ml-1" />}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        <footer className="mt-8 border-t border-border/40 pt-4 text-xs text-muted-foreground">
          Clocks and stages follow the{" "}
          <a
            className="underline underline-offset-2"
            href="https://www.nyc.gov/assets/hpd/downloads/pdfs/services/marketing-handbook.pdf"
          >
            HPD/HDC Marketing Handbook, rev. Apr 2026
          </a>
          : first document request not less than 10 weekdays (§4-5.D.1.d); second request at least 5
          weekdays for anything missing (§4-5.D.2); unit offer held 5 weekdays (§4-3.C.12); appeal
          10 business days, reviewed by a different supervisor (§4-5.H). Why this view: of
          applicants contacted for documents, about half never engage and a quarter are rejected
          after a median 29 days in the document phase (
          <a
            className="underline underline-offset-2"
            href="https://www.furmancenter.org/wp-content/uploads/2026/04/The-House-Doesnt-Always-Win_508.pdf"
          >
            NYU Furman Center, 2026
          </a>
          ); Housing Connect sends agents no status notifications (
          <a
            className="underline underline-offset-2"
            href="https://thenyhc.org/wp-content/uploads/2026/03/NYHC-Housing-Connect-Case-Study-2.27.26.pdf"
          >
            NYHC case study, 2026
          </a>
          ). Names, files and the building are invented. Actions change nothing outside this page;
          reload to reset.
        </footer>
      </div>

      {/* Toast: the agent's own line, in the map's speech-bubble style. */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-4 bottom-5 flex justify-center transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}
      >
        {toast && (
          <div className="animate-pop-in flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold shadow-sm">
            <Agent className="h-8 w-10 shrink-0" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </main>
  );
}
