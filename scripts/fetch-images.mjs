/**
 * Downloads freely-licensed photos into assets/img and writes attribution data.
 *
 * Sources: Wikimedia Commons API (primary), Openverse API (fallback).
 * Every file downloaded is recorded in assets/img/credits.json + CREDITS.md so the
 * attribution requirements of CC-BY / CC-BY-SA licensed photos are satisfiable.
 *
 * Run: node scripts/fetch-images.mjs          (skips files that already exist)
 *      node scripts/fetch-images.mjs --force  (re-downloads everything)
 */
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "assets", "img");
const FORCE = process.argv.includes("--force");
const UA = "SamriddhiToursSiteBuilder/1.0 (static site asset fetch)";

/** output name -> Wikimedia Commons search queries, in priority order */
const TARGETS = {
  // hero slider
  "hero-1": ["Ganga Aarti Dashashwamedh Ghat", "Dashashwamedh Ghat Varanasi", "Ganga Aarti Varanasi"],
  "hero-2": ["Boats Ganges Varanasi sunrise", "Assi Ghat Varanasi", "Varanasi ghats panorama"],
  "hero-3": ["Kashi Vishwanath Temple Varanasi", "Dhamek Stupa Sarnath", "Sarnath"],
  "hero-4": ["Assi Ghat Varanasi", "Varanasi boats Ganges", "Dashashwamedh Ghat Varanasi"],

  // supporting imagery
  "about-boat": ["Varanasi boats Ganges", "Ghats of Varanasi", "Ganges river Varanasi"],
  "cta-road": ["Manikarnika Ghat Varanasi", "Ghats of Varanasi", "Ganges river Varanasi"],
  "page-fleet": ["Ganga Aarti Dashashwamedh Ghat", "Dashashwamedh Ghat Varanasi", "Varanasi aarti"],
  "page-packages": ["Boats Ganges Varanasi sunrise", "Assi Ghat Varanasi", "Varanasi ghats panorama"],
  "page-contact": ["Varanasi ghats evening", "Ganges Varanasi", "Varanasi"],
  "page-about": ["Manikarnika Ghat Varanasi", "Ghats of Varanasi", "Varanasi city"],
  "page-sightseeing": ["Tulsi Manas Mandir", "Varanasi temple", "Sarnath Varanasi"],

  // fleet
  "car-dzire": ["Maruti Suzuki Dzire", "Maruti Suzuki Swift Dzire", "Suzuki Dzire"],
  "car-ertiga": ["Maruti Suzuki Ertiga", "Suzuki Ertiga", "Maruti Suzuki XL6"],
  "car-innova": ["Toyota Innova", "Toyota Kijang Innova", "Toyota Innova second generation"],
  "car-crysta": ["Toyota Innova Crysta", "Toyota Innova Crysta India", "Toyota Innova"],
  "car-city": ["Honda City sedan", "Honda City fifth generation", "Honda City India"],
  "car-tempo": ["Force Traveller", "Tempo Traveller", "Force Motors Traveller"],
  "car-bus": ["Tourist bus India", "Ashok Leyland bus", "Volvo bus India"],
  "car-fortuner": ["Toyota Fortuner", "Toyota Fortuner second generation", "Toyota SW4"],
  "car-scorpio": ["Mahindra Scorpio", "Mahindra Scorpio N", "Mahindra Bolero"],
  "car-luxury": ["Mercedes-Benz E-Class W213", "Audi A6 C8", "BMW 5 Series G30"],

  // Varanasi sightseeing
  "spot-aarti": ["Ganga Aarti Varanasi", "Ganga Aarti", "Aarti Dashashwamedh"],
  "spot-vishwanath": ["Kashi Vishwanath Temple", "Kashi Vishwanath Dham", "Vishwanath Temple Varanasi"],
  "spot-sarnath": ["Dhamek Stupa", "Sarnath archaeological site", "Sarnath Buddha"],
  "spot-tulsi": ["Tulsi Manas Mandir", "Tulsi Manas Temple Varanasi", "Marble temple Varanasi"],
  "spot-durga": ["Durga Kund Varanasi", "Durga Temple Varanasi", "Durga Mandir Varanasi"],
  "spot-bhu": ["Banaras Hindu University", "Vishwanath Temple BHU", "BHU campus"],
  "spot-bharatmata": ["Bharat Mata Mandir Varanasi", "Bharat Mata temple", "Mahatma Gandhi Kashi Vidyapith"],
  "spot-sankatmochan": ["Sankat Mochan Hanuman Temple", "Hanuman temple Varanasi", "Hanuman Mandir"],
  "spot-assi": ["Assi Ghat", "Assi Ghat Varanasi sunrise", "Varanasi ghat morning"],
  "spot-manikarnika": ["Manikarnika Ghat", "Harishchandra Ghat", "Varanasi ghat"],
  "spot-ramnagar": ["Ramnagar Fort Varanasi", "Ramnagar Fort", "Fort Varanasi"],
  "spot-alamgir": ["Alamgir Mosque Varanasi", "Panchganga Ghat", "Varanasi skyline"],

  // outstation packages
  "pkg-vindhyachal": ["Vindhyavasini Temple", "Vindhyachal Mirzapur", "Mirzapur Uttar Pradesh"],
  "pkg-bodhgaya": ["Mahabodhi Temple Bodh Gaya", "Bodh Gaya", "Great Buddha Statue Bodh Gaya"],
  "pkg-ayodhya": ["Ram Mandir Ayodhya", "Ayodhya", "Saryu river Ayodhya"],
  "pkg-mathura": ["Prem Mandir Vrindavan", "Banke Bihari Temple", "Vrindavan"],
  "pkg-chunar": ["Chunar Fort", "Chunar", "Chunar Fort Mirzapur"],
  "pkg-maihar": ["Sharda Devi Temple Maihar", "Maihar", "Maihar temple"],
  "pkg-ujjain": ["Mahakaleshwar Jyotirlinga", "Ujjain Mahakal", "Ram Ghat Ujjain"],
  "pkg-haridwar": ["Har Ki Pauri Haridwar", "Haridwar", "Ganga Aarti Haridwar"],
  "pkg-prayagraj": ["Triveni Sangam Prayagraj", "Kumbh Mela Prayagraj", "Allahabad Sangam"],
  "pkg-nepal": ["Pashupatinath Temple Kathmandu", "Kathmandu Durbar Square", "Boudhanath"],
  "pkg-darjeeling": ["Darjeeling Himalayan Railway", "Darjeeling tea garden", "Kangchenjunga Darjeeling"],
  "pkg-sikkim": ["Tsomgo Lake", "Gangtok", "Rumtek Monastery"],
  "pkg-badrinath": ["Badrinath Temple", "Badrinath", "Alaknanda Badrinath"],
  "pkg-kedarnath": ["Kedarnath Temple", "Kedarnath", "Kedarnath valley"],
  "pkg-puri": ["Jagannath Temple Puri", "Puri beach", "Konark Sun Temple"],
  "pkg-lucknow": ["Bara Imambara", "Rumi Darwaza Lucknow", "Lucknow"],
  "pkg-gaya": ["Vishnupad Temple Gaya", "Gaya Bihar", "Falgu river Gaya"],
  "pkg-chitrakoot": ["Chitrakoot", "Ram Ghat Chitrakoot", "Chitrakoot waterfall"],
  "pkg-khajuraho": ["Khajuraho temples", "Kandariya Mahadeva Temple", "Khajuraho"],
  "pkg-agra": ["Taj Mahal", "Agra Fort", "Fatehpur Sikri"],
};

