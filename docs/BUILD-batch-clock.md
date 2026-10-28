# Build spec: Batch Clock

Read `PRD-batch-clock.md` first for why this exists. This file says what to build. A working single-file reference implementation is in `batch-clock.html`; port its logic, improve its look, keep its content.

## Where it lives

Add it as a second route in the existing Lease-Up Journey app (`/batch`), so there is one link to share. Reuse the app's tokens, fonts, rounded cards, and characters. If the app isn't available, build it standalone with the same stack (React + TypeScript + Tailwind v4).

## Non-negotiables

- It is a learning prototype. The header pill says so: "Prototype · sample data · built to learn the agent's job". Keep it.
- Every deadline, stage, and required document carries the handbook section that set it. Citations are content, not decoration. Never drop one.
- All applicants are invented. Never use real names or imply real data.
- No recommendations. The page shows what the handbook requires. It does not suggest what Harmony should build.
- Copy is plain and specific. No marketing language, no emoji.

## Data model

```ts
type Stage = 'first' | 'second' | 'offer' | 'appeal' | 'review' | 'closed';

type Doc = { name: string; received: boolean; cite: string };   // cite may be ''
type Event = { date: string; text: string; cite?: string };

type Applicant = {
  log: string;          // 4-digit lottery log number, e.g. '0417'
  name: string;
  household: string;    // e.g. '3 (2 adults, 1 child)'
  stage: Stage;
  start: Date;          // when the current clock started
  docs: Doc[];
  history: Event[];
};
```

Derived per applicant, never stored:
- `due` = `start` + rule.days weekdays (null when the stage has no clock)
- `left` = weekdays from today to `due` (negative = overdue)
- `status` = `done` if closed; `ok` if no clock; `today` if left ≤ 0; `soon` if left ≤ 3; else `ok`

Weekday math skips Saturday and Sunday only. Do not account for holidays; the handbook says "weekdays" and "business days" and the prototype treats them the same. Note that in a code comment.

"Today" is fixed at **Wed 28 Oct 2026** so the sample is stable. Put it in one constant.

## The rules (from the HPD/HDC Marketing Handbook, rev. April 2026)

| stage | label | days | cite | text shown in the "Why this deadline" card |
| --- | --- | --- | --- | --- |
| first | First document request | 10 | §4-5.D.1.d | The applicant must be given not less than ten weekdays from the date of the notice to submit documents. |
| second | Second document request | 5 | §4-5.D.2 | Applicants who submit partial documents must be sent an additional request and given at least five weekdays. Only after that may a rejection notice (H-4) be issued. |
| offer | Unit offer | 5 | §4-3.C.12 | An applicant offered a unit must be given five weekdays to respond before the unit is offered to the next eligible applicant. |
| appeal | Appeal window | 10 | §4-5.H | A rejected applicant may appeal in writing. The appeal must be reviewed by a supervisor who was not the initial reviewer. Their place on the log is held meanwhile. |
| review | In agent review | none | §5-2, §5-4 | No fixed deadline on the agent. The file is checked for household qualification and income calculated the handbook's way. |
| closed | Closed | none | | |

Use these strings exactly.

## Sample data

Use the twelve applicants in `batch-clock.html` (the `A` array) as they are. They cover every stage and these handbook edge cases on purpose: a voucher holder who may not be credit-checked (§4-5.B.1, Att. R-5), a self-employed applicant missing a Schedule C (§5-4.D), a pay stub carrying a one-time bonus (§5-4.C Example 2), unemployment benefits that end mid-year but are annualized anyway (§5-4.F.1.a), an appeal citing a voucher not on the application, a notice sent in Haitian Creole per language preference (§4-3.C.3), a non-response rejection, and a signed lease.

Header: "Batch 3 · Morris Avenue Apartments", "Batch pulled Oct 2 · 12 applicants · 9 units open".

## Screen

One page, top to bottom:

