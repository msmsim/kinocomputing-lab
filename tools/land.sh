#!/usr/bin/env bash
# The build shift's last step (.github/workflows/build.yml, README "The build
# shift"). It has push rights to both repositories, so it runs nothing the
# agent wrote: patches are applied, never executed, and the judge and the
# roadmap tool are main's own, copied before any patch goes on.
#
# In: lab/ and kinocomputing/ (main, with push credentials), build/ (the
# agent's patches, REPORT.md, claude-output.json), and the environment the
# workflow sets: ID, DATE, BUILT, LAB_OK, SITE_OK, LAB_BASE, SITE_BASE,
# GH_TOKEN (the lab's), KINO_TOKEN, RUN_URL.
#
# Out: the change on main and the item in Done with its commits; or a pull
# request for the PI; or nothing landed. Every attempt is a line in the lab's
# state/build.jsonl, which the next build reads.
set -uo pipefail

TOOLS="${RUNNER_TEMP:-/tmp}/main-tools"
mkdir -p "$TOOLS"
cp lab/tools/build.mjs "$TOOLS/build.mjs"
cp kinocomputing/tools/roadmap.mjs "$TOOLS/roadmap.mjs"
for repo in lab kinocomputing; do
  git -C "$repo" config user.name "kinocomputing-lab[bot]"
  git -C "$repo" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
done

report=build/REPORT.md
[ -f "$report" ] || : > "$report"
subject=$(sed -n 's/^Subject: *//p' "$report" | head -1)
[ -n "$subject" ] || subject="Build: $ID"
body=$(awk '/^Subject:/{next} /^Done:/{exit} {print}' "$report" | sed '/./,$!d')
whynot=$(sed -n 's/^Why not: *//p' "$report" | head -1)
grep -qiE '^Done: *yes' "$report" && done=yes || done=no
usd=$(node -e 'try { console.log(Number(JSON.parse(require("fs").readFileSync("build/claude-output.json", "utf8")).total_cost_usd ?? 0).toFixed(4)) } catch { console.log(0) }')

declare -A DIR=([lab]=lab [site]=kinocomputing)
declare -A BASE=([lab]="${LAB_BASE:-}" [site]="${SITE_BASE:-}")
declare -A OK=([lab]="${LAB_OK:-}" [site]="${SITE_OK:-}")
declare -A REPO=([lab]=msmsim/kinocomputing-lab [site]=msmsim/kinocomputing)
changed=()
for r in lab site; do [ -s "build/${DIR[$r]}.patch" ] && changed+=("$r"); done

