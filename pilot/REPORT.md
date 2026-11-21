# The pilot: four questions, eleven shifts

On the night of 2026-11-20/21 the lab's playbook was run for real, locally,
on the four seed questions, to see whether it works and whether what it
produces is worth having. This is what happened, what it produced, what
broke, and what was changed because of it.

## How it was run

- `tools/local-shift.sh`, the same steps as the nightly workflow: prepare,
  shift, restore, replicate, settle. In Claude Code's sandbox on the
  operator's Mac (an Intel MacBook): writes only in the repo, network only to
  the listed hosts, credentials and personal folders unreadable.
- Published into a scratch copy of kinocomputing whose Action and deploy ran
  after every shift, so each shift saw the site as it would be live — its
  own earlier notes, versions, quotes and staleness included.
- No paid tooling: Exa was off; arXiv and OpenAlex only.
- The operator (Claude, standing in for the PI's scheduling, not their
  views) set each shift's focus so all four questions got two rounds, ran
  two of them as deep runs, and left the last but one unfocused to test the
  researcher's own choice. No PI takes were posted: the pilot has no takes
  of yours to steer by, and inventing some would have put words in your
  mouth. Steering is covered by the tests (below), not by this pilot.
- Between shifts, the operator read the outputs, checked their sources, and
  fixed the playbook where it fell short. Every fix is a commit of its own,
  between the shifts that motivated it.

**Cost: $2.12 for eleven shifts**, billed to the local Claude login, not
the lab's key (logged in `state/spend.jsonl` as `account: local`, so not
taken from the lab's bank). Light shifts on Haiku 5.5 cost $0.02–$0.35; the
two deep shifts on Sonnet 5.5 cost $0.44 and $0.53.

## What it produced

14 notes on kinocomputing — six claims (fragments) and eight write-ups
(threads quoting them) — four experiments, one World Machines analysis in
two passes, and two new questions the lab opened for itself. Thirteen are
live: the fourteenth, a setback note, was deleted before merging.

**After the pilot, on the PI's review:** the notes were written for someone
inside the lab — question and experiment ids, "the kill fired", "Stage:
conjecture" — and a reader on kinocomputing can't see the lab. All
thirteen were rewritten for an outside reader, in the register of good
popular science (same findings, numbers and caveats; terms defined; titles
that say the finding), and went out as version 2 with a change note.
`AGENT.md` now has "Writing for the site", and the publisher refuses a note
whose text uses a lab id.

### q-001 — replicate the chip-native nowcasting result (three shifts)

1. Pre-registered e001 (prediction: the chip-native sampler closes at least
   half the CRPS gap to STEPS at 60 minutes; three kill conditions in code),
   wrote and self-tested the data-free parts, and refused to produce a
   result without data. Flagged its own provisional readings for you.
2. Read your write-up, fixed the data (pysteps-data at a pinned commit) and
   every open choice in a dated pre-run section — then ran STEPS on the full
   1226 × 760 grid for over 40 minutes against a 10-minute plan, and was
   stopped. (This is what led to the clock; see below.)
3. Ran a 256 × 256 crop inside the timebox in about two minutes. **Killed as
   pre-registered: f = 0.16 against 0.5.** The reviewer weakened the claim:
   pixelwise CRPS at one lead can't see per-scale structure or memory, so
   this run doesn't test the mechanism and doesn't refute your published
   result. Claim `chip-native-gap-one-window`, write-up
   `chip-native-window-run`.

