// Kopplar ihop hero-scenen med scrollen och texterna.
import { ScrollTrigger } from "../scroll.js";
import { createHeroScene } from "./scene.js";

export async function initHero({ section, canvas, labelUrl }) {
  const { render, resize } = await createHeroScene({ canvas, labelUrl });

  const texts = {
    brand: section.querySelector(".t-brand"),
    hint: section.querySelector(".t-hint"),
    product: section.querySelector(".t-product"),
    notes: section.querySelector(".t-notes"),
    closing: section.querySelector(".t-closing"),
  };

  let progress = 0;
  let dirty = true;

  // Ritar bara om något har ändrats – sparar batteri.
  function frame() {
    if (dirty) {
      dirty = false;
      const s = render(progress);
      for (const [key, el] of Object.entries(texts)) {
        const o = s.text[key];
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
        el.style.visibility = o < 0.001 ? "hidden" : "visible";
      }
    }
    requestAnimationFrame(frame);
  }

  // Sektionen är 500vh hög och scenen sitter fast (sticky) medan man skrollar.
  // ScrollTrigger ger oss en enda progress 0–1 för hela sträckan.
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      progress = self.progress;
      dirty = true;
    },
  });

  progress = trigger.progress; // om sidan laddas mitt i scenen

  // Bara under utveckling: låter oss granska valfri progress i full upplösning.
  if (import.meta.env.DEV) {
    window.__hero = {
      snapshot(p) {
        render(p);
        dirty = true; // återgå till verklig scroll nästa bildruta
        return canvas.toDataURL("image/jpeg", 0.9);
      },
    };
  }

  window.addEventListener("resize", () => {
    resize();
    dirty = true;
  });

  frame();
}
