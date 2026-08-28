/**
 * Generates credits.html from assets/img/credits.json.
 *
 * The photographs on this site are used under Creative Commons / public-domain
 * licences, several of which require visible attribution. Publishing this page
 * (and keeping it linked from the footer) is what keeps the site compliant.
 *
 * Run: node scripts/build-credits.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const credits = JSON.parse(
  await readFile(path.join(ROOT, "assets", "img", "credits.json"), "utf8")
);

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rows = credits
  .slice()
  .sort((a, b) => a.file.localeCompare(b.file))
  .map(
    (c) => `              <tr>
                <td>${esc(c.file)}</td>
                <td>${esc(c.title)}</td>
                <td>${esc(c.author)}</td>
                <td class="rupee">${esc(c.license)}</td>
                <td><a class="link-gold" href="${esc(c.page)}" target="_blank" rel="noopener nofollow">Source</a></td>
              </tr>`
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Photo Credits | Samriddhi Tours &amp; Travels</title>
<meta name="description" content="Attribution for the photographs used on the Samriddhi Tours &amp; Travels website." />
<meta name="robots" content="noindex, follow" />
<link rel="icon" href="assets/img/logo.jpg?v=2" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Playfair+Display:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>

<header class="header">
  <div class="container header__in">
    <a class="brand" href="index.html">
      <img src="assets/img/logo.jpg?v=2" alt="Samriddhi Tours &amp; Travels logo" width="70" height="70" />
      <span class="brand__name">Samriddhi<span class="brand__sub">Tours &amp; Travels</span></span>
    </a>
    <div class="header__cta">
      <a class="btn btn--sm" href="index.html">Back to site</a>
    </div>
  </div>
</header>

<main id="main">
  <section class="section">
    <div class="container">
      <div class="sec-head">
        <span class="eyebrow">Attribution</span>
        <h2>Photo credits</h2>
        <p>
          The photographs on this website are used under Creative Commons and public-domain
          licences from Wikimedia Commons and Openverse. Our thanks to the photographers listed
          below. The Samriddhi Tours &amp; Travels logo is the property of Samriddhi Tours &amp; Travels.
        </p>
      </div>

      <div class="table-wrap">
        <div class="table-scroll">
          <table class="rates">
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Title</th>
                <th scope="col">Photographer</th>
                <th scope="col">Licence</th>
                <th scope="col">Link</th>
              </tr>
            </thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>
        <div class="table-note">
          <span><b>${credits.length}</b> photographs, all licensed for commercial use.</span>
          <span>If you are a rights holder and would like a credit corrected or an image removed, please contact us and we will act immediately.</span>
        </div>
      </div>

      <div class="btn-row" style="margin-top:36px">
        <a class="btn btn--ghost" href="index.html">Back to home</a>
        <a class="btn btn--ghost" href="contact.html">Contact us</a>
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <div class="footer__bar" style="border-top:0">
      <span>&copy; <span data-year>2026</span> Samriddhi Tours &amp; Travels. All rights reserved.</span>
      <span><a href="index.html">Home</a> &middot; <a href="contact.html">Contact</a></span>
    </div>
  </div>
</footer>

<script src="assets/js/main.js" defer></script>
</body>
</html>
`;

await writeFile(path.join(ROOT, "credits.html"), html);

/* plain-text copy of the same data, for the project handover */
const md = [
  "# Photo credits",
  "",
  "Every photograph on this site is licensed for commercial use (CC BY, CC BY-SA, CC0,",
  "public domain or GODL-India). Several of those licences require visible attribution,",
  "which is why `credits.html` is published and linked from the footer of every page.",
  "",
  "Regenerate this file with `node scripts/build-credits.mjs`.",
  "",
  "| File | Title | Photographer | Licence | Source |",
  "| --- | --- | --- | --- | --- |",
  ...credits
    .slice()
    .sort((a, b) => a.file.localeCompare(b.file))
    .map(
      (c) =>
        `| \`${c.file}\` | ${c.title} | ${c.author} | ${c.license} | [link](${c.page}) |`
    ),
  "",
].join("\n");

await writeFile(path.join(ROOT, "CREDITS.md"), md);
console.log(`credits.html + CREDITS.md written — ${credits.length} entries`);
