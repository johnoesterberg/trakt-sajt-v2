// Startvyn: flaskorna står i rad. Klickar man på en flaska zoomar vi in i
// flaskans landskap, där informationen om doften ligger till vänster.
// Ingen scroll-animation och inga bibliotek – bara CSS-övergångar.
import { content } from "./content.js";

// ---- Bilder -----------------------------------------------------------
// Startbilden med alla flaskor. Byt filen mot en bättre upplösning vid behov
// (behåll gärna proportionerna 2:1, annars får flaskornas klickytor nedan justeras).
const lineupUrl = new URL("../assets/media/startbild-flaskor.webp", import.meta.url).href;

// Landskapsbild per doft. Saknas en bild används doftens färg som bakgrund.
// SÅ LÄGGER DU TILL EN: lägg bilden i assets/media/ och lägg till en rad här.
const landscapes = {
  sarek: new URL("../assets/media/sarek-landskap.jpg", import.meta.url).href,
};
// Valfri film som spelar över landskapsbilden (bara Sarek har en än).
const films = {
  sarek: {
    desktop: new URL("../assets/media/sarek-film-loop.mp4", import.meta.url).href,
    mobile: new URL("../assets/media/sarek-film-loop-mobil.mp4", import.meta.url).href,
  },
};

// ---- Var flaskorna sitter i startbilden --------------------------------
// Mått i procent av bilden. x = flaskans vänsterkant, w = bredd.
// y/h/labelY gäller alla flaskor (de står på samma linje).
const BOTTLE_TOP = 30.5; // %
const BOTTLE_HEIGHT = 57; // %
const LABEL_Y = 65; // etikettens mitt, % från bildens topp (dit zoomar vi)
const SPOTS = {
  granskog: { x: 15.0, w: 11.7 },
  bohuslan: { x: 40.5, w: 11.4 },
  sarek: { x: 64.2, w: 11.4 },
  aker: { x: 87.9, w: 11.3 },
};

// Doftens text ska vara ljus när bakgrunden är mörk.
const DARK_VIEWS = ["granskog"];

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ZOOM_MS = REDUCED ? 0 : 1300;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function spotHtml(s) {
  const p = SPOTS[s.id];
  if (!p) return "";
  return `
    <button class="spot" type="button" data-id="${s.id}"
      style="left:${p.x}%;top:${BOTTLE_TOP}%;width:${p.w}%;height:${BOTTLE_HEIGHT}%"
      aria-label="${esc(content.hero.open)} ${esc(s.name)}">
      <span class="spot-name">${esc(s.name)}</span>
    </button>`;
}

function viewHtml(s) {
  const h = content.hero;
  const bg = landscapes[s.id];
  const film = films[s.id];
  const dark = DARK_VIEWS.includes(s.id);
  return `
    <article class="scent-view ${dark ? "view--dark" : ""}" id="view-${s.id}" data-id="${s.id}"
      style="--scent:${s.color}" aria-hidden="true" aria-label="${esc(s.name)}">
      <div class="view-bg ${bg ? "" : "view-bg--plain"}" ${bg ? `style="background-image:url(${bg})"` : ""}></div>
      ${film ? `<video class="view-film" muted loop playsinline preload="none"
        data-src="${film.desktop}" data-src-mobile="${film.mobile}"></video>` : ""}
      <div class="view-shade"></div>
      <div class="view-text">
        <p class="view-eyebrow">${esc(h.brand)} · ${esc(h.product)}</p>
        <h2>${esc(s.name)}</h2>
        <p class="view-notes">${esc(s.notes)}</p>
        <p class="view-story">${esc(s.story)}</p>
        <p class="view-detail">${esc(s.detail)}</p>
        <a class="view-cta" href="#vantelista" data-scent="${esc(s.name)}">${esc(h.cta)}</a>
      </div>
      <button class="view-close" type="button">← ${esc(h.back)}</button>
    </article>`;
}

