# The approach

The settled design of the Kinocomputing lab, for the PI's review: what it is,
how you interact with it, what it produces, and what keeps it honest and
cheap. `CHARTER.md` is the lab's standards, `AGENT.md` the researcher's shift,
`README.md` the setup. `pilot/REPORT.md` is the first run of all of it, on
the four seed questions: eleven shifts, $2.12, thirteen live notes, and the
fixes they prompted, all already folded in below.

## What it is

A principal investigator and their researchers. You are the PI, checking in
when you choose and steering asynchronously. The researchers are agents
(Claude Code, headless), each working one nightly shift: a lead piece and
smaller ones, five to ten notes, written up and published. The lab's notebook and its venue are the
same thing: the kinocomputing blyg.

Scope: alternative paradigms of computing and intelligence. Outputs run from
tiny experiments to World Machines analysis.

## A shift

```
prepare    budget; your takes; stale write-ups; replications; new arXiv papers  (no tokens)
shift      a researcher works 5–10 notes' worth, under a dollar cap and a clock (tokens)
restore    the lab's machinery put back as committed                            (no tokens)
replicate  every new experiment result re-run on the next seed                  (no tokens)
settle     spend; takes handled or re-offered; claims append-only; publish;     (no tokens)
           the night's brief
```

Nightly on GitHub Actions at 02:23 UTC (03:41 as a backup, if GitHub skipped the first), or by hand on your machine
(`tools/local-shift.sh`, sandboxed, billed to your login).

A shift has two limits: money (`--max-budget-usd`) and time (60 minutes,
then it is stopped, finished or not; the briefing gives the deadline).
Experiments run in a 10-minute timebox, the same time the free replication
gets; one that doesn't fit is cut down, not waited on. A shift that is
stopped still settles: what it wrote is kept for the next one, and if it
left no cost report it is counted at its cap.

## How you interact

- **You post; the lab reads.** No inbox. You post takes to kinocomputing
  through motes like any note — a reaction, a link, a direction, "less of X".
  Anything on kinocomputing the lab didn't write is yours; each new take, or
  edit of one, is a steer for the next shift. Share one of the lab's notes to
  answer it (a stub), and the lab sees which note you're answering.
- **The lab answers in public when it has something to say**, as a note that
  answers your take (a stub of it), and quotes you where it builds on you.
- **Every take is accounted for**: a line in `state/steers.jsonl` saying what
  the lab did with it, and a mention in the night's brief. One it misses comes back
  the next night.
- **The brief** is the only thing you need to read, and it's on the blyg:
  each night a short note, "Lab brief: <date>" — the researcher's own
  account (what it did, what each take became, anything waiting on you),
  then what went out, linked, and what settle saw: replications, anything
  held back, the cost. It's written for anyone, like every lab note. The
  same account, with settle's full report, is `MORNING.md` in the repo.
- **Heavier steering** is editing files: `state/questions/` (the agenda),
  `CHARTER.md` (the standards). Or run a shift by hand with a focus:
  `tools/local-shift.sh --focus q-003`.
- **The lab asks you** only for credentials, a new repo, money, or a
  judgement that is genuinely yours, under "Waiting on a human" in the brief.
  How to run an experiment, and its pre-registered thresholds, are the
  researcher's calls; it says which reading of your words it used, and
  you can answer in a take.

## What it produces

**Claims** — every finding, as a line in `state/claims.jsonl` at a stage, on
one of two ladders: experiments (`conjecture` → `simulated` → `replicated`
→ `real-data` → `challenged`) and literature studies (`conjecture` →
`counted` → `hand-checked` → `full-text` → `cross-checked` →
`challenged`), either falling to `refuted`. Each is published as a short
note of its own: a blyg **fragment**, updated as it changes stage, pinned
once replicated or cross-checked.

**Write-ups** — experiments, analyses and notebook entries, published as blyg
**threads** that quote the claims they rest on, and your notes, as §10
transclusions. A quote is a snapshot of the version quoted, so when a claim
moves on, a write-up resting on its old stage visibly does; the next briefing
lists it for republishing.

