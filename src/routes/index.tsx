import { Link, createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { STEPS, type Lane, type Step } from "@/data/steps";
import { CHAR } from "@/components/Characters";
import { GITHUB_URL } from "@/data/links";

export const Route = createFileRoute("/")({
  // ?step=4 opens the map on that step (Batch Clock links here per file).
  validateSearch: (search: Record<string, unknown>): { step?: number } => {
    const n = Number(search["step"]);
    return Number.isInteger(n) && n >= 1 && n <= 8 ? { step: n } : {};
  },
  head: () => ({
    meta: [
      { title: "Keys Quest: NYC Lease-Up Journey" },
      {
        name: "description",
        content:
          "Follow a family, an agent and the city through the 8 steps of NYC's affordable housing lease-up.",
      },
      { property: "og:title", content: "Keys Quest: NYC Lease-Up Journey" },
      {
        property: "og:description",
        content: "An interactive, character-driven map of the NYC lottery to move-in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LANES: { k: Lane; name: string; bg: string; lane: string; chip: string }[] = [
  { k: "fam", name: "Family", bg: "bg-fam-soft", lane: "bg-fam-soft/50", chip: "bg-fam" },
  { k: "agt", name: "Marketing agent", bg: "bg-agt-soft", lane: "bg-agt-soft/50", chip: "bg-agt" },
  {
    k: "city",
    name: "City (HPD / HDC)",
    bg: "bg-city-soft",
    lane: "bg-city-soft/50",
    chip: "bg-city",
  },
];

const SAYS: Record<number, Partial<Record<Lane, string>>> = {
  1: { fam: "Builds one profile", city: "Hosts Housing Connect" },
  2: { fam: "Waits, often 1 yr+", city: "Randomizes the log" },
  3: { agt: "Pulls batches in order", city: "Provides the log" },
  4: { agt: "Sends doc request", fam: "Receives notice" },
  5: { fam: "Gathers documents", agt: "Sends 2nd request" },
  6: { agt: "Calculates income", fam: "Awaits decision" },
  7: { city: "Audits a sample", agt: "Submits the file" },
  8: { fam: "Signs, gets keys", agt: "Executes lease" },
};

/** The loop on the map: a partial submission at step 5 sends the agent back to step 4 for a second request. */
const LOOP = { from: 5, to: 4, label: "second request, +5 weekdays" };

/** Steps where Harmony says it operates, per its site. The band spans the first to the last. */
const HARM_STEPS = STEPS.filter((s) => s.harm).map((s) => s.n);
const HARM_FIRST = Math.min(...HARM_STEPS);
const HARM_LAST = Math.max(...HARM_STEPS);

const total = STEPS.reduce((a, s) => a + s.w, 0);
const centersPct: number[] = [];
{
  let acc = 0;
  STEPS.forEach((s) => {
    centersPct.push(((acc + s.w / 2) / total) * 100);
    acc += s.w;
  });
}

/** Desktop track columns: one per step, scaled by time, but never narrower than a readable button. */
const TRACK_COLUMNS = STEPS.map((s) => `minmax(100px, ${s.w}fr)`).join(" ");

function StepButton({
  s,
  sel,
  onClick,
  style,
}: {
  s: Step;
  sel: number;
  onClick: () => void;
  style?: CSSProperties;
}) {
  const state =
    s.n === sel
      ? "bg-primary text-primary-foreground shadow-sm -translate-y-1"
      : s.n < sel
        ? "bg-secondary"
        : "bg-card";
  return (
    <button
      data-step={s.n}
      onClick={onClick}
      style={style}
      aria-current={s.n === sel ? "step" : undefined}
      className={`relative min-w-0 rounded-lg border border-border px-2.5 py-2 text-left transition-all hover:-translate-y-0.5 ${state}`}
    >
      <div className="font-display text-[11px] font-bold uppercase tracking-wider opacity-70">
        Step {s.n}
      </div>
      <div className="font-display text-[13px] font-semibold leading-tight">{s.t}</div>
      <div className="mt-0.5 text-[11px] leading-tight opacity-75">{s.time}</div>
    </button>
  );
}

function HarmonyBand({ style }: { style: CSSProperties }) {
  return (
    <div
      aria-label={`Where Harmony operates, per its site: steps ${HARM_FIRST} to ${HARM_LAST}`}
      className="-m-1 rounded-lg border border-dashed border-harm bg-harm-soft"
      style={style}
    />
  );
}

/** Desktop: scaled horizontal track with three character lanes. */
function WideTrack({
  sel,
  step,
  select,
}: {
  sel: number;
  step: Step;
  select: (n: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Real pixel centers of each step button, measured so the walkers line up with the grid columns.
  const [geom, setGeom] = useState<{ centers: number[]; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const lane = el.querySelector<HTMLElement>("[data-lane]");
      const btns = el.querySelectorAll<HTMLElement>("[data-step]");
      if (!lane || btns.length === 0) return;
      const L = lane.getBoundingClientRect();
      if (L.width === 0) return;
      setGeom({
        width: L.width,
        centers: Array.from(btns, (b) => {
          const r = b.getBoundingClientRect();
          return r.left + r.width / 2 - L.left;
        }),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const centerPx = geom?.centers[sel - 1];
  const left = centerPx != null ? `${centerPx}px` : `${centersPct[sel - 1]}%`;
  const pct =
    centerPx != null && geom ? (centerPx / geom.width) * 100 : (centersPct[sel - 1] ?? 50);
  const shift = pct < 25 ? "-20%" : pct > 75 ? "-80%" : "-50%";

  return (
    <div className="hidden min-[920px]:block">
      <div
        ref={trackRef}
        className="relative grid gap-2 rounded-xl border border-border bg-card p-4 shadow-sm"
        style={{ gridTemplateColumns: TRACK_COLUMNS }}
      >
        {/* Harmony zone: same columns as the step buttons, every row of the track. */}
        <HarmonyBand
          style={{ gridColumn: `${HARM_FIRST} / ${HARM_LAST + 1}`, gridRow: "1 / -1" }}
        />

        {/* The loop: from step 5 back to step 4. */}
        <div
          className="relative h-9"
          style={{ gridColumn: `${LOOP.to} / ${LOOP.from + 1}`, gridRow: 1 }}
        >
          <div
            aria-hidden
            className="absolute bottom-0 top-3 rounded-t-xl border-2 border-b-0 border-border"
            style={{ left: "calc(25% - 2px)", right: "calc(25% - 2px)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-[3px] h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-border"
            style={{ left: "calc(25% - 6px)" }}
          />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2 text-[10px] font-bold leading-4">
            <span className="sr-only">
              Step {LOOP.from} loops back to step {LOOP.to}:{" "}
            </span>
            {LOOP.label}
          </div>
        </div>

        {/* Steps */}
        {STEPS.map((s, i) => (
          <StepButton
            key={s.n}
            s={s}
            sel={sel}
            onClick={() => select(s.n)}
            style={{ gridColumn: i + 1, gridRow: 2 }}
          />
        ))}

        {/* Lanes */}
        {LANES.map(({ k, name, lane }, i) => {
          const C = CHAR[k];
          const active = step.lanes.includes(k);
          const say = SAYS[sel]?.[k];
          return (
            <div
              key={k}
              data-lane
              className={`relative h-24 rounded-lg border border-border/20 ${lane}`}
              style={{ gridColumn: "1 / -1", gridRow: i + 3 }}
            >
              <span
                className={`absolute top-2 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${active && pct < 30 ? "right-3" : "left-3"}`}
              >
                {name}
              </span>
              <div className="absolute inset-x-6 bottom-[7px] border-t-2 border-dashed border-border/25" />
              <div
                className="walker absolute bottom-1 -translate-x-1/2"
                style={{ left, opacity: active ? 1 : 0.4 }}
              >
                {active && say && (
                  <div
                    className="absolute bottom-full mb-1"
                    style={{ left: "50%", transform: `translateX(${shift})` }}
                  >
                    <div
                      key={sel}
                      className="animate-pop-in whitespace-nowrap rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-bold shadow-sm"
                    >
                      {say}
                    </div>
                  </div>
                )}
                {!active && (
                  <div className="absolute -top-3 right-0 font-display text-xs font-bold text-muted-foreground">
                    z z z
                  </div>
                )}
                <C sleepy={!active} className="h-14 w-[70px]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Phone and tablet: the same map turned on its side. Steps stack; the characters sit beside the selected step. */
function StackedTrack({ sel, select }: { sel: number; select: (n: number) => void }) {
  // The loop gets its own row between step 4 and step 5.
  const rowOf = (n: number) => (n < LOOP.from ? n : n + 1);
  const loopRow = LOOP.from;

  return (
    <div className="min-[920px]:hidden">
      <div className="relative grid grid-cols-[14px_minmax(0,1fr)_150px] gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        <HarmonyBand
          style={{
            gridColumn: "2 / -1",
            gridRow: `${rowOf(HARM_FIRST)} / ${rowOf(HARM_LAST) + 1}`,
          }}
        />

        {/* The loop: a bracket in the left gutter from step 5 back up to step 4. */}
        <div
          aria-hidden
          className="relative"
          style={{ gridColumn: 1, gridRow: `${rowOf(LOOP.to)} / ${rowOf(LOOP.from) + 1}` }}
        >
          <div className="absolute inset-x-0 bottom-[22%] top-[22%] rounded-l-xl border-2 border-r-0 border-border" />
          <div className="absolute -right-[2px] top-[calc(22%-4px)] h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-border" />
        </div>
        <div className="flex items-center" style={{ gridColumn: "2 / -1", gridRow: loopRow }}>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-bold">
            <span className="sr-only">
              Step {LOOP.from} loops back to step {LOOP.to}:{" "}
            </span>
            {LOOP.label}
          </span>
        </div>

        {STEPS.map((s) => (
          <Fragment key={s.n}>
            <StepButton
              s={s}
              sel={sel}
              onClick={() => select(s.n)}
              style={{ gridColumn: 2, gridRow: rowOf(s.n) }}
            />
            {s.n === sel && (
              <div
                key={sel}
                className="animate-pop-in flex flex-col justify-center gap-1"
                style={{ gridColumn: 3, gridRow: rowOf(s.n) }}
              >
                {LANES.map(({ k, name }) => {
                  const C = CHAR[k];
                  const active = s.lanes.includes(k);
                  const say = SAYS[s.n]?.[k];
                  return (
                    <div
                      key={k}
                      className="flex items-center gap-1.5"
                      style={{ opacity: active ? 1 : 0.45 }}
                      title={name}
                    >
                      <C sleepy={!active} className="h-7 w-9 shrink-0" />
                      {active && say ? (
                        <div className="rounded-lg border border-border bg-card px-1.5 py-0.5 text-[11px] font-bold leading-tight shadow-sm">
                          {say}
                        </div>
                      ) : (
                        <span className="font-display text-[10px] font-bold text-muted-foreground">
                          z z z
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const [sel, setSel] = useState(1);
  const [playing, setPlaying] = useState(false);
  const { step: wanted } = Route.useSearch();
  // Applied after mount so the prerendered HTML (always step 1) hydrates cleanly, then walks to the step.
  useEffect(() => {
    if (wanted) setSel(wanted);
  }, [wanted]);
  const step = STEPS[sel - 1]!;
  const select = (n: number) => {
    setSel(n);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setSel((n) => (n >= 8 ? (setPlaying(false), 8) : n + 1)), 2200);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setSel((n) => Math.min(8, n + 1));
      if (e.key === "ArrowLeft") setSel((n) => Math.max(1, n - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Group the step's numbers by source so each source is cited once, with its link.
  const numberGroups: { source: string; url: string; items: [string, string][] }[] = [];
  for (const [label, value, source, url] of step.numbers ?? []) {
    let g = numberGroups.find((x) => x.source === source);
    if (!g) numberGroups.push((g = { source, url, items: [] }));
    g.items.push([label, value]);
  }

  return (
    <main className="min-h-screen px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        <header className="pt-10 pb-6">
          <div className="inline-block rounded-full border border-border bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-sm">
            Research map · NYC affordable housing lottery
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            From application to keys
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Eight steps across three parties, scaled by time. Select a step (or use ← →) to see who
            is involved, the documents in play, and where the process strains.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {LANES.map(({ k, name, bg }) => {
              const C = CHAR[k];
              return (
                <span
                  key={k}
                  className={`flex items-center gap-2 rounded-full border border-border ${bg} py-1 pl-1 pr-3 text-sm font-bold`}
                >
                  <C className="h-7 w-9" /> {name}
                </span>
              );
            })}
            <span className="flex items-center gap-2 rounded-full border border-dashed border-border bg-harm-soft px-3 py-1 text-sm font-bold">
              Where Harmony operates, per its site
            </span>
          </div>
        </header>

        <WideTrack sel={sel} step={step} select={select} />
        <StackedTrack sel={sel} select={select} />

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setSel((n) => Math.max(1, n - 1))}
            disabled={sel === 1}
            className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-2 font-display font-semibold shadow-sm transition active:translate-y-0.5 disabled:opacity-40 sm:px-4"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (sel === 8) setSel(1);
              setPlaying((p) => !p);
            }}
            className="whitespace-nowrap rounded-full border border-border bg-accent px-4 py-2 font-display font-semibold shadow-sm transition active:translate-y-0.5 sm:px-5"
          >
            {playing ? "Pause" : "▶ Play through"}
          </button>
          <button
            onClick={() => setSel((n) => Math.min(8, n + 1))}
            disabled={sel === 8}
            className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-2 font-display font-semibold shadow-sm transition active:translate-y-0.5 disabled:opacity-40 sm:px-4"
          >
            Next →
          </button>
        </div>

        {/* Detail card */}
        <section
          key={sel}
          className="animate-pop-in mt-6 grid overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[1.3fr_1fr]"
        >
          <div className="p-6">
            <div className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step {step.n} of 8
            </div>
            <h2 className="mt-1 text-3xl font-bold">{step.t}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {step.lanes.map((l) => {
                const L = LANES.find((x) => x.k === l)!;
                const C = CHAR[l];
                return (
                  <span
                    key={l}
                    className={`flex items-center gap-1 rounded-full border border-border ${L.bg} py-0.5 pl-0.5 pr-2.5 text-xs font-bold`}
                  >
                    <C className="h-5 w-7" /> {L.name}
                  </span>
                );
              })}
            </div>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              What happens
            </h3>
            <p className="mt-1">{step.what}</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Documents in play
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {step.docs.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            {numberGroups.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  By the numbers
                </h3>
                {numberGroups.map((g) => (
                  <div key={g.source} className="mt-2">
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {g.items.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border bg-secondary/50 p-3"
                        >
                          <dd className="font-display text-2xl font-bold leading-none text-primary">
                            {value}
                          </dd>
                          <dt className="mt-1.5 text-xs leading-snug">{label}</dt>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Source:{" "}
                      <a
                        href={g.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {g.source}
                      </a>
                    </p>
                  </div>
                ))}
              </>
            )}

            <p className="mt-4 text-xs text-muted-foreground">Source: {step.cite}</p>
          </div>
          <div className="border-t-2 border-border bg-secondary/50 p-6 md:border-l-2 md:border-t-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              How long
            </h3>
            <div className="mt-1 font-display text-3xl font-bold text-primary">{step.time}</div>
            <p className="mt-1 text-sm text-muted-foreground">{step.timeNote}</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Where it strains
            </h3>
            <ul className="mt-2 space-y-2">
              {step.pain.map(([p, c], i) => (
                <li key={i} className="rounded-xl border border-border bg-card p-3 text-sm">
                  {p} <span className="mt-1 block text-xs text-muted-foreground">{c}</span>
                </li>
              ))}
            </ul>
            <div
              className={`mt-4 rounded-xl border border-dashed p-3 text-sm ${step.harmony ? "border-harm bg-harm-soft" : "border-border/30"}`}
            >
              <div className="font-display text-xs font-bold uppercase tracking-wider">
                Harmony says
              </div>
              <p className="mt-1">
                {step.harmony ?? (
                  <span className="italic text-muted-foreground">
                    Nothing claimed at this step.
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        <Link
          to="/batch"
          className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5"
        >
          <CHAR.agt className="h-14 w-[70px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Next: Batch Clock
            </div>
            <div className="mt-1 font-display text-lg font-bold">
              One agent's batch, every applicant on a handbook clock →
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A small prototype built to learn the job at steps 4 to 6. Twelve invented files, each
              deadline citing the rule that set it. A learning exercise, not a proposal.
            </p>
          </div>
        </Link>

        <footer className="mt-8 text-xs text-muted-foreground">
          Sources: HPD/HDC Marketing Handbook (rev. Apr 2026) · HPD, Ready, Set, Apply · HPD Local
          Law 216 report · NYU Furman Center · NYHC · harmonyworks.com. "Harmony says" lines are the
          company's own claims, not verified behavior.{" "}
          <a href={GITHUB_URL} className="underline underline-offset-2">
            Source on GitHub
          </a>{" "}
          ·{" "}
          <Link to="/prd" className="underline underline-offset-2">
            Read the PRD
          </Link>
        </footer>
      </div>
    </main>
  );
}