export function lineupHtml() {
  const h = content.hero;
  const items = content.scents.items;
  return `
  <section class="lineup" id="hero">
    <h1 class="sr-only">${esc(h.brand)} – ${esc(h.tagline)}</h1>
    <div class="lineup-stage">
      <div class="lineup-ambient" style="background-image:url(${lineupUrl})"></div>
      <div class="lineup-scroll">
        <div class="lineup-world">
          <img class="lineup-img" src="${lineupUrl}" alt="${esc(h.imageAlt)}" />
          ${items.map(spotHtml).join("")}
        </div>
      </div>
      <p class="lineup-hint">${esc(h.hint)}</p>
      ${items.map(viewHtml).join("")}
    </div>
  </section>`;
}

// onOpen/onClose används för att pausa den mjuka sidscrollen medan en doft visas.
export function initLineup({ onOpen = () => {}, onClose = () => {} } = {}) {
  const root = document.querySelector("#hero");
  if (!root) return;
  const stage = root.querySelector(".lineup-stage");
  const scroller = root.querySelector(".lineup-scroll");
  const world = root.querySelector(".lineup-world");
  let current = null; // { id, view, spot }
  let timer = null;

  // På smala skärmar är startbilden bredare än skärmen: börja i mitten.
  const center = () => (scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2);
  center();
  window.addEventListener("load", center);

  function zoomTransform(id) {
    const p = SPOTS[id];
    const w = world.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    // Punkten vi zoomar mot (etikettens mitt), i världens egna pixlar.
    const px = ((p.x + p.w / 2) / 100) * w.width;
    const py = (LABEL_Y / 100) * w.height;
    // Samma punkt i skärmens koordinater, och skärmens mitt.
    const vx = w.left + px;
    const vy = w.top + py;
    const cx = s.left + s.width / 2;
    const cy = s.top + s.height / 2;
    const k = (s.width * 0.9) / ((p.w / 100) * w.width);
    world.style.transformOrigin = `${px}px ${py}px`;
    world.style.transform = `translate(${cx - vx}px, ${cy - vy}px) scale(${k.toFixed(3)})`;
  }

  function open(id) {
    if (current) return;
    const view = root.querySelector(`#view-${id}`);
    const spot = root.querySelector(`.spot[data-id="${id}"]`);
    if (!view) return;
    current = { id, view, spot };

    onOpen();
    document.documentElement.classList.add("lineup-locked");
    stage.classList.add("is-open");
    zoomTransform(id);

    // Landskapet tonas in när zoomen är ungefär halvvägs.
    clearTimeout(timer);
    timer = setTimeout(() => {
      view.classList.add("is-open");
      view.setAttribute("aria-hidden", "false");
      view.querySelector(".view-close").focus({ preventScroll: true });
      startFilm(view);
    }, ZOOM_MS * 0.5);
  }

  function close() {
    if (!current) return;
    const { view, spot } = current;
    current = null;
    clearTimeout(timer);

    view.classList.remove("is-open");
    view.setAttribute("aria-hidden", "true");
    const film = view.querySelector(".view-film");
    if (film) film.pause();

    // Zooma ut igen medan landskapet tonas bort.
    setTimeout(() => {
      world.style.transform = "";
      stage.classList.remove("is-open");
    }, ZOOM_MS * 0.25);
    setTimeout(() => {
      document.documentElement.classList.remove("lineup-locked");
      onClose();
      center();
      spot?.focus({ preventScroll: true });
    }, ZOOM_MS);
  }

  function startFilm(view) {
    const film = view.querySelector(".view-film");
    if (!film || REDUCED) return;
    if (!film.src) {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      film.src = mobile ? film.dataset.srcMobile : film.dataset.src;
      film.addEventListener("playing", () => film.classList.add("is-on"), { once: true });
    }
    film.play().catch(() => {});
  }

  root.querySelectorAll(".spot").forEach((b) =>
    b.addEventListener("click", () => open(b.dataset.id))
  );
  root.querySelectorAll(".view-close").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // "Anmäl mig": stäng doftvyn, hoppa till väntelistan och förvälj doften.
  root.querySelectorAll(".view-cta").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const select = document.querySelector(".waitlist-form select");
      if (select) select.value = a.dataset.scent;
      close();
      setTimeout(() => {
        document.querySelector("#vantelista")?.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      }, ZOOM_MS + 50);
    })
  );
}
