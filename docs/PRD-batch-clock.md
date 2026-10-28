# Batch Clock: a learning PRD

**Author:** Abeer · **Date:** 28 Oct 2026 · **Status:** Learning exercise, not a proposal

## Why I wrote this

I come from healthcare, not housing. Two days ago I didn't know what a marketing agent was or why a city rulebook is called a marketing handbook. I got curious, started reading, and at some point reading wasn't enough and I wanted to try building a small piece of it to see where I'd get stuck. That's what this is: a process map, a prototype, and this document. It is my attempt to understand the work, written for someone who already knows it. It is not a recommendation. I haven't seen Harmony's product.

## The world, in four definitions

- **Housing Connect** is the city's lottery site. A family self-reports who they live with and what they earn, then applies to buildings. Applying takes minutes because nothing is verified yet.
- **The marketing agent** is a private firm (or the developer's own leasing staff), pre-qualified by HPD and hired by the building's owner, that works the lottery list in order and verifies each family that comes up. "Marketing" means the whole lease-up, not promotion.
- **The Marketing Handbook** is the HPD/HDC rulebook the agent must follow: which documents to ask for, how to calculate income, how many days to give people, when a rejection is allowed. The city audits agents against it and uses their track record to decide whether to approve them for the next building (§4-1.C.5).
- **A batch** is a slice of the lottery list the agent is actively working, up to 100 applicants, each on their own deadline.

## What the sources say the hard part is

- The handbook sets four clocks per applicant: at least 10 weekdays on the first document request (§4-5.D.1.d), at least 5 more on a second request if anything is missing (§4-5.D.2), 5 weekdays to accept a unit offer (§4-3.C.12), 10 business days to appeal a rejection, reviewed by a different supervisor (§4-5.H). Rejecting for non-response is only allowed after both document windows have run (§4-5.D.2.a). ([HPD/HDC Marketing Handbook, rev. April 2026](https://www.nyc.gov/assets/hpd/downloads/pdfs/services/marketing-handbook.pdf))
- Of applicants contacted for documents, about half never engage, about a quarter engage and are then rejected after a median 29 days in the document phase, and roughly 15% are approved. ([NYU Furman Center, April 2026](https://www.furmancenter.org/wp-content/uploads/2026/04/The-House-Doesnt-Always-Win_508.pdf), 64,000 applications, 101 buildings)
- One 180-unit Bronx building: about 70,000 applications, 3,607 document requests, 1,423 never answered, 135 moved in, 27 months to lease. Housing Connect sends agents no notifications, so they check for changes by hand. ([NYHC case study, February 2026](https://thenyhc.org/wp-content/uploads/2026/03/NYHC-Housing-Connect-Case-Study-2.27.26.pdf))

So an agent holds dozens of files, each on a regulatory clock, half going quiet, with nothing telling her which ones moved. Getting a clock wrong isn't free: a rejection issued before both windows have run is an appeal, a held unit, and a complaint to HPD within five business days (§4-5.H, §4-5.I), and it goes on the agent's record with the city.

## Alternatives I considered

Three ideas came out of the reading. An income worksheet that does the handbook's pay-stub math and shows its working (§5-4.C); a pre-submission check against the rules that get files bounced; and a batch view organized by what expires next. I picked the batch view because the Furman and NYHC numbers point at the document phase, not the calculation, as where most files are lost. The other two are still on my list of things I don't understand well enough.

## What the prototype does

One batch, sorted by soonest expiry. Each file shows its clock, its stage, the handbook section that set the deadline, and where it sits on the eight-step map (a unit offer is step 7 of 8; a first document request is step 4). Opening a row shows documents received and missing, each with the section that requires it, and the file's history. The only actions offered are the ones the handbook requires at that moment: send a second request, issue a rejection once both windows have run, move to review when everything is in. Twelve invented applicants, built from the handbook's own edge cases.

## Success criteria for the exercise

Done when this shows that I'm learning the job, not that I know it, and when someone who does the job can tell me the three biggest things I got wrong.

## What I haven't done

- Spoken to a marketing agent, compliance manager, or applicant. Everything about "the agent's day" is inferred.
- Seen Harmony's product. The site describes an agent dashboard; it may already do all of this.
- Had any customer data. The numbers above are citywide or one building.
- Checked feasibility. I assumed clocks can be derived from Housing Connect events; I don't know what it exposes.

## What I did read

Marketing Handbook §4-5 and §5-1 to 5-4 in full; HPD's applicant guide [Ready, Set, Apply](https://www.nyc.gov/assets/hpd/downloads/pdfs/services/ready-set-apply-english-text.pdf); HPD's [Local Law 216 report](https://a860-gpp.nyc.gov/downloads/n296x285x?locale=en) on audit-style review and the 2024 credit-check memo; the [Comptroller's audit](https://comptroller.nyc.gov/reports/audit-report-on-the-department-of-housing-preservation-and-developments-monitoring-of-the-affordable-housing-lotterys-compliance-with-eligibility-guidelines) of HPD lottery oversight; the Furman and NYHC studies; Harmony's [site](https://harmonyworks.com/), [applicant page](https://harmonyworks.com/applicants), and [job postings](https://harmonyworks.com/careers).

## Questions for a marketing agent

Things only someone who does the job can answer. In the order I'd ask them.

1. Does an expiring unit offer feel different from an expiring document request? Does anything you use today make the difference visible, or is it all one list of dates?
2. Which stages do you actually think in? The handbook's (first request, second request, review, offer, appeal) or your own? Which of them matter enough to show on a screen?
3. What do you use to track deadlines across a batch today: Housing Connect, a spreadsheet, memory?
4. Of the files that go quiet, how many are a true non-response, and how many a request the family didn't understand or didn't trust?
5. When a file comes back from the city, what's the usual reason?

## What I'd ask Harmony

1. Does Housing Connect push status changes, or does the product have to look?
2. Which of the clocks above does the product already derive, and from what?
