# Kinocomputing lab

An automated research agent for [kinocomputing.com](https://www.kinocomputing.com/):
alternative paradigms of computing and intelligence, from tiny experiments to
World Machines analysis. It works a night shift on GitHub Actions, publishes to
kinocomputing as a blyg — its working notebook and its venue — and takes light
steers from its principal investigator (PI).

- [`CHARTER.md`](CHARTER.md) — what the lab is for, and its standards: claims and
  their stages, replication, publishing, budget.
- [`AGENT.md`](AGENT.md) — how the agent works a shift.
- [`MORNING.md`](MORNING.md) — the last shift's report, in full. Its public
  version is published each night on kinocomputing as "Lab brief: <date>".
- [`APPROACH.md`](APPROACH.md) — the design, for review.
- [`pilot/REPORT.md`](pilot/REPORT.md) — the first eleven shifts, on the four seed questions.

## A night

```
02:23 UTC  prepare   shift 1 of 2: its share of the day's budget; the PI's    (no tokens)
                     takes; new reading; tonight's paradigms; briefing
           shift     breadth: the rotation, the archive, the day's floor    (tokens)
                     of five notes, under a dollar cap and a 60-minute clock
           restore   the lab's machinery put back as committed              (no tokens)
           replicate new experiment results re-run on another seed        (no tokens)
           settle    record spend; check takes and claims; publish outbox  (no tokens)
                     and the day's brief
           commit    lab state → this repo; notes → kinocomputing
05:07 UTC  the same again, shift 2 of 2: depth — full texts, experiments, audits,
           from what shift 1 asked; the rest of the day's money; no rotation.
           Settle updates the day's brief with both shifts. 5–15 notes a day.
           ↓
kinocomputing's own Action registers the notes as blyg items; Cloudflare deploys.
```

The agent's step holds only the Anthropic key. It can't push, and it never sees
kinocomputing's files: settle, which it doesn't control, renders its markdown
through kinocomputing's own template and converter and refuses anything that
wouldn't publish cleanly. Everything it publishes carries §5.7 `generated`
provenance in its blyg item, and the site footer says on every page that
kinocomputing is automated research. It writes for readers who can't see
the lab: no lab ids or jargon, terms defined, in the register of good
popular science (`AGENT.md`, "Writing for the site").

## On kinocomputing

Claims and write-ups are published apart, using the blyg's two kinds. Each
claim is a short **fragment** of its own, versioned as it moves stage and
pinned when it is replicated. Experiment, analysis and notebook write-ups are
**threads** that quote the claims they rest on — and your notes, where they
answer or build on them — as §10 transclusions: snapshots at the version
quoted. When a claim moves on, the write-ups quoting its old version are
stale, and the next briefing lists them. At most two write-ups and four claims a night.

## Steering, for the PI

Process-light by design: a PI and researchers, the PI checking in when they
choose. Two ways in. Post your takes to kinocomputing itself, through
motes, like any note — a reaction, a link, a direction, "less of X, more of
Y". Anything on kinocomputing the lab didn't write is yours, and the next
shift reads each new take, or new version of one, as a steer. To answer one
of the lab's notes, share it (a stub); the lab sees which note you're
answering. It may answer back, as a note that is a stub of your take.

Every take gets a line in `state/steers.jsonl` saying what the lab did with
it, and a mention in the night's brief on kinocomputing. One it misses
comes back the next night.
For anything heavier, edit `state/questions/` or `CHARTER.md` directly.

### Shares from Subset

Or send the lab a link from Subset, with notes and excerpts, as often as you
like. It lands in `reading/` here (not on kinocomputing), and the next shift
reads it like a take: the source itself, your notes, your excerpts, and
decides what it is worth — evidence for a paradigm entry, a founding story to
audit, a question, a note of its own. Every share goes into the **hopper**,
the lab's reading list (`state/hopper.jsonl`), with one line from the lab on
it; only the clearly irrelevant is left out, with a reason. The hopper is
public on kinocomputing as **Reading**, with the lab's line only, never your
notes, and each day's brief lists what was added. Each share gets a line in
`state/steers.jsonl`; one the shift misses comes back. The lab repository is
public, so the shares themselves are readable on GitHub; send nothing you'd
keep private.

The receiver is the reference one from Subset (a Cloudflare Worker that
commits each share to a repo), deployed as its own Worker with:

```
GITHUB_OWNER = "msmsim"
GITHUB_REPO = "kinocomputing-lab"
GITHUB_BRANCH = "main"
SITE_BASE = "https://www.kinocomputing.com"
NOTES_FOLDER = "reading"
RECEIVER_NAME = "Kinocomputing lab"
SITE_TIMEZONE = "Europe/London"
```

and two secrets: its own `SUBSET_TOKEN`, and `GITHUB_TOKEN`, a fine-grained
token with Contents read and write on this repository only. It fills
`reading/_note.html`. `SITE_BASE` and `NOTES_FOLDER` make the address it gives
Subset for each share `https://www.kinocomputing.com/reading/<share>`, which
the site redirects to that share's place on the Reading page. The restore step
after each shift keeps `reading/` exactly as sent.

## Sundays

No rotation. The first shift writes **the week in review**: the week's
themes across paradigms, regions and money, what your takes and shares
became, and what changed in how the lab and the site work (from the week's
commits to both repositories, the routine ones left out). The second shift,
on Opus with a 120-minute clock and up to $4 from the bank, writes a
**deep dive** (3,000–5,000 words, one voice, the voices in turn) and a
**roundtable** (all five voices, each turn written separately, ending in
dated, falsifiable bets) in alternate weeks, on a subject orthogonal to the
week. Sunday's floor is two notes. `config/lab.json`, `sunday`, holds the
first Sunday, the voices' order, the word limits and the money.

## Where it looks

All free, none gated, most keyless (`tools/search.mjs`, `tools/sources.mjs`;
AGENT.md, "Where to look"): arXiv and OpenAlex; Semantic Scholar; Europe PMC
with bioRxiv, medRxiv and other preprints; citation trails through OpenAlex
and Semantic Scholar; grants from NSF, NIH, UKRI and OpenAIRE (EU Horizon,
the ERC and European national funders); SEC Form D filings for a named
company; GitHub and Zenodo for open code and data; patents through Exa's
Google Patents; and chatter — Bluesky accounts, Mastodon hashtags, Hacker
News — as leads, never evidence.

Against a US-heavy default, a **regional lens** rotates nightly through the
UK and Europe, China, Japan/Korea/Taiwan, India and South-East Asia, and the
rest of the world (`config/lab.json`, `regions`): one extra country-filtered
search per paradigm, and that region's public funders where they're free.
The briefing carries two standing feeds (arXiv's Emerging Technologies list;
biological-computing preprints) and the latest posts from the lab's
watchlist (`state/watch.json`). Optional: a free Semantic Scholar key as the
secret `S2_API_KEY`, for its own rate rather than the busy public pool.

## Money

`config/lab.json`: $1.50 a day, banked when unspent up to $10. A normal night
runs Haiku 5.5 with up to $1.50; once the bank reaches $6 a night runs Sonnet
5.5 with up to $6, for an analysis or a heavier experiment. Each run is capped
by Claude Code's `--max-budget-usd`; the spend log is `state/spend.jsonl`. The
hard backstop is the spend limit on the API key's Console workspace.

Search is one pot with the model. arXiv and OpenAlex are free. Exa, if the
lab has a key, gets up to $0.50 of each night's money (at most a third of
it), metered by `tools/search.mjs` from the cost Exa reports per call;
settle adds it to the spend log. The paradigm rotation uses about $0.05 a
paradigm (a few searches at $0.007 and one low-effort research-agent call
at $0.025), so a typical night spends $0.10–0.20 — about $3–6 a month,
inside Exa's free $10 monthly credit, so the bank is charged for what is
in practice free. The key's own limit in Exa's dashboard is the
backstop.

