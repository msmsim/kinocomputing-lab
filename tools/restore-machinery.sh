#!/usr/bin/env bash
# After the shift, before anything that trusts the lab's tools: put the
# machinery back exactly as committed. The agent works in this checkout, so
# without this it could edit settle.mjs (or the charter, or the reviewer) and
# switch off the rules that judge it. What it changed is listed in
# state/machinery-changes.txt, which settle reports to the PI.
#
#   tools/restore-machinery.sh
set -euo pipefail
cd "$(dirname "$0")/.."

MACHINERY=(tools config test .github .claude AGENT.md CHARTER.md README.md APPROACH.md package.json package-lock.json .nvmrc .python-version .gitignore experiments/_template analyses/_template reference sources/archive-2025/essays sources/archive-2025/personas sources/archive-2025/about-2025.md)

{
  git diff --name-only HEAD -- "${MACHINERY[@]}"
  git ls-files --others --exclude-standard -- "${MACHINERY[@]}"
} | sort -u > state/machinery-changes.txt

# One path at a time: a pathspec missing from HEAD would abort them all.
for path in "${MACHINERY[@]}"; do
  if git cat-file -e "HEAD:$path" 2>/dev/null; then git checkout HEAD -- "$path"; fi
  git clean -fdq -- "$path"
done

if [ -s state/machinery-changes.txt ]; then
  echo "restore: put back $(wc -l < state/machinery-changes.txt | tr -d ' ') machinery file(s) the shift changed"
else
  echo "restore: machinery untouched"
fi
