/**
 * Verifies every photo in assets/img is a readable JPEG of usable size.
 * Catches truncated or tiny downloads that still leave a file on disk.
 *
 * Run: node scripts/check-images.mjs           (report only)
 *      node scripts/check-images.mjs --prune   (delete bad files + credits rows)
 *
 * Afterwards run fetch-images.mjs to refill anything that was removed.
 */
import { readFile, readdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "assets", "img");
const PRUNE = process.argv.includes("--prune");

const MIN_WIDTH = 900;
const MIN_BYTES = 40_000;

/** reads width/height from the first SOFn marker of a JPEG */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0-SOF3, SOF5-SOF7, SOF9-SOF11, SOF13-SOF15
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

/** a complete JPEG ends with the EOI marker FFD9 */
const hasEOI = (buf) =>
  buf.length > 4 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;

const files = (await readdir(OUT)).filter((f) => /\.jpe?g$/i.test(f));
const bad = [];

for (const file of files.sort()) {
  const buf = await readFile(path.join(OUT, file));
  const dim = jpegSize(buf);
  const kb = Math.round(buf.length / 1024);
  const problems = [];

  if (!dim) problems.push("not a readable JPEG");
  else if (dim.width < MIN_WIDTH) problems.push(`only ${dim.width}px wide`);
  if (!hasEOI(buf)) problems.push("truncated (no end marker)");
  if (buf.length < MIN_BYTES && file !== "logo.jpg") problems.push(`only ${kb}KB`);

  /* the logo is a small square by design */
  if (file === "logo.jpg") {
    console.log(`ok    ${file.padEnd(24)} ${dim ? `${dim.width}x${dim.height}` : "?"}  ${kb}KB  (logo)`);
    continue;
  }

  if (problems.length) {
    bad.push(file);
    console.log(
      `BAD   ${file.padEnd(24)} ${dim ? `${dim.width}x${dim.height}` : "?".padEnd(9)}  ${kb}KB  — ${problems.join(", ")}`
    );
  } else {
    console.log(`ok    ${file.padEnd(24)} ${dim.width}x${dim.height}  ${kb}KB`);
  }
}

if (PRUNE && bad.length) {
  const creditsPath = path.join(OUT, "credits.json");
  const credits = JSON.parse(await readFile(creditsPath, "utf8").catch(() => "[]"));
  await writeFile(
    creditsPath,
    JSON.stringify(credits.filter((c) => !bad.includes(c.file)), null, 2)
  );
  for (const file of bad) await unlink(path.join(OUT, file)).catch(() => {});
  console.log(`\npruned ${bad.length} file(s) — now run: node scripts/fetch-images.mjs`);
} else {
  console.log(
    bad.length
      ? `\n${bad.length} bad file(s): ${bad.join(", ")}\nre-run with --prune to remove them`
      : "\nall images look good"
  );
}