Pause: set the repository variable `LAB_PAUSED` to `true`. Unset it to resume.

## Setup (once)

1. **Create the repo** `msmsim/kinocomputing-lab` on GitHub and push this
   directory to it. Public is the natural fit — the lab's experiments are
   evidence for what it publishes. Private works the same way.
2. **An Anthropic API key** in its own Console workspace with a monthly spend
   limit (~$50), added to this repo as the secret `ANTHROPIC_API_KEY`.
3. **A fine-grained GitHub token** with *Contents: read and write* on
   `msmsim/kinocomputing` only, added to this repo as the secret
   `KINO_PUSH_TOKEN`. (A token, not `GITHUB_TOKEN`, so kinocomputing's own
   Action runs on the lab's pushes and registers its notes.)
4. **Actions:** in this repo's Settings → Actions → General, allow read and
   write workflow permissions, so the shift can commit its state.
5. **kinocomputing** must have the `blygger-hackathon-pilot` branch merged
   (it brings `-threads`, `-lab` and `-qol` with it): `generated`
   provenance, the fragments, threads and quotes the lab relies on, and the
   pilot's notes.
6. **Exa (optional):** an Exa account (the free tier's $10 a month is
   plenty), an API key with its own budget limit set in Exa's dashboard,
   added to this repo as the secret `EXA_API_KEY`. Without it the lab
   searches arXiv and OpenAlex only.
7. **An on-time trigger (recommended):** GitHub's scheduler is best-effort
   and can start a run hours late. A free cron service starts it on time
   instead, with GitHub's own two times kept as backups:
   - a fine-grained GitHub token with *Actions: read and write* on this
     repo only (nothing else), kept in the cron service, not here;
   - a job at 02:23 UTC daily: `POST
     https://api.github.com/repos/msmsim/kinocomputing-lab/actions/workflows/night-shift.yml/dispatches`,
     headers `Authorization: Bearer <token>`, `Accept:
     application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, body
     `{"ref":"main","inputs":{"nightly":true}}`. GitHub answers 204.
   - a second at 05:07 UTC, the same but with body
     `{"ref":"main","inputs":{"nightly":true,"shift":"2"}}`.
   `nightly: true` makes a run stand down if its shift has already settled
   today, so whichever trigger comes second does nothing; the second shift
   also waits until the first has settled. GitHub's own schedules (02:23 and
   03:41 for shift 1, 05:07 and 06:29 for shift 2) stay as backups.
8. **First run:** Actions → Night shift → Run workflow. Read the brief it
   publishes on kinocomputing, "Lab brief: <date>".
   The first run takes a baseline of kinocomputing: takes posted before it
   aren't steers. Post one after, and the next shift will see it.

## A shift by hand

```
KINO_DIR=/path/to/a/scratch/kinocomputing KINO_BUILD=1 tools/local-shift.sh [--focus q-003] [--deep]
```

Runs one shift on your machine the way the workflow does, in Claude Code's
sandbox (`config/local-sandbox.json`), billed to your Claude login and kept
out of the lab's bank. Point `KINO_DIR` at a scratch copy of kinocomputing,
never one you push from. The pilot ran this way.

## Layout

| Path | What |
|---|---|
| `state/questions/` | The agenda: one file per question |
| `voices/` | The lab's five AI voices: who each is, its beat and style |
| `audits/` | The foundations ledger (founding stories traced and checked), the self-audit ledger (the lab's own notes re-checked), and the visibility log (whether the site is found for its readers' questions) |
| `state/paradigms.json`, `paradigms/` | The paradigms tracked, with when each was last looked at; the lab's working file on each |
| `sources/archive-2025/` | Kinocomputing's 2025 essays, as source material: indexed, split into units, rolled forward selectively |
| `state/claims.jsonl` | Every claim, append-only, with its stage |
| `state/steers.jsonl` | What the lab did with each steer |
| `state/spend.jsonl`, `state/budget.json` | The money |
| `state/seen.json` | Which of the PI's takes have been delivered |
| `state/search-spend.jsonl`, `state/reading.json` | Exa calls tonight; arXiv papers already shown |
| `journal/` | One entry per night, the raw lab notebook |
| `experiments/eNNN-slug/` | PLAN.md (pre-registration), run.py, result.json, RESULTS.md, replication.json |
| `analyses/aNNN-slug/` | A World Machines analysis's working file |
| `reference/world-machines.md` | The theory's vocabulary and proposed machines, as the lab uses them |
| `outbox/` → `published/` | Notes the shift wrote → notes that went out (`outbox/rejected/` for refusals) |
| `tools/` | prepare, settle, render, steers, search, replicate, timebox, restore-machinery, local-shift — deterministic, tested, no tokens |
| `.claude/agents/reviewer.md` | The hostile reviewer, Sonnet, for claims above `conjecture` |

`npm test` runs the lab's tests, including two whole nights end to end against
kinocomputing's real build (`KINO_DIR`, default `../kinocomputing`).

An experiment that outgrows this repo gets its own: the shift asks under
"Waiting on a human" in the brief, and you create it.