const BAD_TITLE =
  /(\.svg|\.tif|logo|coat of arms|seal|map|diagram|chart|flag|banner|signature|stamp|coin|plaque|poster|screenshot|graph|locator|blank|template|icon)/i;

/* Licences a commercial travel business should not rely on: non-commercial,
   no-derivatives (we resize and crop), and the viral GFDL documentation licence. */
const BAD_LICENCE = /(\bNC\b|\bND\b|NON-?COMMERCIAL|NODERIV|GFDL|FAIR USE|ALL RIGHTS)/i;

const usedTitles = new Set();
const credits = [];

const stripHtml = (s = "") =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

async function api(url) {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function commonsCandidates(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    "&generator=search&gsrnamespace=6&gsrlimit=18&gsrsearch=" +
    encodeURIComponent(`filetype:bitmap ${query}`) +
    "&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1600";

  const data = await api(url).catch(() => null);
  const pages = data?.query?.pages;
  if (!pages) return [];

  return Object.values(pages)
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .map((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii || BAD_TITLE.test(p.title)) return null;
      const { width = 0, height = 1 } = ii;
      if (width < 1000 || width / height < 1.15 || width / height > 2.6) return null;
      const meta = ii.extmetadata || {};
      const licence = stripHtml(meta.LicenseShortName?.value) || "";
      if (BAD_LICENCE.test(licence)) return null;
      return {
        key: p.title,
        url: ii.thumburl || ii.url,
        credit: {
          key: p.title,
          source: "Wikimedia Commons",
          title: p.title.replace(/^File:/, ""),
          author: stripHtml(meta.Artist?.value) || "Unknown",
          license: licence || "see source page",
          page: ii.descriptionurl,
        },
      };
    })
    .filter(Boolean);
}

