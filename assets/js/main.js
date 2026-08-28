/* ==========================================================================
   Samriddhi Tours & Travels — site scripts
   Vanilla JS, no dependencies. Loaded with `defer` on every page.
   ========================================================================== */

/* Business details live here so they can be changed in one place. */
const BIZ = {
  name: "Samriddhi Tours & Travels",
  whatsapp: "919369447334", // country code + number, digits only
  phonePrimary: "+919369447334",
  phoneSecondary: "+919453271750",
};

/* ------------------------------------------------------------------ helpers */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function toast(message) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add("is-show"));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("is-show"), 5200);
}

/* --------------------------------------------------------- sticky header */
function initHeader() {
  const header = $(".header");
  if (!header) return;
  const onScroll = () =>
    header.classList.toggle("is-stuck", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* --------------------------------------------------------- mobile nav */
function initNav() {
  const burger = $(".burger");
  const nav = $(".nav");
  if (!burger || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  };

  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  $$("a", nav).forEach((a) => a.addEventListener("click", close));
  window.addEventListener("keydown", (e) => e.key === "Escape" && close());
  window.addEventListener("resize", () => {
    if (window.innerWidth > 940) close();
  });
}

/* --------------------------------------------------------- hero slider */
function initHero() {
  const slides = $$(".hero__slide");
  const dotWrap = $(".hero__dots");
  if (slides.length < 2) return;

  let i = 0;
  let timer;

  const dots = slides.map((_, n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Show slide ${n + 1}`);
    b.addEventListener("click", () => {
      go(n);
      restart();
    });
    dotWrap?.appendChild(b);
    return b;
  });

  function go(n) {
    slides[i].classList.remove("is-active");
    dots[i].classList.remove("is-active");
    i = (n + slides.length) % slides.length;
    slides[i].classList.add("is-active");
    dots[i].classList.add("is-active");
  }

  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 6000);
  };

  go(0);
  restart();
  document.addEventListener("visibilitychange", () =>
    document.hidden ? clearInterval(timer) : restart()
  );
}

/* --------------------------------------------------------- scroll reveal */
function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry, n) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add("is-in"), n * 70);
        io.unobserve(entry.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -60px" }
  );

  items.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------- counters */
function initCounters() {
  const nums = $$("[data-count]");
  if (!nums.length || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const dur = 1600;

        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = target * eased;
          el.textContent =
            (target % 1 ? value.toFixed(1) : Math.round(value).toLocaleString("en-IN")) +
            suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      }),
    { threshold: 0.4 }
  );

  nums.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------- accordion */
function initAccordions() {
  $$(".acc").forEach((acc) => {
    const btn = $(".acc__q", acc);
    const panel = $(".acc__a", acc);
    if (!btn || !panel) return;

    btn.setAttribute("aria-expanded", acc.classList.contains("is-open") ? "true" : "false");
    btn.addEventListener("click", () => {
      const group = acc.closest("[data-acc-group]");
      if (group) {
        $$(".acc.is-open", group).forEach((other) => {
          if (other !== acc) {
            other.classList.remove("is-open");
            $(".acc__q", other)?.setAttribute("aria-expanded", "false");
          }
        });
      }
      const open = acc.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
}

/* --------------------------------------------------------- booking forms */
const LABELS = {
  tripType: "Trip type",
  pickup: "Pickup",
  drop: "Drop / destination",
  date: "Date",
  time: "Pickup time",
  vehicle: "Vehicle",
  passengers: "Passengers",
  days: "Days",
  name: "Name",
  phone: "Phone",
  email: "Email",
  subject: "Subject",
  message: "Message",
};

function initForms() {
  /* today as the minimum selectable date */
  const today = new Date().toISOString().split("T")[0];
  $$('input[type="date"]').forEach((el) => {
    if (!el.min) el.min = today;
  });

  $$("form[data-wa-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!form.reportValidity()) return;

      const heading = form.dataset.waForm || "Booking enquiry";
      const lines = [`*${heading}* — ${BIZ.name}`, ""];

      new FormData(form).forEach((value, key) => {
        const v = String(value).trim();
        if (!v) return;
        lines.push(`*${LABELS[key] || key}:* ${v}`);
      });

      lines.push("", "Please share the fare and confirm availability. Thank you.");

      const url = `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent(
        lines.join("\n")
      )}`;

      window.open(url, "_blank", "noopener");
      toast("Opening WhatsApp with your enquiry — press send to reach us.");
      form.reset();
      $$('input[type="date"]', form).forEach((el) => (el.min = today));
    });
  });
}

/* --------------------------------------------------------- Kashi devotion ribbon */
function initKashiBand() {
  if (document.querySelector(".kashi-band")) return;
  const phrases = [
    "ॐ",
    "हर हर महादेव",
    "काशी विश्वनाथ",
    "गंगा मैया की जय",
    "सनातन धर्म",
    "बाबा विश्वनाथ की नगरी",
    "Devotion of Kashi",
    "Heritage · Dharma · Darshan",
  ];
  const item = phrases.map((p) => `${p}<i>✦</i>`).join("");
  const band = document.createElement("div");
  band.className = "kashi-band";
  band.setAttribute("aria-hidden", "true");
  band.innerHTML = `<div class="kashi-band__track"><span>${item}</span><span>${item}</span></div>`;
  const topbar = $(".topbar");
  const header = $(".header");
  (topbar || header)?.insertAdjacentElement("afterend", band);
}

let taxiSeq = 0;

function uniquifySvgIds(root) {
  taxiSeq += 1;
  const prefix = `taxi${taxiSeq}-`;
  root.querySelectorAll("[id]").forEach((el) => {
    const old = el.getAttribute("id");
    const next = prefix + old;
    el.setAttribute("id", next);
    root.querySelectorAll(`[fill="url(#${old})"]`).forEach((n) => {
      n.setAttribute("fill", `url(#${next})`);
    });
  });
}

