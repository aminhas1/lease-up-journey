# Lease-Up Journey

An interactive research map of New York City's affordable-housing lottery, from application to move-in, plus Batch Clock, a small prototype built to learn what a marketing agent's morning looks like. A learning exercise, not a product proposal. Every deadline and document on the pages names the section of the HPD/HDC Marketing Handbook that set it.

- `/` the journey map: eight steps, three parties, scaled by time
- `/batch` Batch Clock: one invented batch of twelve applicants, each on a handbook clock

The whole app is served under `/harmony-review` (see `vite.config.ts`).

## Run it

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

Then open http://127.0.0.1:5177/harmony-review/.

## Publish it

`npm run build` prerenders both routes to static HTML in `dist/client/`. Copy the contents of `dist/client/harmony-review/` to a folder named `harmony-review` on any static host. The page is unlisted on purpose: it exists at one path that can be added or removed at will.

## Files

- `src/data/steps.ts` the eight steps of the map. This is the research; strings and citations are not to be reworded.
- `src/data/batch.ts` the Batch Clock rules and twelve invented applicants.
- `src/lib/clock.ts` weekday math, derived deadlines, and the one action the handbook allows per state.
- `src/routes/index.tsx` and `src/routes/batch.tsx` the two pages.
- `src/components/Characters.tsx` the family, agent and city.

Names, files and the building are invented. Sources are linked on the pages.
