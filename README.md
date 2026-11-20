# Kinocomputing lab

An automated research agent for [kinocomputing.com](https://www.kinocomputing.com/):
alternative paradigms of computing and intelligence, from tiny experiments to
World Machines analysis. It works a night shift on GitHub Actions, publishes to
kinocomputing as a blyg — its working notebook and its venue — and takes light
steers from its principal investigator (PI).

- [`CHARTER.md`](CHARTER.md) — what the lab is for, and its standards: claims and
  their stages, replication, publishing, budget.
- [`AGENT.md`](AGENT.md) — how the agent works a shift.
- [`MORNING.md`](MORNING.md) — the last shift's report to the PI.

## A night

```
02:00 UTC  prepare   budget for tonight; steers since last night; briefing   (no tokens)
           shift     Claude Code works one unit of work, under a dollar cap  (tokens)
           settle    record spend; check steers and claims; publish outbox   (no tokens)
           commit    lab state → this repo; notes → kinocomputing
           ↓
kinocomputing's own Action registers the notes as blyg items; Cloudflare deploys.
```

The agent's step holds only the Anthropic key. It can't push, and it never sees
kinocomputing's files: settle, which it doesn't control, renders its markdown
through kinocomputing's own template and converter and refuses anything that
wouldn't publish cleanly. Everything it publishes is marked machine-written —
§5.7 `generated` provenance in the blyg item, and a line on the page.

## Steering, for the PI

Process-light by design. Two ways in, both from your phone:

- **Drop something in.** A motes vault pointed at this repo's `inbox/`. Publish
  a note there — a link, a thought, a question, "less of X, more of Y" — and
  the next shift reads it. Rewriting the note sends it again.
- **Answer on your blyg.** Respond to one of the lab's notes on msn — share it
  through Subset (a stub), or publish a note that links it. The next shift
  reads it as a steer on that note.

Every steer gets a line in `state/steers.jsonl` saying what the lab did with
it, and a mention in `MORNING.md`. One it misses comes back the next night.
For anything heavier, edit `state/questions/` or `CHARTER.md` directly.

## Money

`config/lab.json`: $1.50 a day, banked when unspent up to $10. A normal night
runs Haiku 5.5 with up to $1.50; once the bank reaches $6 a night runs Sonnet
5.5 with up to $6, for an analysis or a heavier experiment. Each run is capped
by Claude Code's `--max-budget-usd`; the spend log is `state/spend.jsonl`. The
hard backstop is the spend limit on the API key's Console workspace.

Pause: set the repository variable `LAB_PAUSED` to `true`. Unset it to resume.

## Setup (once)

1. **Create the repo** `msmsim/kinocomputing-lab` on GitHub and push this
   directory to it. Public is the natural fit — the lab's experiments are
   evidence for what it publishes — but everything dropped in `inbox/` is then
   public too. Private works the same way.
2. **An Anthropic API key** in its own Console workspace with a monthly spend
   limit (~$50), added to this repo as the secret `ANTHROPIC_API_KEY`.
3. **A fine-grained GitHub token** with *Contents: read and write* on
   `msmsim/kinocomputing` only, added to this repo as the secret
   `KINO_PUSH_TOKEN`. (A token, not `GITHUB_TOKEN`, so kinocomputing's own
   Action runs on the lab's pushes and registers its notes.)
4. **Actions:** in this repo's Settings → Actions → General, allow read and
   write workflow permissions, so the shift can commit its state.
5. **kinocomputing** must have the `blygger-hackathon-lab` branch merged (it
   adds the `generated` provenance the lab's notes rely on).
6. **motes:** add a vault — owner/repo `msmsim/kinocomputing-lab`, folder
   `inbox`, base URL `https://github.com/msmsim/kinocomputing-lab/blob/main/`.
   It isn't a blyg.
7. **First run:** Actions → Night shift → Run workflow. Read `MORNING.md`.

## Layout

| Path | What |
|---|---|
| `state/questions/` | The agenda: one file per question |
| `state/claims.jsonl` | Every claim, append-only, with its stage |
| `state/steers.jsonl` | What the lab did with each steer |
| `state/spend.jsonl`, `state/budget.json` | The money |
| `state/seen.json` | Which steers have been delivered |
| `journal/` | One entry per night, the raw lab notebook |
| `experiments/eNNN-slug/` | PLAN.md (pre-registration), code, RESULTS.md |
| `outbox/` → `published/` | Notes the shift wrote → notes that went out (`outbox/rejected/` for refusals) |
| `inbox/` | Drop-ins from the PI's motes vault |
| `tools/` | prepare, settle, render, steers — deterministic, tested, no tokens |
| `.claude/agents/reviewer.md` | The hostile reviewer, Sonnet, for claims above `conjecture` |

`npm test` runs the lab's tests, including two whole nights end to end against
kinocomputing's real build (`KINO_DIR`, default `../kinocomputing`).

An experiment that outgrows this repo gets its own: the shift asks under
"Needs you" in `MORNING.md`, and you create it.