Value: a real, honestly scoped first replication attempt, and a sharp
methodological point (the score can't see the mechanism) that the next
shift can act on. The seed replication couldn't run here (below); it will
on the runner.

### q-002 — the incumbent stack in the World Machines (two deep shifts)

1. Started analysis a001: situated the stack *within* the proposed
   machines, found it splits — hardware and scaling reads as Modernity in
   Dusk, deployment as Divergence in Day — and that "let physics compute"
   reads as a Dusk repair while "let bodies compute" reads closer to
   Divergence-native. Sourced with DOIs; named the rival reading (ordinary
   diminishing returns plus market structure) and what would change its
   mind. Two conjecture claims, quoted by the write-up. Proposed a test.
2. Read the full texts. Found energy is only 2–6% of frontier training cost
   in Cottier et al., so **dropped "energy is the binding constraint" from
   its own Dusk evidence**; the hostile reviewer weakened both claims (Dusk
   needs a mechanism failing, not concentration; the bodies half is partly
   circular). Updated all three notes as version 2 with change notes, the
   write-up re-quoting the revised claims. Opened q-006 to test the
   placement.

Value: the strongest output of the night. It is what situating within the
machines should look like, and the second pass weakened its own argument
on evidence — which is the lab working as intended. Not yet checked by the
operator: the Cottier 2–6% figure (the DOIs and the shape of the argument
were checked; that number was not).

### q-003 — physical reservoir vs digital baseline (two shifts)

1. e002: 50 coupled noisy Duffing oscillators vs a tuned echo-state network
   on NARMA-10. **Killed: NMSE 0.96 vs 0.15.** It then diagnosed why rather
   than tuning: the physical features had effective rank about 3 of 50, the
   ridge penalty sat at the grid edge, and the ESN's chosen settings were
   near-linear (a linear reservoir alone gets 0.19). Reviewer weakened; the
   claim was narrowed to this toy, grid and task. Free replication agreed.
2. e003, acting on the reviewer: widened the physical grid into the coupled
   nonlinear regime, a tanh-active ESN, a second task (Mackey–Glass).
   **Killed on both tasks and both seeds**; feature rank rose from 3 to 31
   without closing the gap. Free replication agreed.

Value: a well-run negative, iterated. Energy per prediction — half of
q-003 — is still untouched; the notes say so.

### q-004 — paradigm watch (two shifts)

1. Analog in-memory computing: ASSERT (arXiv:2609.00955), calibrated chip
   noise hits diffusion models' early denoising steps; NANQ (2608.02700).
2. Thermodynamic computing: CN101 (arXiv:2608.00754), a fabricated digital
   thermodynamic chip in standard CMOS, with energy and latency deferred.

Both checked by the operator against arXiv: real, current, and described
accurately, including what they don't show. $0.02 each. Value: exactly the
watch the question asks for; each flags that your paradigms page's
"Latest" line is behind, and leaves the page to you.

### q-006 — opened by the lab: do alternative-hardware papers judge themselves on the digital yardstick? (one shift, unfocused)

Left to choose, the researcher took up the test its own analysis had
proposed: an OpenAlex snapshot of 299 abstracts, a pre-registered keyword
rule, and a blind hand check of 20. **The rule's 16% was mostly false
positives; the hand check found 5%.** The claim is worded to the hand
check, not the rule, and it weakens part of q-002's placement. Free
replication agreed.

Value: research hygiene the operator didn't prompt — checking its own
instrument before trusting it — and the questions now feed each other.

## What broke, and what changed

Each is a commit on `blygger-hackathon-pilot`.

| Found | Fixed |
|---|---|
| S1: `search.mjs` failed in the sandbox (Node's fetch ignores the proxy); kinocomputing was unreachable | curl behind a proxy; kinocomputing and World Machines allowlisted; the briefing says where a shift runs and what it can reach |
| S2: evidence as bare paths, sources unlinked; uv used a stray Python 3.9 | evidence links to the lab repo, sources by DOI/arXiv; `.python-version` pinned |
| S4: a deep run stopped at $0.44 of $6 after a first pass | AGENT: a deep run is for depth |
| S5: an experiment ran 40+ minutes; the shift waited, restarted it, and lost its journal; on a runner, the night | `tools/timebox.mjs`; a 60-minute shift limit (runner and local); the deadline in the briefing; experiments in a timebox; settle counts a shift with no cost report at its cap and reports a stopped shift and a missing journal; job timeout 120 minutes |
| S6: published "the run didn't fit" as a note; asked you to approve a crop | AGENT: what's worth publishing; method choices are the researcher's |
| S7: the runner left stdin open; a failed replication's error was unreadable | `< /dev/null`; the error line that says why |
| S10: asked you to commit a snapshot (the runner does) and to confirm its own threshold | AGENT: everything left is committed; pre-registered thresholds are the researcher's |
| Before the pilot: the agent works in the checkout settle runs from, so it could have edited settle | `tools/restore-machinery.sh` puts the machinery back after every shift and reports changes |

The fixes worked where they were tested again: after the clock, every
experiment ran inside its timebox; after S6, nothing operational was
published. The S10 fix wasn't re-tested (shift 11 had nothing to ask).

Twice the Haiku researcher launched the reviewer with a placeholder prompt
by mistake and said so in its journal; its real review ran each time.

## Not shown by the pilot

- **Your takes.** None were posted (see above). The path — your post on
  kinocomputing, the briefing, the steer log, re-offering a missed take,
  answering with a stub, quoting you — is covered end to end by the lab's
  tests against kinocomputing's real build.
- **The Action itself.** Secrets, checkouts and pushes are only provable by
  the first run on GitHub.
- **pysteps replication.** `uv` can't build pysteps on this Mac (Apple's
  clang has no OpenMP); e001's seed replication failed here and was cleared
  so the runner retries it, where it builds.
- **Exa.** Off throughout, as asked.

## Handing over

- The lab's `state/seen.json` and `state/budget.json` are removed: the first
  real run takes a fresh baseline of the live site (so none of your
  existing notes replay as takes) and starts the bank that day.
- The pilot's notes reached kinocomputing when `blygger-hackathon-pilot`
  was merged, and were registered all at once (the pilot's v2s arrived as
  v1s); the rewrites are their v2s. The setback note the S6 fix now
  prevents, `lab-2026-11-21-chip-nowcast-too-big-for-a-timebox`, was
  deleted before the merge and never went live.

## Open, for you

1. **The stage ladder fits experiments, not literature studies.** q-006's
   claim went straight to `real-data`. Should a literature count have its
   own stages, or is "on real data, abstracts only" enough?
2. **Deep runs underspend** ($0.44, $0.53 of $6), even after the fix. Is
   that thrift you want, or should a deep run be held to more passes?
3. **q-001's 0.5 threshold** is the researcher's reading of "closes most of
   the gap" in your write-up. If you meant something else, a take saying so
   is enough.
4. **Your paradigms page** is behind on analog CIM and thermodynamic
   computing; the lab won't edit your notes, by design.
5. **Merging order:** kinocomputing is merged and live. Left: the lab repo,
   created from `blygger-hackathon-pilot`.
