# Lease-Up Journey (Keys Quest)

Interactive research map of the NYC affordable-housing lottery, from application to move-in. Built as a pre-interview deliverable for the Product Manager role at Harmony (harmonyworks.com), a startup that automates document verification for the marketing agents who run lease-ups. Audience: Harmony's CEO, opening it once on desktop or phone.

**Purpose:** show that I researched the process. It is explicitly NOT a product pitch. Nothing on the page recommends what Harmony should build. "Harmony says" lines quote the company's own site and are labeled as the company's claims.

## Stack

TanStack Start + React + TypeScript + Tailwind v4, exported from Lovable. `bun install`, `bun run dev --host 127.0.0.1 --port 5177` (IPv4 host flag needed in some sandboxes). Lovable config lives in `vite.config.ts`; do not add plugins there.

## Files that matter

- `src/data/steps.ts` — the eight steps. **This is the research. Do not reword, shorten, or drop any string in it, including citations.** Add fields or new entries only when asked. Every `pain` entry is `[text, citation]` and the citation must survive any restyle.
- `src/routes/index.tsx` — the page: step track, three character lanes, detail card.
- `src/components/Characters.tsx` — SVG characters for family / agent / city.
- `src/styles.css` — tokens. `--fam`, `--agt`, `--city`, `--harm` and their `-soft` variants are the only semantic colors.

## Domain in one paragraph

A family applies on Housing Connect (NYC's lottery site) by self-reporting income and household; no documents yet. After the deadline the city randomizes applicants into a numbered log. The building's **marketing agent** (a private firm pre-qualified by HPD, hired by the developer) works the log in order and sends each applicant a document request with at least 10 weekdays to respond, then a second request with at least 5 more if anything is missing. The agent reviews the documents against the **HPD/HDC Marketing Handbook** (the city's rulebook), calculates income the handbook's way, approves or rejects. The city (HPD or HDC) audits a sample of files, or the whole file in tax-credit (LIHTC) buildings, before any lease is signed. Citations in the data use the handbook's section numbers (§4-5.D etc.).

## Known evidence to keep handy

- NYU Furman Center, Apr 2026: of applicants contacted for documents, ~50% never engage, ~27% engage then are rejected (median 29 days in the document phase), ~15% approved. Agents work batches up to 100. https://www.furmancenter.org/wp-content/uploads/2026/04/The-House-Doesnt-Always-Win_508.pdf
- NYHC case study, Feb 2026, one Bronx building, 180 units: ~70,000 applications, 3,607 sent document requests, 1,423 never responded, 1,433 ineligible, 135 moved in, 27 months to lease. Housing Connect sends agents no status notifications. https://thenyhc.org/wp-content/uploads/2026/03/NYHC-Housing-Connect-Case-Study-2.27.26.pdf
- HPD to City Council, Apr 2025: a batch takes 40 to 45 days through the agent stage.

## Open fixes (priority order)

1. **Restore the loop.** The original design had an arrow from step 5 back to step 4 labeled "second request, +5 weekdays". It is the most important thing on the map and was lost in the restyle. Draw it above the step track between steps 4 and 5.
2. **Add numbers to step 5.** Add a "By the numbers" element to the detail card for step 5 using the Furman and NYHC figures above, each with its source. Put the data in `steps.ts` (new optional field, e.g. `numbers: [label, value, source][]`), not hardcoded in the component.
3. **Harmony band alignment.** On step 1 the dashed yellow Harmony zone stops short of the agent lane on the right edge. It should span steps 4 to 7 across all three lanes at every step.
4. **Truncated titles.** "Agent works the list" and "Lease and move-in" truncate on desktop. Prefer wrapping to two lines over shortening the text.
5. **Phone layout.** Under ~700px the step track scrolls sideways and the lanes are cut off. Stack the steps vertically (or show only the selected step with prev/next) and let the characters sit beside the step rather than on a horizontal track.

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
