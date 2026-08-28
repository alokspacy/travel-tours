/**
 * Deletes any downloaded photo whose licence forbids commercial use or
 * derivative works (NC / ND / GFDL), then trims credits.json.
 * Re-run fetch-images.mjs afterwards to refill the gaps.
 *
 * Run: node scripts/prune-licenses.mjs
 */
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "assets", "img");
const CREDITS = path.join(OUT, "credits.json");

/* NC = non-commercial, ND = no derivatives (we resize/crop), GFDL = viral doc licence */
const FORBIDDEN = /(\bNC\b|\bND\b|NON-?COMMERCIAL|NODERIV|GFDL)/i;

const credits = JSON.parse(await readFile(CREDITS, "utf8"));
const keep = [];

for (const c of credits) {
  if (FORBIDDEN.test(c.license)) {
    await unlink(path.join(OUT, c.file)).catch(() => {});
    console.log(`pruned  ${c.file}  [${c.license}]`);
  } else {
    keep.push(c);
  }
}

await writeFile(CREDITS, JSON.stringify(keep, null, 2));
console.log(
  `\nkept ${keep.length}, pruned ${credits.length - keep.length} — re-run fetch-images.mjs`
);
