# Samriddhi Tours &amp; Travels — website

A fast, mobile-first marketing website for **Samriddhi Tours &amp; Travels**, a taxi, cab and
tour operator based in Varanasi. Built as a plain static site (HTML, CSS, vanilla JavaScript)
so it can be hosted anywhere, loads quickly on Indian mobile networks, and can be edited by
anyone who can read HTML — no build step, no framework, no database.

---

## Pages

The structure and homepage section order follow the site the client asked us to model
(vikashtravelagency.com): a long homepage carrying everything, plus a page per service.

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero slider, About Us, Why Ride with Us, What We Offer, Book Your Taxi Ride, Choose Your Airport Rental, Varanasi Sight Seeing, Get Connected, Choose Your Taxi to Ride, Outstation Tour Packages, Call Us Now, Recent Rates, FAQ |
| `about.html` | Company story, values, how booking works, areas served |
| `taxi-rental.html` | Ten vehicles with capacity and four fares each, full rate card, inclusions/exclusions, quote form |
| `airport-rental.html` | Babatpur airport transfers — eight fixed fares, what's included, airport FAQ, booking form |
| `tour-plan.html` | Same-day trips, multi-day circuits, Himalaya &amp; Nepal tours, how outstation fares are calculated |
| `sightseeing.html` | Varanasi darshan guide — twelve places, three suggested itineraries, practical travel notes |
| `contact.html` | Contact details, online booking form, map, pre-booking FAQ |
| `credits.html` | Photo attribution (generated — see below) |

Navigation matches the reference: Home / About Us / Taxi Rental / Airport Rental / Tour Plan /
Varanasi Darshan / Contact, with a "Book a Taxi" button and a click-to-call block in the header.
The reference also has a "Pay Us" page holding a UPI QR code; add one if the client wants it.

---

## Running it locally

There is no build step. Either open `index.html` in a browser, or serve the folder:

```bash
npx http-server . -p 5599 -c-1
# then visit http://localhost:5599
```

A local server is recommended, since the Google Maps embed on the contact page does not
load over the `file://` protocol.

---

## Deploying

Upload the whole folder to any static host. All paths are relative, so it works from a
domain root or a subfolder.

- **Netlify / Vercel / Cloudflare Pages** — drag the folder into the dashboard, or connect the
  Git repository. No build command; the publish directory is the project root.
- **GitHub Pages** — push the folder and enable Pages on the branch root.
- **cPanel / shared hosting (Hostinger, GoDaddy, BigRock)** — upload the contents into
  `public_html` over FTP or the File Manager.

Canonical, Open Graph and sitemap URLs currently use `https://samriddhitoursagency.me`.
A root `CNAME` file is included for GitHub Pages.

---

## Things to update before going live

These are the values that were filled in from the logo and reasonable defaults. Confirm each
one with the client, then update it everywhere.

1. **Phone numbers** — currently `+91 93694 47334` (primary and WhatsApp) and `+91 94532 71750`.
   They appear as `tel:+919369447334` links, as `wa.me/919369447334` links, in
   `assets/js/main.js` (the `BIZ` object) and in the JSON-LD block in `index.html`.
2. **Email** — currently the placeholder `samriddhitoursandtravels@gmail.com`.
3. **Street address** — currently only `Varanasi, Uttar Pradesh 221001`. Add the shop or office
   address in the footer of every page, in the contact page card, and in the JSON-LD block.
4. **Google Maps embed** — `contact.html` points at Varanasi generally. Replace the `src` with the
   embed link from the client's Google Business Profile so the pin lands on the real office.
5. **Social links** — the Facebook, Instagram and YouTube icons currently point at `#`.
6. **Fares** — the rate cards in `index.html` and `fleet.html` use prevailing Varanasi market
   rates. Have the client confirm every figure before launch.
7. **"Since 2014" and the statistics** — years in business, trips completed, fleet size and the
   average rating in the stats band are placeholders. Replace with the client's real numbers.
8. **Reviews** — the three testimonials on the home page are illustrative. Swap in real
   customer reviews (ideally copied from the Google Business Profile) before launch.

A quick way to find every occurrence, from the project root:

```powershell
# Windows PowerShell
Select-String -Path *.html,assets\js\main.js -Pattern "9369447334|9453271750|samriddhitoursandtravels@gmail.com|221001"
```

