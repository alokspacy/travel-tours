/**
 * Static sanity check: verifies every local image, stylesheet, script and page
 * link referenced by the HTML actually exists, and that every SVG sprite icon
 * used on a page is also defined on that page.
 *
 * Run: node scripts/check-links.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const pages = (await readdir(ROOT)).filter((f) => f.endsWith(".html"));
let problems = 0;

const isExternal = (u) =>
  /^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(u) || u.trim() === "";

for (const page of pages) {
  const html = await readFile(path.join(ROOT, page), "utf8");
  const bad = [];

  /* local file references */
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = m[1];
    if (isExternal(url)) continue;
    refs.add(url.split("#")[0].split("?")[0]);
  }
  for (const ref of refs) {
    if (ref && !existsSync(path.join(ROOT, ref))) bad.push(`missing file: ${ref}`);
  }

  /* sprite icons: every <use href="#i-x"> needs a matching <symbol id="i-x"> */
  const used = new Set(
    [...html.matchAll(/<use\s+href="#(i-[a-z0-9-]+)"/g)].map((m) => m[1])
  );
  const defined = new Set(
    [...html.matchAll(/<symbol\s+id="(i-[a-z0-9-]+)"/g)].map((m) => m[1])
  );
  for (const icon of used) {
    if (!defined.has(icon)) bad.push(`icon used but not defined: #${icon}`);
  }
  for (const icon of defined) {
    if (!used.has(icon)) bad.push(`icon defined but unused: #${icon}`);
  }

  /* in-page anchors must resolve to an existing id on that same page */
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] && !ids.has(m[1])) bad.push(`anchor target missing: #${m[1]}`);
  }

  /* images should carry alt text */
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) bad.push(`img without alt: ${m[0].slice(0, 90)}`);
  }

  if (bad.length) {
    problems += bad.length;
    console.log(`\n${page}`);
    bad.forEach((b) => console.log(`  - ${b}`));
  } else {
    console.log(`ok  ${page}`);
  }
}

/* report any downloaded photo that no page uses — credits.html is skipped because
   it lists every filename as text, which would mask a genuinely unused image */
const imgs = await readdir(path.join(ROOT, "assets", "img"));
const allHtml = (
  await Promise.all(
    pages.filter((p) => p !== "credits.html").map((p) => readFile(path.join(ROOT, p), "utf8"))
  )
).join("");
const unused = imgs.filter(
  (f) => /\.(jpe?g|png|webp|svg)$/i.test(f) && !allHtml.includes(f)
);
if (unused.length) console.log(`\nunused images: ${unused.join(", ")}`);

console.log(problems ? `\n${problems} problem(s) found` : "\nno problems found");
