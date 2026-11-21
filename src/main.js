import "./style.css";
import { content } from "./content.js";

// Steg 1: bara en enkel startsida som bevisar att allt fungerar.
document.querySelector("#app").innerHTML = `
  <section class="placeholder">
    <h1>${content.hero.brand}</h1>
    <p>${content.hero.tagline}</p>
  </section>
`;
