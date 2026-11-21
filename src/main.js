import "./style.css";
import { content } from "./content.js";
import { renderSections, setupWaitlist } from "./sections.js";
import { setupSmoothScroll, setupReveals } from "./scroll.js";

// Hero är än så länge en enkel platshållare – 3D-scenen kommer i ett senare steg.
document.querySelector("#app").innerHTML = `
  <section class="hero-placeholder">
    <h1>${content.hero.brand}</h1>
    <p>${content.hero.tagline}</p>
    <span class="scroll-hint">${content.hero.scrollHint}</span>
  </section>
  ${renderSections()}
`;

setupWaitlist();
setupSmoothScroll();
setupReveals();