outcome=""
why=""
links=()
if [ "${BUILT:-}" != success ]; then outcome=failed; why="the build didn't finish (${BUILT:-unknown})"
elif [ ${#changed[@]} -eq 0 ]; then outcome=failed; why="it changed nothing${whynot:+: $whynot}"
elif [ "$done" != yes ]; then outcome=failed; why="not done: ${whynot:-no reason given}"
else
  for r in "${changed[@]}"; do
    [ "${OK[$r]}" = true ] || { outcome=failed; why="the ${r}'s tests or mutants failed on the change"; }
  done
fi

# Each change as a commit on a branch from where the agent started, judged
# by main's judge.
branch="build/${ID}-${DATE}"
verdicts=()
if [ -z "$outcome" ]; then
  outcome=landed
  for r in "${changed[@]}"; do
    d="${DIR[$r]}"
    wt="${RUNNER_TEMP:-/tmp}/wt-$r"
    git -C "$d" worktree add -q -b "$branch" "$wt" "${BASE[$r]}"
    git -C "$wt" apply --index "$PWD/build/$d.patch"
    git -C "$wt" commit -q -F - <<EOF
$subject

$body

Built from the roadmap's $ID by the build shift: $RUN_URL
EOF
    verdict=$(cd "$wt" && node "$TOOLS/build.mjs" judge "$r" "${BASE[$r]}" HEAD)
    land=$(sed -n 's/^land=//p' <<<"$verdict")
    v=$(sed -n 's/^why=//p' <<<"$verdict")
    [ -n "$v" ] || v="the judge gave no verdict"
    verdicts+=("$r: $v")
    [ "$land" = true ] || outcome="for the PI"
  done
  why=$(IFS='; '; echo "${verdicts[*]}")
fi

# Pushes a branch's commit onto main, rebasing on whatever landed meanwhile.
land_on_main() {
  local wt=$1
  for attempt in 1 2 3; do
    git -C "$wt" fetch -q origin main
    git -C "$wt" rebase -q origin/main || { git -C "$wt" rebase --abort; return 1; }
    git -C "$wt" push -q origin HEAD:main && return 0
  done
  return 1
}

if [ "$outcome" = landed ]; then
  for r in "${changed[@]}"; do
    wt="${RUNNER_TEMP:-/tmp}/wt-$r"
    if land_on_main "$wt"; then
      links+=("https://github.com/${REPO[$r]}/commit/$(git -C "$wt" rev-parse HEAD)")
    else
      outcome=failed; why="$why; it couldn't be put on the ${r}'s main"
    fi
  done
fi

if [ "$outcome" = landed ]; then
  # The item to Done, with its commits, by main's roadmap tool.
  moved=no
  for attempt in 1 2 3; do
    git -C kinocomputing fetch -q origin main && git -C kinocomputing reset -q --hard origin/main
    (cd kinocomputing && for url in "${links[@]}"; do node "$TOOLS/roadmap.mjs" link "$ID" "$url"; done && node "$TOOLS/roadmap.mjs" move "$ID" done) || break
    git -C kinocomputing commit -qam "roadmap: $ID is done, by the build shift" && git -C kinocomputing push -q origin HEAD:main && { moved=yes; break; }
  done
  [ "$moved" = yes ] || why="$why; but the roadmap couldn't be updated: move $ID to Done by hand"
elif [ "$outcome" = "for the PI" ]; then
  for r in "${changed[@]}"; do
    wt="${RUNNER_TEMP:-/tmp}/wt-$r"
    git -C "$wt" push -q -f origin "HEAD:refs/heads/$branch" || continue
    token="$GH_TOKEN"; [ "$r" = site ] && token="$KINO_TOKEN"
    GH_TOKEN="$token" gh label create "for the PI" --repo "${REPO[$r]}" --color d93f0b --description "Left for the PI" --force >/dev/null 2>&1
    url=$(GH_TOKEN="$token" gh pr create --repo "${REPO[$r]}" --head "$branch" --base main --title "$subject" \
      --label "for the PI" --body "The build shift's change for the roadmap's $ID (https://www.kinocomputing.com/roadmap#$ID). Its tests and mutants passed; it's left for the PI because $why.

$body

$RUN_URL" 2>/dev/null) || url="https://github.com/${REPO[$r]}/tree/$branch"
    links+=("$url")
  done
fi

# The attempt, recorded in the lab, whatever happened.
line=$(ID="$ID" DATE="$DATE" OUTCOME="$outcome" WHY="$why" USD="$usd" SUBJECT="$subject" LINKS="${links[*]:-}" node -e '
const e = process.env;
console.log(JSON.stringify({ date: e.DATE, id: e.ID, outcome: e.OUTCOME, why: e.WHY, subject: e.SUBJECT, usd: Number(e.USD), links: e.LINKS ? e.LINKS.split(" ") : [] }));')
for attempt in 1 2 3; do
  git -C lab fetch -q origin main && git -C lab reset -q --hard origin/main
  echo "$line" >> lab/state/build.jsonl
  git -C lab add state/build.jsonl
  git -C lab commit -qm "build: $ID $outcome" && git -C lab push -q origin HEAD:main && break
done
echo "$line"
{ echo "### Build shift: $ID"; echo; echo "$outcome: $why"; for l in "${links[@]:-}"; do echo "- $l"; done; } >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