async function inlineTaxi(container) {
  if (!container || container.querySelector("svg")) return;
  try {
    const res = await fetch("assets/img/taxi.svg");
    if (!res.ok) throw new Error("taxi");
    container.innerHTML = await res.text();
    const svg = container.querySelector("svg");
    if (svg) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-hidden", "true");
      uniquifySvgIds(svg);
    }
  } catch {
    container.innerHTML =
      '<img src="assets/img/taxi.svg" alt="" width="560" height="265" />';
  }
}

function driveSceneMarkup() {
  const trees = [7, 22, 38, 54, 69, 86, 107, 122, 138, 154, 169, 186]
    .map((left) => `<span class="tree" style="left:${left}%"></span>`)
    .join("");
  const clouds = [
    [8, 18, 44],
    [28, 8, 36],
    [52, 22, 52],
    [78, 10, 40],
    [108, 18, 44],
    [128, 8, 36],
    [152, 22, 52],
    [178, 10, 40],
  ]
    .map(
      ([left, top, w]) =>
        `<i class="cloud" style="left:${left}%;top:${top}%;width:${w}px"></i>`
    )
    .join("");

  return `
    <span class="drive-scene__sun"></span>
    <div class="drive-scene__clouds">${clouds}</div>
    <div class="drive-scene__city">
      <img src="assets/img/city-strip.svg" alt="" />
      <img src="assets/img/city-strip.svg" alt="" />
    </div>
    <div class="drive-scene__trees">${trees}</div>
    <div class="drive-scene__road"><span class="drive-scene__dashes"></span></div>
    <div class="drive-scene__taxi-wrap"><div class="drive-scene__taxi"></div></div>
  `;
}

async function mountDriveScene(host, compact) {
  if (!host || host.querySelector(".drive-scene__taxi")) return;
  host.classList.add("drive-scene");
  if (compact) host.classList.add("drive-scene--compact");
  host.innerHTML = driveSceneMarkup();
  await inlineTaxi(host.querySelector(".drive-scene__taxi"));
}

function initHeroChrome() {
  const hero = $(".hero");
  if (!hero) return;

  if (!$(".hero__diyas", hero)) {
    const diyas = document.createElement("div");
    diyas.className = "hero__diyas";
    diyas.setAttribute("aria-hidden", "true");
    diyas.innerHTML = "<i class='diya'></i>".repeat(6);
    hero.appendChild(diyas);
  }

  const inner = $(".hero__in", hero);
  if (inner && !$(".hero__glass", hero)) {
    const stage = document.createElement("div");
    stage.className = "hero__stage";
    stage.setAttribute("aria-hidden", "true");
    stage.innerHTML = `<img class="hero__incoming" src="assets/img/taxi-hero.png?v=2" alt="" />`;

    const glass = document.createElement("div");
    glass.className = "hero__glass";
    while (inner.firstChild) glass.appendChild(inner.firstChild);

    if (!$(".mantra", glass)) {
      const mantra = document.createElement("p");
      mantra.className = "mantra";
      mantra.textContent = "हर हर महादेव  ·  काशी विश्वनाथ";
      glass.prepend(mantra);
    }

    inner.append(glass, stage);
  }
}

function initPageheadCar() {
  $$(".pagehead").forEach((el) => {
    if ($(".pagehead__incoming", el)) return;
    const img = document.createElement("img");
    img.className = "pagehead__incoming";
    img.src = "assets/img/taxi-hero.png?v=2";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    el.appendChild(img);
  });
}

/* Framer Motion (Motion One) — spring reveals, car, card tilt */
function initMotion() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  $$(".card, .kashi-chip").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });
}

function bootMotion() {
  initMotion();
}

/* --------------------------------------------------------- misc */
function initMisc() {
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* prefill the booking form when a fleet/package card asks for a quote */
  $$("[data-prefill]").forEach((link) => {
    link.addEventListener("click", () => {
      const { prefillField = "vehicle", prefill } = link.dataset;
      const field = $(`#book [name="${prefillField}"]`);
      if (!field) return;
      const match = [...(field.options || [])].find((o) =>
        o.value.toLowerCase().includes(prefill.toLowerCase())
      );
      field.value = match ? match.value : prefill;
      field.classList.add("is-set");
    });
  });

  $$("img[src*='car-']").forEach((img) => {
    img.closest(".card__media")?.classList.add("card__media--car");
  });

  /* graceful fallback if a photo is missing */
  $$("img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        if (img.dataset.failed) return;
        img.dataset.failed = "1";
        img.style.background =
          "linear-gradient(135deg,#fff8ef,#ffe0a8 60%,#ff9900)";
        img.removeAttribute("src");
      },
      { once: true }
    );
  });
}

/* --------------------------------------------------------- boot */
document.addEventListener("DOMContentLoaded", () => {
  initKashiBand();
  initHeroChrome();
  initPageheadCar();
  initHeader();
  initNav();
  initHero();
  initReveal();
  initCounters();
  initAccordions();
  initForms();
  initMisc();
  bootMotion();
});
