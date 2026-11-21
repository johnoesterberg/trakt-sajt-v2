// Hero-scenen: renderare, studioljus, kamera och koppling till scroll.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createBottle, createContactShadow, loadLabelTexture } from "./bottle.js";
import { createMist } from "./mist.js";
import { heroState } from "./timeline.js";

const WHITE = new THREE.Color(0xffffff);
const SAREK_TINT = new THREE.Color(0xffffff).lerp(new THREE.Color(0xa6b4b8), 0.28);

export async function createHeroScene({ canvas, labelUrl }) {
  const isSmall = window.innerWidth < 768;

  // --- Renderare: pixelratio max 2 så att mobiler inte överbelastas ---
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = WHITE.clone();

  // --- Studiomiljö: ljusa softboxar som glaset kan spegla ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // Ett mjukt toppljus ger korken och etiketten lite form.
  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(2, 5, 3);
  scene.add(key);

  // --- Flaskan ---
  const label = await loadLabelTexture(labelUrl, renderer);
  const { bottle, cap, capRestY, liquid, nozzleTip } = createBottle(label);
  scene.add(bottle);

  const shadow = createContactShadow();
  scene.add(shadow);

  // --- Dimman: färre partiklar på mobil ---
  const mist = createMist(isSmall ? 2500 : 7000, renderer.getPixelRatio());
  scene.add(mist);

  // --- Kamera ---
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const lookAt = new THREE.Vector3();
  let distanceScale = 1; // smala skärmar behöver backa kameran

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // På stående mobilskärm ryms flaskan bara om kameran står längre bort.
    distanceScale = Math.max(1, 0.85 / camera.aspect);
  }

  const tmp = new THREE.Vector3();

  // Sätter hela scenen utifrån progress p och ritar en bild.
  function render(p) {
    const s = heroState(p);

    bottle.rotation.y = s.rotY;

    cap.position.set(s.cap.x, capRestY + s.cap.y, 0);
    cap.rotation.z = s.cap.tilt;
    cap.visible = s.cap.y < 3.5;

    liquid.scale.y = s.liquid;
    shadow.material.opacity = s.shadow;

    lookAt.set(0, s.lookY, 0);
    camera.position.set(0, s.camY, s.camZ * distanceScale);
    camera.lookAt(lookAt);

    // Dimman utgår från munstyckets hål där det är just nu.
    bottle.updateMatrixWorld();
    mist.material.uniforms.uOrigin.value.copy(bottle.localToWorld(tmp.copy(nozzleTip)));
    mist.material.uniforms.uSpray.value = s.spray;
    mist.material.uniforms.uRelease.value = s.release;
    mist.visible = s.spray > 0 && s.release < 1;

    scene.background.copy(WHITE).lerp(SAREK_TINT, s.tint);

    renderer.render(scene, camera);
    return s;
  }

  resize();
  return { render, resize };
}