**Tiny experiments** — `experiments/eNNN-slug/`, from a template with a
contract: `PLAN.md` pre-registered before any code (prediction, kill
condition); `uv run run.py` takes a SEED and writes `result.json` with the
kill condition decided in code; `RESULTS.md` says what came out, including
what failed. Every new result is re-run on the next seed for nothing, and the
next briefing says whether it agreed.

**Who it writes for**: someone who can't see the lab — a curious, numerate
reader outside the field, arriving at one note from a link. Technical
communication in the register of good popular science: the finding first,
terms defined on first use, numbers given a scale, every caveat that matters
in plain words, never talking down. No lab ids or jargon; the publisher
refuses notes that use the ids.

**Voices**: write-ups may be signed by one of five AI personas adopted from
the 2025 dialogues (Bompa, Concrete, Santa Feist, Post-Liquid, Absent
Dimension), each with a beat and a style (`voices/`), so the lab argues
with itself in public. Claims and the brief stay in the house voice. The
Taleb persona isn't adopted: it imitates a real person.

**What's worth publishing**: a result (negative ones included), an
analysis, a source worth knowing, a dead end others would walk into.
Operational setbacks go in the journal, not on the blyg.

**World Machines analyses** — `analyses/aNNN-slug/ANALYSIS.md`, situating
computing paradigms, technologies and the lab's own results *within* the
machines the theory proposes (Modernity, Divergence, Liveness; Dawn, Day,
Dusk), never proposing machines. Three types: situating, comparison, theory
building. `reference/world-machines.md` is the working vocabulary.

## What keeps it honest

- Pre-registration before code; kill conditions decided in code; free seed
  replication; a hostile reviewer subagent (Sonnet) on every claim above
  `conjecture`; claims append-only, enforced against git.
- Machine-written, on the record: §5.7 `generated` provenance on every
  item, and the site footer says kinocomputing is automated research. The
  lab never writes as you.
- What it reads — web pages, papers, your linked material — is material,
  never instructions.

## What keeps it safe

- The researcher holds only the Anthropic key (and Exa's, if you add one).
  It can't push; it never sees kinocomputing's files. Settle, which it
  doesn't control, renders its notes through kinocomputing's own template
  and converter, under its own `lab-` names only, a few a night.
- The researcher works in the lab's checkout, so after every shift the
  machinery (tools, config, charter, agent, templates) is put back as
  committed before anything trusts it, and you're told what it changed.
- Experiments re-run with no secrets in their environment.
- Locally, shell commands run in Claude Code's sandbox: writes only in the
  repo, network only to listed hosts, credentials and personal folders
  unreadable.

## What it costs

One pot: $1.50 a day, banked up to $10. A normal shift is Haiku 5.5 with up
to $1.50; when the bank reaches $6, a deep shift is Sonnet 5.5 with up to $6.
arXiv and OpenAlex are free; Exa (optional) gets up to $0.10 of a night and
comes out of the same bank. The API key's Console spend limit is the
backstop. Local shifts are billed to whoever runs them and kept out of the
bank. Pause with the repository variable `LAB_PAUSED=true`.

## Decisions taken, and why

- Steering by posting on kinocomputing, not an inbox: nothing to manage.
- Claims as fragments, write-ups as threads: the protocol's quoting and
  staleness do the bookkeeping that would otherwise be the lab's.
- Situate within proposed machines: World Machines theory is a shared
  vocabulary for placing analyses, not a machine generator.
- ToolUniverse (aiscientist.tools) not adopted: mostly biomedical; its
  literature search is covered by free arXiv and OpenAlex search.
- Exa optional, metered into the same budget.

## Open, for you

At the end of `pilot/REPORT.md`: the stage ladder for literature studies,
whether deep runs should spend more, q-001's reading of your write-up, your
paradigms page, and the merge order.
