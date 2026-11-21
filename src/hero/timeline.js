// Hela hero-scenen som EN ren funktion av scroll-progress p (0–1).
// Samma p ger alltid samma bild – därför går animationen exakt baklänges.

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
// Mjuk in- och utfart (sinus) – inga hack eller ryck.
const ease = (t) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
// Var i ett intervall [a, b] befinner sig p? (0 före, 1 efter)
const range = (p, a, b) => clamp01((p - a) / (b - a));
// Tonar in över [a,b] och ut över [c,d].
const fade = (p, a, b, c, d) => ease(range(p, a, b)) * (1 - ease(range(p, c, d)));

export function heroState(p) {
  // --- Rotation: lugn vridning i början, ett helt varv vid zoomen ---
  const rotY =
    lerp(-0.45, 0, range(p, 0, 0.15)) + // långsam start
    ease(range(p, 0.15, 0.4)) * Math.PI * 2 + // ett helt varv
    range(p, 0.4, 1) * 0.35; // nästan stilla därefter

  // --- Kamera: avstånd (z) och höjd den tittar mot ---
  const zoom = ease(range(p, 0.15, 0.4)); // inzoomning
  const toTop = ease(range(p, 0.38, 0.55)); // mot korken
  const pullBack = ease(range(p, 0.6, 0.85)); // backa lite för dimman
  const camZ = lerp(lerp(lerp(8.0, 7.5, range(p, 0, 0.15)), 3.6, zoom), 4.6, pullBack);
  // Högre "lookY" i början = flaskan hamnar lägre i bild, under TRAKT.
  const lookY = lerp(lerp(lerp(1.75, 1.3, zoom), 1.85, toTop), 1.7, pullBack);
  const camY = lookY + lerp(0.35, 0.15, zoom);

  // --- Korken: glider rakt upp, lutar sedan bort ur bild ---
  const lift = ease(range(p, 0.41, 0.49));
  const away = ease(range(p, 0.47, 0.56));
  const cap = {
    y: lift * 0.55 + away * 1.6,
    x: away * 1.4,
    tilt: -away * 0.9,
  };

  // --- Spray och vätska ---
  const spray = range(p, 0.6, 0.9); // dimman byggs upp
  const release = ease(range(p, 0.9, 1)); // dimman släpper
  const liquid = lerp(1, 0.86, ease(range(p, 0.62, 0.88)));

  // --- Bakgrundens ton: vit → svagt Sarek → vit igen ---
  const tint = ease(range(p, 0.66, 0.86)) * (1 - release);

  // --- Texter (opacitet 0–1) ---
  const text = {
    brand: 1 - ease(range(p, 0.1, 0.16)),
    hint: 1 - ease(range(p, 0, 0.05)),
    product: fade(p, 0.18, 0.26, 0.36, 0.41),
    notes: fade(p, 0.5, 0.56, 0.6, 0.65), // efter att korken lämnat bild
    closing: fade(p, 0.66, 0.74, 0.9, 0.97),
  };

  // Kontaktskuggan bleknar när vi är nära.
  const shadow = 1 - zoom * 0.6;

  return { rotY, camZ, camY, lookY, cap, spray, release, liquid, tint, text, shadow };
}
