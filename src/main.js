import "./style.css";
import { content } from "./content.js";
import { renderSections, setupWaitlist } from "./sections.js";
import { setupSmoothScroll, setupReveals, reducedMotion } from "./scroll.js";
import labelUrl from "../assets/etikett-sarek-parfym.png?url";
import staticUrl from "../assets/parfym.png?url";

const h = content.hero;

// Hero: en hög sektion (500vh) med en scen som sitter fast medan man skrollar.
// Vill besökaren ha mindre rörelse visas en stillbild i stället.
const heroHtml = reducedMotion
  ? `
  <section class="hero hero--static">
    <div class="t-brand"><h1>${h.brand}</h1><p>${h.tagline}</p></div>
    <div class="static-bottle" role="img" aria-label="${h.imageAlt}"
         style="background-image:url(${staticUrl})"></div>
    <p class="hero-product">${h.product}</p>
    <p class="hero-notes">${h.notes}</p>
    <p class="hero-closing">${h.closing}</p>
  </section>`
  : `
  <section class="hero" id="hero">
    <div class="hero-stage">
      <canvas class="hero-canvas" aria-label="${h.imageAlt}" role="img"></canvas>
      <div class="hero-text">
        <div class="t t-brand"><h1>${h.brand}</h1><p>${h.tagline}</p></div>
        <p class="t t-product">${h.product}</p>
        <p class="t t-notes">${h.notes}</p>
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
  // 3D-koden laddas separat så att resten av sidan syns direkt.
  const section = document.querySelector("#hero");
  import("./hero/hero.js")
    .then(({ initHero }) =>
      initHero({ section, canvas: section.querySelector(".hero-canvas"), labelUrl })
    )
    .then(() => section.classList.add("is-ready"))
    .catch((err) => {
      console.error("3D-scenen kunde inte starta:", err);
      section.classList.add("is-ready", "is-failed");
    });
}
