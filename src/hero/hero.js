// Kopplar ihop hero-scenen med scrollen: flaskbild, målning, foto, film och texter.
import { ScrollTrigger } from "../scroll.js";
import { heroState, WORLD, PAINT, PAPER, INSET } from "./timeline.js";

const lerp = (a, b, t) => a + (b - a) * t;

// Mjuka kanter runt målningen när den ligger som "tryck" på etiketten.
// Tre lager: [heltäckande (styrs av "sharp")] + ([vänster/höger-toning] ∩ [topp/botten-toning]).
// När sharp = 1 täcker första lagret allt och kanterna blir raka.
function paintMask(sharp) {
  const f = 5; // toningens bredd i % av målningen
  const l = INSET.left;
  const r = 100 - INSET.right;
  const solid = `linear-gradient(rgba(0,0,0,${sharp.toFixed(3)}), rgba(0,0,0,${sharp.toFixed(3)}))`;
  const sides = `linear-gradient(to right, transparent ${l}%, #000 ${l + f}%, #000 ${r - f}%, transparent ${r}%)`;
  const ends = "linear-gradient(to bottom, transparent 0%, #000 9%, #000 91%, transparent 100%)";
  return `${solid}, ${sides}, ${ends}`;
}

// Var i de breda 16:9-bilderna vi "klipper" på smala skärmar: 0.44 håller fjället i bild.
const POS_X = 0.44;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Väntar tills en bild har laddat (eller misslyckats). Fastnar aldrig.
const loaded = (img) =>
  img.complete && img.naturalWidth
    ? Promise.resolve()
    : new Promise((r) => {
        img.addEventListener("load", r, { once: true });
        img.addEventListener("error", r, { once: true });
      });

// Avkodar bilden i förväg så att zoomen inte hackar – men väntar högst en kort stund,
// eftersom vissa webbläsare skjuter upp detta i dolda flikar.
const decodeSoon = (img) =>
  Promise.race([img.decode ? img.decode().catch(() => {}) : null, wait(800)]);

export async function initHero({ section, paintUrl, filmUrl, filmUrlMobile }) {
  const q = (sel) => section.querySelector(sel);
  const stage = q(".hero-stage");
  const world = q(".hero-world");
  const bottle = q(".w-bottle");
  const paint = q(".w-paint");
  const paper = q(".w-paper");
  const photo = q(".layer-photo");
  const film = q(".layer-film");
  const texts = { brand: q(".t-brand"), hint: q(".t-hint"), closing: q(".t-closing") };

  // Världen har flaskbildens storlek; målningen ligger över etikettens teckning.
  world.style.width = `${WORLD.w}px`;
  world.style.height = `${WORLD.h}px`;
  Object.assign(paint.style, {
    left: `${PAINT.x}px`,
    top: `${PAINT.y}px`,
    width: `${PAINT.w}px`,
    height: `${PAINT.h}px`,
    backgroundImage: `url(${paintUrl})`,
  });
  Object.assign(paper.style, {
    left: `${PAPER.x}px`,
    top: `${PAPER.y}px`,
    width: `${PAPER.w}px`,
    height: `${PAPER.h}px`,
  });
  for (const el of [photo, film]) el.style.objectPosition = `${POS_X * 100}% 50%`;

  // Mindre film på mobil.
  film.src = window.matchMedia("(max-width: 767px)").matches ? filmUrlMobile : filmUrl;

  // Vänta tills bilderna är laddade, så att inget "poppar in" mitt i zoomen.
  const paintImg = new Image();
  paintImg.src = paintUrl;
  const imgs = [bottle, photo, paintImg];
  // Högst 8 sekunder – sedan startar vi ändå, hellre än att fastna på laddningen.
  await Promise.race([Promise.all(imgs.map(loaded)), wait(8000)]);
  await Promise.all(imgs.map(decodeSoon));

  let progress = 0;
  let dirty = true;

  const show = (el, o) => {
    el.style.opacity = o.toFixed(3);
    el.style.visibility = o < 0.001 ? "hidden" : "visible";
  };

  function render() {
    const s = heroState(progress, stage.clientWidth, stage.clientHeight, POS_X);

    world.style.transform = `translate(${s.tx}px, ${s.ty}px) scale(${s.k})`;
    bottle.style.visibility = s.bottleVisible ? "visible" : "hidden";

    paper.style.visibility = s.bottleVisible ? "visible" : "hidden";

    paint.style.visibility = s.paintVisible ? "visible" : "hidden";
    paint.style.clipPath = `inset(0 ${s.insetRight.toFixed(2)}% 0 ${s.insetLeft.toFixed(2)}%)`;
    const mask = paintMask(s.sharp);
    paint.style.webkitMaskImage = mask;
    paint.style.maskImage = mask;
    // Som tryck på papper: något dämpade färger, fulla färger när den fyller skärmen.
    const t = s.sharp;
    paint.style.filter =
      t >= 1
        ? "none"
        : `saturate(${lerp(0.78, 1, t).toFixed(3)}) contrast(${lerp(0.9, 1, t).toFixed(3)}) sepia(${lerp(0.12, 0, t).toFixed(3)})`;

    show(photo, s.photo);
    show(film, s.film);

    // Filmen spelar bara när den syns – sparar batteri.
    if (s.film > 0.01 && film.paused) film.play().catch(() => {});
    if (s.film <= 0.01 && !film.paused) film.pause();

    for (const [key, el] of Object.entries(texts)) {
      const o = s.text[key];
      show(el, o);
      el.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
    }
  }

  // Ritar bara om något har ändrats.
  function frame() {
    if (dirty) {
      dirty = false;
      render();
    }
    requestAnimationFrame(frame);
  }

  // Sektionen är 800vh hög och scenen sitter fast (sticky) medan man skrollar.
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      progress = self.progress;
      dirty = true;
    },
  });
  progress = trigger.progress;

  window.addEventListener("resize", () => (dirty = true));
  frame();
}