```bash
# macOS / Linux
grep -rn -E "9369447334|9453271750|samriddhitoursandtravels@gmail.com|221001" *.html assets/js/main.js
```

---

## How the booking forms work

There is no server and no backend, which means nothing can break and there is nothing to pay
for. Every form (`<form data-wa-form="…">`) is intercepted by `assets/js/main.js`, formatted
into a readable message, and opened in WhatsApp addressed to the business number. The customer
presses send, and the enquiry lands in the client's WhatsApp with a copy on both sides.

This suits the way Indian travel agencies actually work, and it means no enquiry is ever lost
to a spam folder. If an emailed copy is wanted later, add a form service such as Formspree or
Web3Forms — the markup is already standard HTML with proper `name` attributes.

To change the destination number, edit one place:

```js
// assets/js/main.js
const BIZ = {
  whatsapp: "919369447334", // country code + number, digits only
  ...
};
```

---

## Photographs

All 53 photographs are stored locally in `assets/img/` and were sourced from Wikimedia Commons
and Openverse under licences that permit **commercial use** — CC BY, CC BY-SA, CC0, public
domain and GODL-India. Non-commercial (NC) and no-derivatives (ND) images are deliberately
excluded, since this is a commercial site.

Several of those licences require visible attribution, which is why `credits.html` exists and
is linked from the footer of every page. **Keep that page published.**

Helper scripts (Node 18+, no dependencies):

```bash
node scripts/fetch-images.mjs      # download any missing photos (--force re-downloads all)
node scripts/prune-licenses.mjs    # delete anything with an NC / ND / GFDL licence
node scripts/check-images.mjs      # verify every photo is a complete, usably large JPEG
node scripts/build-credits.mjs     # regenerate credits.html + CREDITS.md from credits.json
node scripts/check-links.mjs       # verify images, links, anchors, alt text and sprite icons
```

Run `check-links.mjs` after any edit — it catches typo'd image paths, dead internal links,
`#anchors` that point nowhere and images missing `alt` text.

Run `check-images.mjs` after any image work. A download can return HTTP 200 and still leave a
truncated file on disk, which renders as a broken image in the browser but looks fine in a
directory listing; this script reads each JPEG's header and end marker to catch that. Repair
sequence is `check-images.mjs --prune` followed by `fetch-images.mjs`.

`assets/img/credits.json` is the source of truth for attribution, and `CREDITS.md` is a
human-readable copy of the same data.

If the client supplies their own photographs of their cars, drivers and trips, replacing these
stock images is the single biggest improvement available — real vehicle photos convert far
better than stock, and the attribution obligation disappears entirely. Keep the same filenames
and everything continues to work.

---

## Project structure

```
.
├── index.html, about.html, fleet.html,
│   packages.html, sightseeing.html, contact.html, credits.html
├── robots.txt
├── sitemap.xml
├── CREDITS.md
├── assets
│   ├── css/style.css        # complete design system, ~1400 lines, no framework
│   ├── js/main.js           # nav, hero slider, reveals, counters, accordions, WhatsApp forms
│   └── img/                 # logo + 53 photographs + credits.json
└── scripts/                 # asset tooling, not needed at runtime
```

### Design notes

The palette is taken directly from the client logo — deep black with antique gold
(`#d9a53b`), set in Cinzel for the wordmark, Playfair Display for headings and Manrope for
body text. Colours, spacing and radii are CSS custom properties at the top of `style.css`, so
the whole site can be re-tinted by editing a handful of values.

### Accessibility &amp; performance

- Semantic landmarks, skip link, visible focus rings, `aria-current` on the active nav item,
  `aria-expanded` on the menu button and accordions.
- Animations are disabled automatically under `prefers-reduced-motion`.
- Lazy loading below the fold, `fetchpriority="high"` on the first hero image, fixed
  `width`/`height` on the logo to avoid layout shift.
- No JavaScript frameworks, no jQuery, no icon fonts — icons are an inline SVG sprite.

### SEO

Per-page titles, descriptions and canonical URLs; Open Graph and Twitter card tags;
`TravelAgency` JSON-LD structured data on the home page; a keyword-rich internal link block
for popular routes in the footer; plus `sitemap.xml` and `robots.txt`.

After launch, connect the domain to Google Search Console and create a Google Business Profile
for the agency — for a local taxi business that profile drives more enquiries than the website
itself, and the two reinforce each other.