1. **Header.** Prototype pill, title, one-line description ("One marketing agent, one batch, every applicant on their own clock. Sorted by what expires next. Each deadline names the handbook rule that set it."), today's date, batch meta.
2. **Summary tiles.** Counts of open files that: expire today or are overdue; expire within 3 weekdays; are waiting on documents (stage first or second); are in review; all open. Clicking a tile applies that filter. The active tile is outlined.
3. **Filter control** mirroring the tiles plus "closed", and a count ("10 of 12 applicants").
4. **The batch table.** Columns: applicant (name, log number, household); clock (pill: "expires today", "N weekdays left · Oct 30", "N weekdays overdue", "no clock", "closed"; colored today/soon/ok/done); stage (label + cite); documents ("3 of 5 in" with a progress bar for document stages, a word for the others). Sorted by `left` ascending; no-clock rows after timed rows; closed last. Rows are keyboard-focusable and toggle open on click or Enter.
5. **Expanded row** (one at a time), two columns:
   - Left: "Documents · n of m received"; each doc with a filled dot (received) or hollow red ring (missing) and its cite; then the one action the handbook allows right now (below).
   - Right: "Why this deadline" card with rule label, days, cite, text; then the history list (date · text · cite).
6. **Footer** with the four clock rules and their sections, the Furman and NYHC sentences with links, and "Names and files are invented." Copy it from `batch-clock.html`.

Phone width: the table collapses to applicant + clock, with documents under the name; expanded row stacks to one column. No horizontal page scroll.

## Actions

Show at most one, decided by state:

| state | button | effect | note under button |
| --- | --- | --- | --- |
| first, some docs in, some missing | Send second request · +5 weekdays | stage→second, start→today, history += "Second request sent, due <date>" (§4-5.D.2) | Required by §4-5.D.2 when documents are partial. Resets the clock and logs the rule. |
| first, clock run out, nothing in | Send second request · +5 weekdays | same | §4-5.D.2.a allows a rejection only after a follow-up request has also expired. |
| second, clock run out, docs missing | Issue rejection notice (H-4) | stage→appeal, start→today, docs→[rejected: non-response], history += entry (§4-5.D.2.a, §4-5.H) | Both windows have run. §4-5.D.2.a permits rejection for non-response. The applicant then has 10 business days to appeal. |
| second, all docs in | Move to review | stage→review, start→today | |
| review | (disabled) Income worksheet (not built in this prototype) | none | |

Each action shows a toast naming the section it logged, e.g. "Second request logged under §4-5.D.2. Clock reset: 5 weekdays." State is in memory only; reload resets. That's fine.

## Acceptance checks

- Rosa Delgado (0417) opens to "expires today", 3 of 5 docs, and the only button is "Issue rejection notice (H-4)". Clicking it moves her to Appeal window with 10 business days and adds a history line citing §4-5.D.2.a.
- Omar Haddad (0463) shows "2 weekdays left · Oct 30"; his button is "Send second request". After clicking, his clock reads "5 weekdays left · Nov 4" and stage shows §4-5.D.2.
- Fatima Al-Sayed (0471) history includes the line about voucher holders: no credit check, no minimum income, citing §4-5.B.1 and Att. R-5.
- Sorting: expiring-today rows first, then by days left, then no-clock, then closed.
- Every visible section number in the data also appears in the UI. Grep the data for `§` and spot-check.
- Works at 400px wide with no sideways scroll.

## Out of scope

Income calculation, applicant-facing messages, real dates, persistence, authentication, any integration. If you're tempted to add a feature, don't; add a line to `PRD-batch-clock.md` under "What I'd ask first" instead.

## What changed in the build (28 Oct 2026)

Deviations from the spec above, each a correction rather than a feature:

- A family that sent some documents is rejected as "incomplete documents after two requests"; only a family that sent nothing is rejected for non-response. Rosa's acceptance check still holds.
- Jean-Pierre Louis (0412), rejected on Oct 21, is in the appeal window (due Nov 4), not closed. The handbook gives him ten business days.
- A first request with every document in offers "Move to review"; the spec had no action for that state.
- The "expire within 3 weekdays" tile counts what its filter shows (today and overdue included).
- Review rows read "in review · no deadline" in the agent's color instead of "no clock".
- The building is "Sample Avenue Apartments" so it cannot be mistaken for a real one.
- Each row shows where the file sits on the journey map ("step 7 of 8"), linking to that step.
- The description under the title is plainer than the one above.
