#!/usr/bin/env bash
# Which shift this run is, and whether it should work it. Run by the
# workflow's check job (README, "A night"); prints `shift=N` and `go=…` for
# $GITHUB_OUTPUT.
#
#   bash tools/check-shift.sh <last-settle.json> <today YYYY-MM-DD>
#
# From the environment: EVENT (schedule | workflow_dispatch), SCHEDULE (the
# cron line that fired), NIGHTLY ("true" from the outside scheduler), ASKED
# (the shift a dispatch asked for).
#
# A run started by hand always goes ahead. A scheduled one, or the outside
# scheduler's, stands down if its shift has settled today, and the second
# shift also waits for the first: it starts from what the first found.
set -u
settle_file=$1
today=$2

case "${SCHEDULE:-}" in
  "7 5 * * *"|"29 6 * * *") shift_no=2 ;;
  "") shift_no=${ASKED:-1} ;;
  *) shift_no=1 ;;
esac
[ "$shift_no" = 2 ] || shift_no=1

settled=""
if [ -f "$settle_file" ]; then
  settled=$(jq -r --arg today "$today" 'if .date == $today then ((.shifts // [1]) | map(tostring) | join(" ")) else "" end' "$settle_file" 2>/dev/null || true)
fi
has() { case " $settled " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }

go=true
if [ "${EVENT:-}" = schedule ] || [ "${NIGHTLY:-}" = true ]; then
  if has "$shift_no"; then
    echo "shift $shift_no already settled today; standing down" >&2
    go=false
  elif [ "$shift_no" = 2 ] && ! has 1; then
    echo "shift 1 hasn't settled today, and shift 2 starts from it; standing down" >&2
    go=false
  fi
fi
echo "shift=$shift_no"
echo "go=$go"
