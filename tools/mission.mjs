// The lab's mission: the paragraph under "## Mission" in CHARTER.md, Matt's
// words. Every briefing opens with it (prepare.mjs), and settle sends it to
// the site, whose About page shows it (notes/_mission.json).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The mission as one paragraph of plain text, or null if the charter has none. */
export function missionOf(lab) {
  const path = join(lab, "CHARTER.md");
  if (!existsSync(path)) return null;
  const section = readFileSync(path, "utf8").match(/^## Mission\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] ?? "";
  const text = section.trim().replace(/\s*\n\s*/g, " ");
  return text || null;
}
