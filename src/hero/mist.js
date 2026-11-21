// Sprayens dimma som partiklar.
// Varje partikel har ett fast slumpvärde (aSeed). Positionen räknas ut i
// shadern från uSpray/uRelease (som kommer från scroll-progress) – ingen
// simulering över tid, så dimman går exakt baklänges när man skrollar upp.
import * as THREE from "three";

// Enkel, deterministisk slump så att dimman ser likadan ut varje gång.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const vertexShader = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uSpray;     // 0–1 medan dimman sprids
  uniform float uRelease;   // 0–1 när dimman släpper
  uniform vec3  uOrigin;    // munstyckets hål (världskoordinater)
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vMix;

  void main() {
    // När partikeln "föds" och hur gammal den är just nu.
    float born = aSeed.x * 0.7;
    float age  = uSpray - born;
    float alive = step(0.0, age);
    float a = max(age, 0.0);

    // Riktning: en kon snett framåt åt höger, ut från munstyckets hål.
    float ang  = 0.55 + (aSeed.y - 0.5) * 1.3;
    float elev = (aSeed.z - 0.5) * 0.8;
    vec3 dir = normalize(vec3(cos(ang), elev, sin(ang)));

    // Snabbt ut ur munstycket, sedan allt långsammare (som en riktig spray).
    float reach = 1.2 + aSeed.w * 4.0;
    vec3 pos = uOrigin + dir * (1.0 - exp(-a * 4.0)) * reach;

    // Dimman breder ut sig åt alla håll och stiger lite med åldern,
    // så att den till slut fyller skärmen.
    float spread = a * a * (1.2 + aSeed.w * 1.6);
    pos += vec3(
      sin(aSeed.y * 41.0 + a * 2.6) * 1.6 - a * 0.8,
      cos(aSeed.z * 37.0 + a * 2.1) * 0.8 + a * 0.3,
      sin(aSeed.w * 29.0 + a * 1.8)
    ) * spread;

    // När dimman släpper: driver vidare uppåt och utåt.
    pos += (dir * 1.2 + vec3(0.0, 1.4, 0.0)) * uRelease;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Små och täta vid munstycket, stora och mjuka längre ut.
    float size = uSize * (0.2 + a * 3.5) * (0.6 + aSeed.w * 0.8);
    gl_PointSize = min(size * uPixelRatio * (6.0 / -mv.z), 160.0 * uPixelRatio);

    // Tonar in direkt efter födseln, blir tunnare med åldern, och släpper till slut.
    vAlpha = alive * smoothstep(0.0, 0.04, a) * (0.34 - min(a, 1.0) * 0.22) * (1.0 - uRelease);
    vMix = clamp(a * 1.6, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;   // nysprayad: ljus, kylig grå
  uniform vec3 uColorB;   // Sarek
  varying float vAlpha;
  varying float vMix;

  void main() {
    // Mjuk rund prick utan hård kant.
    float r = length(gl_PointCoord - 0.5);
    float soft = pow(smoothstep(0.5, 0.0, r), 2.2);
    gl_FragColor = vec4(mix(uColorA, uColorB, vMix), soft * vAlpha);
    #include <colorspace_fragment>
  }
`;

export function createMist(count, pixelRatio) {
  const rand = seededRandom(1234);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rand();

  const geo = new THREE.BufferGeometry();
  // Positionerna räknas i shadern; vi behöver bara ett attribut med rätt längd.
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSpray: { value: 0 },
      uRelease: { value: 0 },
      uOrigin: { value: new THREE.Vector3() },
      uSize: { value: 14 },
      uPixelRatio: { value: pixelRatio },
      uColorA: { value: new THREE.Color(0xd7dee0) },
      uColorB: { value: new THREE.Color(0xa6b4b8) },
    },
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false; // positionerna räknas i shadern
  points.visible = false;
  return points;
}
