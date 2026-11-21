// Mjuk scroll (Lenis) kopplad till GSAP ScrollTrigger.
// Lenis bestämmer var sidan "är", ScrollTrigger läser av det för animationerna.
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

export function setupSmoothScroll() {
  // Vill besökaren ha mindre rörelse kör vi vanlig scroll utan utjämning.
  if (reducedMotion) return null;

  const lenis = new Lenis({
    lerp: 0.08, // lägre = mjukare och lugnare, högre = snabbare
    smoothWheel: true,
  });

  // Låt GSAP:s klocka driva Lenis, så går allt i samma takt.
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

// Sektionerna under hero tonar in lugnt när de kommer in i bild.
export function setupReveals() {
  if (reducedMotion) return;

  gsap.utils.toArray(".section, .footer").forEach((el) => {
    gsap.from(el.children, {
      opacity: 0,
      y: 24,
      duration: 1.4,
      ease: "power2.out",
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: "top 80%", once: true },
    });
  });
}

export { gsap, ScrollTrigger };
