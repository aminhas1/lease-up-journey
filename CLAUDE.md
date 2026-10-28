# Lease-Up Journey (Keys Quest)

Interactive research map of the NYC affordable-housing lottery, from application to move-in. Built as a pre-interview deliverable for the Product Manager role at Harmony (harmonyworks.com), a startup that automates document verification for the marketing agents who run lease-ups. Audience: Harmony's CEO, opening it once on desktop or phone.

**Purpose:** show that I researched the process. It is explicitly NOT a product pitch. Nothing on the page recommends what Harmony should build. "Harmony says" lines quote the company's own site and are labeled as the company's claims.

## Stack

TanStack Start + React + TypeScript + Tailwind v4, exported from Lovable. `npm install`, `npm run dev -- --host 127.0.0.1 --port 5177` (bun is not installed on this machine; the IPv4 host flag is needed in some sandboxes). `.claude/launch.json` has a `dev` entry for the app's browser pane. Lovable config lives in `vite.config.ts`; do not add plugins there.

## Files that matter

- `src/data/steps.ts` — the eight steps. **This is the research. Do not reword, shorten, or drop any string in it, including citations.** Add fields or new entries only when asked. Every `pain` entry is `[text, citation]` and the citation must survive any restyle.
- `src/routes/index.tsx` — the page: step track, three character lanes, detail card.
- `src/routes/batch.tsx` — Batch Clock, the second page (`/batch`): one invented batch of twelve applicants on handbook clocks. Data in `src/data/batch.ts` (rule strings verbatim from the build spec; citations are content), logic in `src/lib/clock.ts`, acceptance tests in `src/test/batch-clock.test.ts`. Reuses the map's tokens, fonts and characters.
- `src/components/Characters.tsx` — SVG characters for family / agent / city.
- `src/styles.css` — tokens. `--fam`, `--agt`, `--city`, `--harm` and their `-soft` variants are the only semantic colors.

## Domain in one paragraph

A family applies on Housing Connect (NYC's lottery site) by self-reporting income and household; no documents yet. After the deadline the city randomizes applicants into a numbered log. The building's **marketing agent** (a private firm pre-qualified by HPD, hired by the developer) works the log in order and sends each applicant a document request with at least 10 weekdays to respond, then a second request with at least 5 more if anything is missing. The agent reviews the documents against the **HPD/HDC Marketing Handbook** (the city's rulebook), calculates income the handbook's way, approves or rejects. The city (HPD or HDC) audits a sample of files, or the whole file in tax-credit (LIHTC) buildings, before any lease is signed. Citations in the data use the handbook's section numbers (§4-5.D etc.).

## Known evidence to keep handy

- NYU Furman Center, Apr 2026: of applicants contacted for documents, ~50% never engage, ~27% engage then are rejected (median 29 days in the document phase), ~15% approved. Agents work batches up to 100. https://www.furmancenter.org/wp-content/uploads/2026/04/The-House-Doesnt-Always-Win_508.pdf
- NYHC case study, Feb 2026, one Bronx building, 180 units: ~70,000 applications, 3,607 sent document requests, 1,423 never responded, 1,433 ineligible, 135 moved in, 27 months to lease. Housing Connect sends agents no status notifications. https://thenyhc.org/wp-content/uploads/2026/03/NYHC-Housing-Connect-Case-Study-2.27.26.pdf
- HPD to City Council, Apr 2025: a batch takes 40 to 45 days through the agent stage.

## Publishing

The whole app lives under `/harmony-review` (`BASE_PATH` in `vite.config.ts`, mirrored as `basepath` in `src/router.tsx`). `npm run build` prerenders both routes to static HTML with no server runtime. `npm run publish:portfolio` builds and copies `dist/client/` to `../portfolio/public/harmony-review/`, the Astro portfolio that is deployed as a static site on Replit; publishing the portfolio puts it live at abeerminhas.com/harmony-review, unlisted. Deleting that folder and republishing takes it down.

## Layout notes

- The desktop track (`WideTrack` in `index.tsx`, 920px and up) is one CSS grid: a column per step sized `minmax(100px, <w>fr)`, row 1 the loop arrow, row 2 the step buttons, rows 3 to 5 the lanes. The Harmony band and the loop arrow are grid items, so they always line up with the buttons. Walker positions are measured from the real button rectangles (ResizeObserver), not computed from the weights.
- Under 920px `StackedTrack` renders instead: steps stacked, the loop as a bracket in a left gutter with its own label row, and the three characters beside the selected step.
- Step 5 carries a `numbers` field (`[label, value, source, url]`) rendered as a "By the numbers" grid grouped by source.

## Done (Oct 28, 2026)

Restored the step 5 to step 4 loop arrow, added the Furman and NYHC figures to step 5, fixed the Harmony band alignment, let step titles wrap, and added the stacked phone layout. Built Batch Clock at `/batch` with two sample-data fixes (an applicant with partial documents is rejected as incomplete, not non-response; a rejected applicant sits in the appeal window rather than closed) and a Move to review action for a first request with everything in. Removed the Lovable telemetry and boilerplate; set the base path and static prerender.

## Style rules

- Keep the playful look Lovable produced: cream background, rounded cards, three characters, speech bubbles, "play through" mode.
- Light theme only is acceptable; if adding dark, use the existing tokens.
- No emoji in the UI. No new dependencies unless unavoidable.
- Copy stays plain and specific. No marketing language.

## Sources (link, don't paraphrase from memory)

- HPD/HDC Marketing Handbook, rev. Apr 2026: https://www.nyc.gov/assets/hpd/downloads/pdfs/services/marketing-handbook.pdf
- HPD "Ready, Set, Apply" applicant guide: https://www.nyc.gov/assets/hpd/downloads/pdfs/services/ready-set-apply-english-text.pdf
- HPD Local Law 216 report (2023 audit-style review, 2024 credit-check memo): https://a860-gpp.nyc.gov/downloads/n296x285x?locale=en
- Harmony: https://harmonyworks.com, https://harmonyworks.com/applicants, https://harmonyworks.com/careers/product-manager
