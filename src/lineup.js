// Startvyn: alla flaskor står bredvid varandra på vit bakgrund. Håller man musen
// över en flaska lyfter den. Klickar man zoomar vi in i flaskans landskap, där
// informationen om doften ligger till vänster. Inga bibliotek – bara CSS-övergångar.
import { content } from "./content.js";

// ---- Flaskfoton -------------------------------------------------------
// En bild per doft. Alla visas i samma stående ruta (proportion 950 : 1380), så
// för varje foto anger vi vilken del av bilden som ska visas:
//   size  = bildens storlek i pixlar [bredd, höjd]
//   crop  = utsnittet [x, y, bredd, höjd] i pixlar, med flaskan mitt i (höjd/bredd ≈ 1,45)
//   label = etiketten som procent av utsnittet [vänster, topp, bredd, höjd]; dit zoomar vi
// SÅ LÄGGER DU TILL ETT NYTT FOTO: lägg bilden i assets/media/ och kopiera en rad nedan.
const photo = (file) => new URL(`../assets/media/${file}`, import.meta.url).href;
const bottlePhotos = {
  granskog: { url: photo("granskog-flaska.jpg"), size: [1264, 848], crop: [404, 68, 499, 725], label: [28.5, 31.4, 44.1, 61.0] },
  bohuslan: { url: photo("bohuslan-flaska.jpg"), size: [1376, 768], crop: [450, 30, 475, 690], label: [26.1, 30.1, 48.2, 61.6] },
  sarek:    { url: photo("sarek-flaska.jpg"),    size: [2752, 1536], crop: [900, 60, 950, 1380], label: [26.1, 30.4, 48.9, 63.1] },
  aker:     { url: photo("aker-flaska.jpg"),     size: [1376, 768], crop: [450, 30, 475, 690], label: [26.1, 30.1, 48.2, 61.6] },
};

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

// Doftens text ska vara ljus när bakgrunden är mörk.
const DARK_VIEWS = ["granskog"];

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ZOOM_MS = REDUCED ? 0 : 1300;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Räknar ut CSS för att visa rätt utsnitt av fotot i flaskrutan.
function photoStyle(p) {
  const [iw, ih] = p.size;
  const [x, y, w, h] = p.crop;
  const px = iw > w ? (x / (iw - w)) * 100 : 0;
  const py = ih > h ? (y / (ih - h)) * 100 : 0;
  return `background-image:url(${p.url});background-size:${((iw / w) * 100).toFixed(2)}% auto;background-position:${px.toFixed(2)}% ${py.toFixed(2)}%`;
}

function bottleHtml(s) {
  const p = bottlePhotos[s.id];
  if (!p) return "";
  const [l, t, w, h] = p.label;
  return `
    <button class="bottle" type="button" data-id="${s.id}"
      aria-label="${esc(content.hero.open)} ${esc(s.name)}">
      <span class="bottle-shadow"></span>
      <span class="bottle-photo" style="${photoStyle(p)}"></span>
      <span class="bottle-anchor" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"></span>
      <span class="bottle-name">${esc(s.name)}</span>
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
      <div class="lineup-brand" aria-hidden="true"><p>${esc(h.brand)}</p><p>${esc(h.tagline)}</p></div>
      <div class="lineup-world">
        <div class="lineup-row" role="group" aria-label="${esc(h.imageAlt)}">
          ${items.map(bottleHtml).join("")}
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
  const world = root.querySelector(".lineup-world");
  let current = null; // { id, view, bottle }
  let timer = null;

  // Zooma så att flaskans etikett hamnar mitt på skärmen och fyller det mesta av bredden.
  function zoomTo(bottle) {
    const a = bottle.querySelector(".bottle-anchor").getBoundingClientRect();
    const w = world.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    const k = Math.min((s.width * 0.9) / a.width, (s.height * 1.05) / a.height);
    world.style.transformOrigin = `${ax - w.left}px ${ay - w.top}px`;
    world.style.transform = `translate(${s.left + s.width / 2 - ax}px, ${s.top + s.height / 2 - ay}px) scale(${k.toFixed(3)})`;
  }

  function open(id) {
    if (current) return;
    const view = root.querySelector(`#view-${id}`);
    const bottle = root.querySelector(`.bottle[data-id="${id}"]`);
    if (!view || !bottle) return;
    current = { id, view, bottle };

    onOpen();
    document.documentElement.classList.add("lineup-locked");
    bottle.classList.add("is-active"); // behåll "lyft"-läget under zoomen
    stage.classList.add("is-open");
    zoomTo(bottle);

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
    const { view, bottle } = current;
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
      bottle.classList.remove("is-active");
      document.documentElement.classList.remove("lineup-locked");
      onClose();
      bottle.focus({ preventScroll: true });
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

  root.querySelectorAll(".bottle").forEach((b) =>
    b.addEventListener("click", () => open(b.dataset.id))
  );
  root.querySelectorAll(".view-close").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // "Bli först att få den": stäng doftvyn, hoppa till väntelistan och förvälj doften.
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
