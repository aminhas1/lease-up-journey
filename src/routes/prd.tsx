import { Link, createFileRoute } from "@tanstack/react-router";
import prdSource from "../../docs/PRD-batch-clock.md?raw";
import { Agent } from "@/components/Characters";
import { GITHUB_URL } from "@/data/links";
import { Markdown } from "@/lib/markdown";

export const Route = createFileRoute("/prd")({
  head: () => ({
    meta: [
      { title: "Batch Clock: a learning PRD" },
      {
        name: "description",
        content:
          "Why Batch Clock exists, what the sources say, what was built, and what I'd ask a marketing agent.",
      },
      { property: "og:title", content: "Batch Clock: a learning PRD" },
    ],
  }),
  component: Prd,
});

function Prd() {
  return (
    <main className="min-h-screen px-4 pb-16">
      <div className="mx-auto max-w-3xl">
        <nav className="flex flex-wrap gap-x-5 gap-y-1 pt-6 font-display text-sm font-semibold text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            ← The journey map
          </Link>
          <Link to="/batch" className="underline-offset-4 hover:underline">
            Batch Clock, the prototype →
          </Link>
        </nav>

        <header className="pt-4 pb-6">
          <div className="inline-block rounded-full border border-dashed border-border bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-sm">
            Learning PRD · not a proposal
          </div>
          <div className="mt-4 flex items-end gap-3">
            <Agent className="h-14 w-[70px] shrink-0" />
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Batch Clock: a learning PRD
            </h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The same document as{" "}
            <a
              href={`${GITHUB_URL}/blob/main/docs/PRD-batch-clock.md`}
              className="underline underline-offset-2"
            >
              docs/PRD-batch-clock.md
            </a>{" "}
            in the repository.
          </p>
        </header>

        <article className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <Markdown source={prdSource} skipTitle />
        </article>

        <footer className="mt-8 text-xs text-muted-foreground">
          <a href={GITHUB_URL} className="underline underline-offset-2">
            Source on GitHub
          </a>{" "}
          · Names, files and the building in the prototype are invented.
        </footer>
      </div>
    </main>
  );
}
