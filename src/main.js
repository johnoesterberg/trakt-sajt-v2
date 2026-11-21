import "./style.css";
import { content } from "./content.js";
import { renderSections, setupWaitlist } from "./sections.js";
import { setupSmoothScroll, setupReveals, reducedMotion } from "./scroll.js";
// Lättare webbversioner (originalen ligger orörda i assets/original/).
import bottleUrl from "../assets/media/sarek-flaska.jpg?url";
import paintUrl from "../assets/media/sarek-landskap.jpg?url";
import photoUrl from "../assets/media/sarek-foto.jpg?url";
import filmUrl from "../assets/media/sarek-film-loop.mp4?url";
import filmUrlMobile from "../assets/media/sarek-film-loop-mobil.mp4?url";

const h = content.hero;

// Hero: en hög sektion (800vh) med en scen som sitter fast medan man skrollar.
// Vill besökaren ha mindre rörelse visas bara flaskan, utan zoom.
const heroHtml = reducedMotion
  ? `
  <section class="hero hero--static">
    <div class="t-brand"><h1>${h.brand}</h1><p>${h.tagline}</p></div>
    <img class="static-bottle" src="${bottleUrl}" alt="${h.imageAlt}" />
    <p class="hero-closing">${h.closing}</p>
  </section>`
  : `
  <section class="hero" id="hero">
    <div class="hero-stage" role="img" aria-label="${h.imageAlt}">
      <div class="hero-world">
        <img class="w-bottle" src="${bottleUrl}" alt="" />
        <div class="w-paper"></div>
        <div class="w-paint"></div>
      </div>
      <img class="layer layer-photo" src="${photoUrl}" alt="" />
      <video class="layer layer-film" muted loop playsinline preload="auto"></video>
      <div class="hero-text">
        <div class="t t-brand"><h1>${h.brand}</h1><p>${h.tagline}</p></div>
        <p class="t t-closing">${h.closing}</p>
        <span class="t t-hint">${h.scrollHint}</span>
      </div>
      <div class="hero-loader" aria-live="polite">
        <span>${h.brand}</span><i></i><small>${h.loading}</small>
      </div>
    </div>
  </section>`;

document.querySelector("#app").innerHTML = heroHtml + renderSections();

setupWaitlist();
setupSmoothScroll();
setupReveals();

if (!reducedMotion) {
  const section = document.querySelector("#hero");
  import("./hero/hero.js")
    .then(({ initHero }) => initHero({ section, paintUrl, filmUrl, filmUrlMobile }))
    .then(() => section.classList.add("is-ready"))
    .catch((err) => {
      console.error("Hero-scenen kunde inte starta:", err);
      section.classList.add("is-ready", "is-failed");
    });
}
