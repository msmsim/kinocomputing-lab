#!/usr/bin/env bash
# One shift, run on your own machine the way .github/workflows/night-shift.yml
# runs it — for trying the lab out, or for an extra shift by hand.
#
#   KINO_DIR=/path/to/a/kinocomputing/copy tools/local-shift.sh [--focus q-003] [--deep]
#
# - The model is billed to your Claude login, not the lab's API key: the spend
#   is logged with "account": "local" and doesn't come out of the lab's bank.
# - The agent's shell commands run in Claude Code's sandbox
#   (config/local-sandbox.json): writes only inside this repo, network only to
#   the hosts listed there. Read/Write/Edit can't write outside it either.
# - Notes are published into KINO_DIR, and — with KINO_BUILD=1 — KINO_DIR's own
#   Action and deploy are run there, so the next shift sees them as the live
#   site. Point it at a scratch copy, never at a checkout you push from: the
#   ids a local --state run assigns aren't the site's.
# - Each shift is committed to the current branch, as the workflow commits it,
#   because settle checks claims against the last commit.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${KINO_DIR:?set KINO_DIR to a kinocomputing copy}"

FOCUS=""
KIND=""
while [ $# -gt 0 ]; do
  case "$1" in
    --focus) FOCUS="$2"; shift 2 ;;
    --deep) KIND="deep"; shift ;;
    --light) KIND="light"; shift ;;
    *) echo "unknown argument $1" >&2; exit 2 ;;
  esac
done

export LAB_LOCAL=1 KINO_DIR
export LAB_SURFACE_DIR="${LAB_SURFACE_DIR:-$KINO_DIR/dist}"
LAB_FOCUS="$FOCUS" LAB_RUN_KIND="$KIND" node tools/prepare.mjs

if [ "$(jq -r .skip state/run.json)" != "true" ]; then
  MODEL="$(jq -r .model state/run.json)"
  MAX_USD="$(jq -r .max_usd state/run.json)"
  # The agent sees neither KINO_DIR nor the surface: only this repo.
  env -u KINO_DIR -u LAB_SURFACE_DIR UV_CACHE_DIR="$PWD/.uv-cache" \
    claude -p "Read AGENT.md and work tonight's shift. Your briefing is state/tonight.md." \
      --model "$MODEL" \
      --max-budget-usd "$MAX_USD" \
      --output-format json \
      --permission-mode acceptEdits \
      --allowedTools "Read Write Edit Glob Grep Bash WebFetch WebSearch Task Agent" \
      --settings config/local-sandbox.json \
      > state/claude-output.json || echo "the shift exited non-zero; settling what it left"
fi

bash tools/restore-machinery.sh
node tools/replicate.mjs
node tools/settle.mjs | tee state/settle.log

if [ "${KINO_BUILD:-}" = "1" ]; then
  (cd "$KINO_DIR" && node tools/build-stream.mjs --state && node tools/build-stream.mjs) | tail -3
fi

git add -A -- . ':!state/settle.log'
git diff --cached --quiet || git commit -qm "local shift $(jq -r .date state/run.json): $(tail -1 state/settle.log | sed 's/^settle: //')"
echo "local shift done: $(tail -1 state/settle.log)"
