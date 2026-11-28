#!/usr/bin/env bash
# When settle fails, the night is still committed and published as far as
# settle got, and the run turns red at the end (the workflow's last step).
# This records the shift as worked in last-settle.json, so the next run
# doesn't take today for a day with no first shift and work it again, and
# says so in MORNING.md. Prints the commit messages' summary.
#
#   bash tools/settle-failed.sh <settle's exit code> [lab dir]
set -u
code=$1
lab=${2:-.}
run="$lab/state/run.json"
settle="$lab/state/last-settle.json"

date=$(jq -r '.date // empty' "$run" 2>/dev/null)
shift_no=$(jq -r '.shift // 1' "$run" 2>/dev/null)
[ -n "$date" ] || date=$(date -u +%F)
[ -n "$shift_no" ] || shift_no=1

prior='{}'
[ -f "$settle" ] && prior=$(cat "$settle")
jq -n --argjson prior "$prior" --arg date "$date" --argjson shift "$shift_no" --arg code "$code" '{
  date: $date,
  shift: $shift,
  shifts: ((if $prior.date == $date then ($prior.shifts // [1]) else [] end) + [$shift] | unique),
  summary: ["settle failed (exit \($code))"],
  report: [],
  settle_failed: true
}' > "$settle.tmp" && mv "$settle.tmp" "$settle"

morning="$lab/MORNING.md"
[ -f "$morning" ] || printf '# %s\n' "$date" > "$morning"
printf '\n## From settle\n\n- Settle failed (exit %s) partway through: what it had published went out, but the brief and what came after it may not have. The run'"'"'s log says where.\n' "$code" >> "$morning"

echo "settle failed (exit $code); published as far as it got"
