#!/usr/bin/env bash
# The shift's changes to the lab's machinery, put back before settle ran
# (tools/restore-machinery.sh kept them in .proposal/), proposed as a pull
# request: a branch from the commit the shift started on, the patch, the
# shift's PROPOSAL.md as its description. Then the Tests workflow runs on it,
# scoped to the change; a small change away from the lab's judges merges
# itself (tools/fast-lane.mjs), anything else waits for the PI.
#
#   BASE=<sha> DATE=YYYY-MM-DD SHIFT=1 REPO=owner/name GH_TOKEN=… bash tools/propose.sh
#
# PROPOSE_DRY_RUN=1 builds the branch and stops before pushing (for the tests).
set -euo pipefail
cd "$(dirname "$0")/.."
patch="$PWD/.proposal/machinery.patch"
[ -s "$patch" ] || { echo "propose: nothing to propose"; exit 0; }

branch="proposal/${DATE}-shift${SHIFT}"
if [ -s .proposal/PROPOSAL.md ]; then
  title=$(grep -m1 -v '^\s*$' .proposal/PROPOSAL.md | sed -E 's/^#+ *//')
  body=$(awk 'f; !f && NF {f=1}' .proposal/PROPOSAL.md)
else
  title="The night shift's changes to the machinery, ${DATE}, shift ${SHIFT}"
  body="The shift changed these and left no PROPOSAL.md saying why."
fi
work="${RUNNER_TEMP:-$(mktemp -d)}/proposal-$$"
git worktree add -q --detach "$work" "$BASE"
trap 'git worktree remove --force "$work" >/dev/null 2>&1 || true' EXIT
cd "$work"
git switch -q -c "$branch"
git apply --index "$patch"
files=$(git diff --cached --name-only | sed 's/^/- `/; s/$/`/')
printf '%s\n\n**Changes:**\n%s\n\nProposed by the night shift (%s, shift %s). The Tests workflow judges it, scoped to the change; a small change away from what judges and publishes merges itself, and anything else waits for the PI (`README.md`, "Proposals").\n' \
  "$body" "$files" "$DATE" "$SHIFT" > "$work.body.md"
{ printf '%s\n\n' "$title"; cat "$work.body.md"; } > "$work.msg"
git -c user.name="kinocomputing-lab[bot]" -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -q -F "$work.msg"
if [ "${PROPOSE_DRY_RUN:-}" = 1 ]; then
  echo "propose: $branch: $title"
  git show --stat --format= HEAD
  exit 0
fi
git push -q --force "https://x-access-token:${GH_TOKEN}@github.com/${REPO}" "$branch"
gh pr create --repo "$REPO" --base main --head "$branch" --title "$title" --body-file "$work.body.md" \
  || gh pr edit "$branch" --repo "$REPO" --title "$title" --body-file "$work.body.md"
# main's Tests workflow, never the proposal's (which could rewrite it): told
# which branch to test and what it started from.
gh workflow run tests.yml --repo "$REPO" --ref main -f proposal="$branch" -f since="$BASE"
echo "propose: opened $branch: $title"
