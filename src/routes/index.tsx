import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { STEPS, type Lane } from "@/data/steps";
import { CHAR } from "@/components/Characters";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Keys Quest: NYC Lease-Up Journey" },
      { name: "description", content: "Follow a family, an agent and the city through the 8 steps of NYC's affordable housing lease-up." },
      { property: "og:title", content: "Keys Quest: NYC Lease-Up Journey" },
      { property: "og:description", content: "An interactive, character-driven map of the NYC lottery to move-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LANES: { k: Lane; name: string; bg: string; lane: string; chip: string }[] = [
  { k: "fam", name: "Family", bg: "bg-fam-soft", lane: "bg-fam-soft/50", chip: "bg-fam" },
  { k: "agt", name: "Marketing agent", bg: "bg-agt-soft", lane: "bg-agt-soft/50", chip: "bg-agt" },
  { k: "city", name: "City (HPD / HDC)", bg: "bg-city-soft", lane: "bg-city-soft/50", chip: "bg-city" },
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

const total = STEPS.reduce((a, s) => a + s.w, 0);
const centers: number[] = [];
{
  let acc = 0;
  STEPS.forEach((s) => {
    centers.push(((acc + s.w / 2) / total) * 100);
    acc += s.w;
  });
}

function Index() {
  const [sel, setSel] = useState(1);
  const [playing, setPlaying] = useState(false);
  const step = STEPS[sel - 1]!;

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

  const harmStart = (STEPS.slice(0, 3).reduce((a, s) => a + s.w, 0) / total) * 100;
  const harmW = (STEPS.slice(3, 7).reduce((a, s) => a + s.w, 0) / total) * 100;

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
            Eight steps across three parties, scaled by time. Select a step (or use ← →) to see who is involved, the documents in play, and where the process strains.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {LANES.map(({ k, name, bg }) => {
              const C = CHAR[k];
              return (
                <span key={k} className={`flex items-center gap-2 rounded-full border border-border ${bg} py-1 pl-1 pr-3 text-sm font-bold`}>
                  <C className="h-7 w-9" /> {name}
                </span>
              );
            })}
            <span className="flex items-center gap-2 rounded-full border border-dashed border-border bg-harm-soft px-3 py-1 text-sm font-bold">
              Where Harmony operates, per its site
            </span>
          </div>
        </header>

        <div className="overflow-x-auto pb-3">
          <div className="relative min-w-[900px] rounded-xl border border-border bg-card p-4 shadow-sm">
            {/* Harmony zone */}
            <div className="pointer-events-none absolute inset-y-2 px-4" style={{ left: 0, right: 0 }}>
              <div
                className="absolute inset-y-0 rounded-lg border border-dashed border-harm bg-harm-soft"
                style={{ left: `calc(${harmStart}% + 4px)`, width: `calc(${harmW}% - 8px)` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex gap-2">
              {STEPS.map((s) => (
                <button
                  key={s.n}
                  onClick={() => { setSel(s.n); setPlaying(false); }}
                  style={{ flexGrow: s.w, flexBasis: 0 }}
                  className={`min-w-0 rounded-lg border border-border px-2.5 py-2 text-left transition-all hover:-translate-y-0.5 ${
                    s.n === sel ? "bg-primary text-primary-foreground shadow-sm -translate-y-1" : s.n < sel ? "bg-secondary" : "bg-card"
                  }`}
                >
                  <div className="font-display text-[11px] font-bold uppercase tracking-wider opacity-70">
                    Step {s.n}
                  </div>
                  <div className="truncate font-display text-sm font-semibold">{s.t}</div>
                  <div className="truncate text-[11px] opacity-75">{s.time}</div>
                </button>
              ))}
            </div>

            {/* Lanes */}
            <div className="relative mt-4 space-y-2">
              {LANES.map(({ k, name, lane }) => {
                const C = CHAR[k];
                const active = step.lanes.includes(k);
                const say = SAYS[sel]?.[k];
                const c = centers[sel - 1] ?? 50;
                const shift = c < 25 ? "-20%" : c > 75 ? "-80%" : "-50%";

                return (
                  <div key={k} className={`relative h-24 rounded-lg border border-border/20 ${lane}`}>
                    <span className="absolute left-3 top-2 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {name}
                    </span>
                    <div className="absolute inset-x-6 bottom-[7px] border-t-2 border-dashed border-border/25" />
                    <div className="walker absolute bottom-1 -translate-x-1/2" style={{ left: `${centers[sel - 1]}%`, opacity: active ? 1 : 0.4 }}>
                      {active && say && (
                        <div className="absolute bottom-full mb-1" style={{ left: "50%", transform: `translateX(${shift})` }}>
                          <div key={sel} className="animate-pop-in whitespace-nowrap rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-bold shadow-sm">
                            {say}
                          </div>
                        </div>
                      )}

                      {!active && <div className="absolute -top-3 right-0 font-display text-xs font-bold text-muted-foreground">z z z</div>}
                      <C sleepy={!active} className={`h-14 w-[70px] `} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button onClick={() => setSel((n) => Math.max(1, n - 1))} disabled={sel === 1}
            className="rounded-full border border-border bg-card px-4 py-2 font-display font-semibold shadow-sm transition active:translate-y-0.5 disabled:opacity-40">
            ← Back
          </button>
          <button onClick={() => { if (sel === 8) setSel(1); setPlaying((p) => !p); }}
            className="rounded-full border border-border bg-accent px-5 py-2 font-display font-semibold shadow-sm transition active:translate-y-0.5">
            {playing ? "Pause" : "▶ Play through"}
          </button>
          <button onClick={() => setSel((n) => Math.min(8, n + 1))} disabled={sel === 8}
            className="rounded-full border border-border bg-card px-4 py-2 font-display font-semibold shadow-sm transition active:translate-y-0.5 disabled:opacity-40">
            Next →
          </button>
        </div>

        {/* Detail card */}
        <section key={sel} className="animate-pop-in mt-6 grid overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[1.3fr_1fr]">
          <div className="p-6">
            <div className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {step.n} of 8</div>
            <h2 className="mt-1 text-3xl font-bold">{step.t}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {step.lanes.map((l) => {
                const L = LANES.find((x) => x.k === l)!;
                const C = CHAR[l];
                return (
                  <span key={l} className={`flex items-center gap-1 rounded-full border border-border ${L.bg} py-0.5 pl-0.5 pr-2.5 text-xs font-bold`}>
                    <C className="h-5 w-7" /> {L.name}
                  </span>
                );
              })}
            </div>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">What happens</h3>
            <p className="mt-1">{step.what}</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Documents in play</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">{step.docs.map((d, i) => <li key={i}>{d}</li>)}</ul>
            <p className="mt-4 text-xs text-muted-foreground">Source: {step.cite}</p>
          </div>
          <div className="border-t-2 border-border bg-secondary/50 p-6 md:border-l-2 md:border-t-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">How long</h3>
            <div className="mt-1 font-display text-3xl font-bold text-primary">{step.time}</div>
            <p className="mt-1 text-sm text-muted-foreground">{step.timeNote}</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Where it strains</h3>
            <ul className="mt-2 space-y-2">
              {step.pain.map(([p, c], i) => (
                <li key={i} className="rounded-xl border border-border bg-card p-3 text-sm">
                  {p} <span className="mt-1 block text-xs text-muted-foreground">{c}</span>
                </li>
              ))}
            </ul>
            <div className={`mt-4 rounded-xl border border-dashed p-3 text-sm ${step.harmony ? "border-harm bg-harm-soft" : "border-border/30"}`}>
              <div className="font-display text-xs font-bold uppercase tracking-wider">Harmony says</div>
              <p className="mt-1">{step.harmony ?? <span className="italic text-muted-foreground">Nothing claimed at this step.</span>}</p>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-xs text-muted-foreground">
          Sources: HPD/HDC Marketing Handbook (rev. Apr 2026) · HPD, Ready, Set, Apply · HPD Local Law 216 report · harmonyworks.com. "Harmony says" lines are the company's own claims, not verified behavior.
        </footer>
      </div>
    </main>
  );
}
