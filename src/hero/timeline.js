// Hela hero-scenen som EN ren funktion av scroll-progress p (0–1).
// Samma p ger alltid samma bild – därför går allt exakt baklänges.
//
// Idé: scenen speglas. Första halvan zoomar in (flaska → etikett → målning →
// foto → film), mitten är filmen, andra halvan är samma resa baklänges.
// Vi räknar därför allt på u: 0 → 1 (in till filmen) → 0 (ut igen).

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
// Mjuk in- och utfart (sinus) – inga hack eller ryck.
const ease = (t) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
const range = (u, a, b) => clamp01((u - a) / (b - a));

// "Världen" är flaskbilden (sarek-flaska.jpg) i dess egna bildpunkter.
export const WORLD = { w: 2752, h: 1536 };

// Teckningen på etiketten, uppmätt i flaskbilden.
export const ART = { cx: 1375, cy: 1045, w: 320, h: 290 };

// Målningen placeras i världen precis ovanpå etikettens teckning,
// lika hög som teckningen. Den är 16:9 och därför bredare.
// FOCUS_X: den punkt i målningen (andel av bredden) som hamnar mitt på etiketten.
// 0.43 = de stora fjällen.
const PAINT_ASPECT = 1376 / 768;
const FOCUS_X = 0.43;
const PAINT_W = ART.h * PAINT_ASPECT;
export const PAINT = {
  w: PAINT_W,
  h: ART.h,
  x: ART.cx - FOCUS_X * PAINT_W,
  y: ART.cy - ART.h / 2,
};

// Hur mycket (i %) av målningens vänstra/högra del som döljs när "fönstret"
// bara visar etikettens ruta.
export const INSET = {
  left: ((ART.cx - ART.w / 2 - PAINT.x) / PAINT.w) * 100,
  right: ((PAINT.x + PAINT.w - (ART.cx + ART.w / 2)) / PAINT.w) * 100,
};

// En krämfärgad pappersbit som täcker etikettens gamla teckning helt.
const PAPER_MARGIN = 14;
export const PAPER = {
  x: ART.cx - ART.w / 2 - PAPER_MARGIN,
  y: ART.cy - ART.h / 2 - PAPER_MARGIN,
  w: ART.w + PAPER_MARGIN * 2,
  h: ART.h + PAPER_MARGIN * 2,
};

// Ungefärlig bredd på själva flaskan i flaskbilden (för att få plats på smala skärmar).
const BOTTLE_W = 620;
// Flaskans mitt i bilden (där kameran börjar).
const START_FOCUS = { x: WORLD.w / 2, y: WORLD.h / 2 };

/**
 * @param p     scroll-progress 0–1
 * @param vw,vh skärmens storlek i pixlar
 * @param posX  var i 16:9-bilderna vi "klipper" på smala skärmar (0.44 = fjället)
 */
export function heroState(p, vw, vh, posX = 0.44) {
  // u går 0 → 1 → 0. Mellan p=0.40 och 0.60 står vi still på filmen.
  const u = clamp01(Math.min(p, 1 - p) / 0.4);

  // --- Kamera: zoomar jämnt (exponentiellt) från hel flaska till målning som fyller skärmen ---
  const k0 = Math.min((0.68 * vh) / WORLD.h, (0.6 * vw) / BOTTLE_W);
  const k1 = Math.max(vh / PAINT.h, vw / PAINT.w);
  const e = ease(range(u, 0.06, 0.56));
  const k = k0 * Math.pow(k1 / k0, e);

  // Kamerans slutläge: målningen ska hamna exakt som de andra 16:9-bilderna
  // (object-fit: cover med samma object-position).
  const dw = PAINT.w * k1;
  const dh = PAINT.h * k1;
  const fx = (posX * (dw - vw) + vw / 2) / dw;
  const fy = (0.5 * (dh - vh) + vh / 2) / dh;
  const endFocus = { x: PAINT.x + fx * PAINT.w, y: PAINT.y + fy * PAINT.h };

  const fxNow = lerp(START_FOCUS.x, endFocus.x, e);
  const fyNow = lerp(START_FOCUS.y, endFocus.y, e);
  // I början står flaskan lite lägre så att titeln får plats ovanför.
  const offsetY = lerp(0.08 * vh, 0, e);

  // --- Lager ---
  // Målningen syns på etiketten hela tiden, först som ett "tryck" med mjuka kanter.
  const sharp = ease(range(u, 0.26, 0.38)); // kanterna blir raka, färgerna fulla
  const open = ease(range(u, 0.32, 0.54)); // målningens "fönster" vidgas
  const photo = ease(range(u, 0.56, 0.66)); // målning → foto
  const film = ease(range(u, 0.64, 0.78)); // foto → film

  return {
    // världens förflyttning och skala (flaskbild + målning)
    tx: vw / 2 - fxNow * k,
    ty: vh / 2 + offsetY - fyNow * k,
    k,
    sharp,
    insetLeft: (1 - open) * INSET.left,
    insetRight: (1 - open) * INSET.right,
    bottleVisible: u < 0.57,
    paintVisible: u < 0.67,
    photo,
    film,
    text: {
      brand: 1 - ease(range(u, 0.0, 0.07)),
      hint: 1 - ease(range(p, 0.0, 0.012)), // bara i början, inte på vägen ut
      closing: ease(range(u, 0.76, 0.86)),
    },
  };
}
