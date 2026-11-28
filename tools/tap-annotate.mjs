// Each failing test in a TAP report, as a GitHub annotation: the test's name
// and the first lines of why, on the run's page, without opening the log.
// Used by the Tests workflow when a run fails.
//
//   node tools/tap-annotate.mjs tap.txt

import { readFileSync } from "node:fs";

const lines = readFileSync(process.argv[2], "utf8").split("\n");
const escape = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
let failures = 0;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(\s*)not ok \d+ - (.*)$/);
  if (!m) continue;
  // A suite that failed because a test in it failed says nothing new.
  const detail = [];
  for (let j = i + 1; j < lines.length && detail.length < 12; j++) {
    if (/^\s*(?:ok|not ok) \d+ /.test(lines[j]) || /^\s*\.\.\.\s*$/.test(lines[j])) break;
    const t = lines[j].trim();
    if (t && t !== "---" && !/^(?:duration_ms|type|failureType|location|code|stack|\|-?)\b/.test(t)) detail.push(t);
  }
  if (detail.some((d) => /subtestsFailed/.test(d))) continue;
  failures += 1;
  console.log(`::error title=${escape(m[2].slice(0, 200))}::${escape(detail.join("\n").slice(0, 1500))}`);
}
if (!failures) console.log("::error title=Tests failed::no failing test in the TAP report; see the log");