async function openverseCandidates(query) {
  /* license_type=commercial,modification keeps out NC / ND photos, which a
     commercial travel business may not use. */
  const url =
    "https://api.openverse.org/v1/images/?page_size=12&aspect_ratio=wide" +
    "&license_type=commercial,modification&q=" +
    encodeURIComponent(query);
  const data = await api(url).catch(() => null);
  if (!data?.results) return [];

  return data.results
    .filter((r) => r.url && !BAD_TITLE.test(r.title || ""))
    .map((r) => ({
      key: `ov:${r.id}`,
      url: r.url,
      credit: {
        key: `ov:${r.id}`,
        source: r.source || "Openverse",
        title: r.title || query,
        author: r.creator || "Unknown",
        license: `${(r.license || "").toUpperCase()} ${r.license_version || ""}`.trim(),
        page: r.foreign_landing_url || r.url,
      },
    }));
}

/** width/height from the first SOFn marker, or null if the JPEG is unreadable */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
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

/* A download can succeed at the HTTP level and still land a truncated file on
   disk, which renders as a broken image. Validate before writing, never after. */
async function download(url, dest) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 40_000) throw new Error(`too small (${(buf.length / 1024) | 0}KB)`);

  const dim = jpegSize(buf);
  if (!dim) throw new Error("unreadable JPEG");
  if (dim.width < 1000) throw new Error(`only ${dim.width}px wide`);

  const complete = buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;
  if (!complete) throw new Error("truncated (no end marker)");

  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const existing = new Set(await readdir(OUT).catch(() => []));
  const failed = [];

  /* keep credits from earlier runs so partial re-fetches don't lose attribution */
  const prior = JSON.parse(
    await readFile(path.join(OUT, "credits.json"), "utf8").catch(() => "[]")
  );
  for (const c of prior) {
    credits.push(c);
    if (c.key) usedTitles.add(c.key);
  }

  for (const [name, queries] of Object.entries(TARGETS)) {
    const file = `${name}.jpg`;
    const dest = path.join(OUT, file);

    if (!FORCE && existing.has(file) && existsSync(dest)) {
      console.log(`skip  ${file}`);
      continue;
    }

    let done = false;
    for (const query of queries) {
      const pools = [await commonsCandidates(query), await openverseCandidates(query)];
      for (const pool of pools) {
        for (const cand of pool) {
          if (usedTitles.has(cand.key)) continue;
          try {
            const size = await download(cand.url, dest);
            usedTitles.add(cand.key);
            credits.push({ file, ...cand.credit });
            console.log(
              `ok    ${file}  <- "${query}"  ${(size / 1024) | 0}KB  [${cand.credit.license}]`
            );
            done = true;
            break;
          } catch {
            /* next candidate */
          }
        }
        if (done) break;
      }
      if (done) break;
    }
    if (!done) {
      failed.push(file);
      console.log(`FAIL  ${file}`);
    }
  }

  if (credits.length) {
    await writeFile(
      path.join(OUT, "credits.json"),
      JSON.stringify(credits, null, 2)
    );
    const md = [
      "# Photo credits",
      "",
      "All photography on this site was sourced from Wikimedia Commons / Openverse under",
      "free licences. Keep this file (and the credits page) published to stay compliant with",
      "the CC-BY and CC-BY-SA attribution requirements.",
      "",
      "| File | Title | Author | Licence | Source |",
      "| --- | --- | --- | --- | --- |",
      ...credits.map(
        (c) =>
          `| \`${c.file}\` | ${c.title} | ${c.author} | ${c.license} | [link](${c.page}) |`
      ),
      "",
    ].join("\n");
    await writeFile(path.join(ROOT, "CREDITS.md"), md);
  }

  console.log(
    `\ndone — ${credits.length} downloaded, ${failed.length} failed${
      failed.length ? ": " + failed.join(", ") : ""
    }`
  );
}

main();
