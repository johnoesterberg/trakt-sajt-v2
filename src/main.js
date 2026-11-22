import "./style.css";
import { renderSections, setupWaitlist } from "./sections.js";
import { setupSmoothScroll, setupReveals } from "./scroll.js";
import { lineupHtml, initLineup } from "./lineup.js";

// Startvyn (flaskorna) ligger överst, sedan resten av sidan.
document.querySelector("#app").innerHTML = lineupHtml() + renderSections();

setupWaitlist();
const lenis = setupSmoothScroll();
setupReveals();

// Medan en doft visas ska sidan inte kunna skrollas bakom.
initLineup({
  onOpen: () => lenis?.stop(),
  onClose: () => lenis?.start(),
});
