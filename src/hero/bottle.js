// Sarek-flaskan, byggd helt i kod.
// Mått i "enheter": glaskroppen är 1.0 bred och 1.8 hög (som i parfym.png).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const SIZE = {
  width: 1.0,
  height: 1.8,
  depth: 0.58,
  base: 0.3, // tjock glasbotten
  neckTop: 1.9,
  nozzleTop: 2.08, // spraymunstyckets topp
  capHeight: 0.56,
};

const CREAM = 0xf1e9d8;

// Om etikettbilden saknas ritar vi en enkel etikett på en canvas.
function drawFallbackLabel() {
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#f1e9d8";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#2b2e2c";
  g.textAlign = "center";
  const line = (text, y, size, spacing = 0.25, font = "Cormorant Garamond") => {
    g.font = `${size}px "${font}", serif`;
    g.letterSpacing = `${size * spacing}px`;
    g.fillText(text, c.width / 2, y);
  };
  line("TRAKT", 170, 90);
  g.fillRect(c.width / 2 - 50, 215, 100, 2);
  line("SAREK", 340, 100);
  line("EAU DE PARFUM", 420, 34, 0.15, "Jost");
  line("FJÄLL · KALL LUFT", 760, 38, 0.1, "Jost");
  line("LAV · STEN", 815, 38, 0.1, "Jost");
  line("50 ML", 920, 32, 0.1, "Jost");
  return new THREE.CanvasTexture(c);
}

export async function loadLabelTexture(url, renderer) {
  let tex;
  try {
    if (!url) throw new Error("ingen etikett");
    tex = await new THREE.TextureLoader().loadAsync(url);
  } catch {
    console.info("Etikettbilden saknas – ritar en enkel etikett i stället.");
    await document.fonts.ready;
    tex = drawFallbackLabel();
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

export function createBottle(labelTexture) {
  const S = SIZE;
  const bottle = new THREE.Group();

  // --- Glaskropp: rundad rektangel med transmission (genomskinligt glas) ---
  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(S.width, S.height, S.depth, 6, 0.07),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1,
      thickness: 0.9,
      ior: 1.5,
      roughness: 0.03,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      // Svag grågrön ton i tjockt glas ger kanterna och botten form mot vitt.
      attenuationColor: new THREE.Color(0xd5dfdb),
      attenuationDistance: 1.4,
      specularIntensity: 1,
      envMapIntensity: 1.2,
    })
  );
  glass.position.y = S.height / 2;
  bottle.add(glass);

  // --- Vätskan: ljus, något varm. Ligger ovanpå den tjocka botten. ---
  // Geometrin flyttas så att botten är vid y=0, då kan vi skala nivån med scale.y.
  const liquidHeight = S.height - S.base - 0.16;
  const liquidGeo = new THREE.BoxGeometry(S.width - 0.14, liquidHeight, S.depth - 0.14);
  liquidGeo.translate(0, liquidHeight / 2, 0);
  const liquid = new THREE.Mesh(
    liquidGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xfbf6ea,
      transmission: 1, // genomskinlig vätska med svag, ljus ton
      ior: 1.36,
      thickness: 0.6,
      roughness: 0.06,
      attenuationColor: new THREE.Color(0xf2ead6),
      attenuationDistance: 2.5,
      // Dubbelsidig gör att glaset "ser" vätskan och bryter ljuset genom den.
      side: THREE.DoubleSide,
    })
  );
  liquid.position.y = S.base;
  bottle.add(liquid);

  // --- Etikett: en tunn skiva, bilden på framsidan och krämfärg på resten ---
  const labelW = 0.76;
  const labelH = labelW * (4 / 3);
  const cream = new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.9 });
  const front = new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.85 });
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(labelW, labelH, 0.004),
    [cream, cream, cream, cream, front, cream]
  );
  label.position.set(0, S.base + (S.height - S.base) / 2 - 0.02, S.depth / 2 + 0.003);
  bottle.add(label);

  // --- Hals i glas ---
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.13, S.neckTop - S.height, 32),
    glass.material
  );
  neck.position.y = (S.height + S.neckTop) / 2;
  bottle.add(neck);

  // --- Spraymunstycke: metallkrage + liten knapp med hål åt sidan ---
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9c7c2, metalness: 1, roughness: 0.28 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 32), metal);
  collar.position.y = S.neckTop + 0.03;
  bottle.add(collar);

  const actuator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, S.nozzleTop - S.neckTop - 0.06, 32),
    metal
  );
  actuator.position.y = (S.neckTop + 0.06 + S.nozzleTop) / 2;
  bottle.add(actuator);

  // Hålet sitter snett framåt åt höger (32°), åt samma håll som dimman sprutar.
  const holeAngle = 0.55;
  const holeDir = new THREE.Vector3(Math.cos(holeAngle), 0, Math.sin(holeAngle));
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.016, 16),
    new THREE.MeshBasicMaterial({ color: 0x222222 })
  );
  hole.position.copy(holeDir).multiplyScalar(0.0755);
  hole.position.y = actuator.position.y + 0.02;
  hole.rotation.y = Math.PI / 2 - holeAngle;
  bottle.add(hole);

  // --- Kork: matt svart cylinder. Egen grupp så den kan lyftas av. ---
  const cap = new THREE.Group();
  const capMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, S.capHeight, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x141414,
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.15,
      clearcoatRoughness: 0.6,
    })
  );
  capMesh.position.y = S.capHeight / 2;
  cap.add(capMesh);
  cap.position.y = S.height + 0.02;
  bottle.add(cap);

  // Punkt vid munstyckets hål, i flaskans eget koordinatsystem.
  const nozzleTip = holeDir.clone().multiplyScalar(0.09);
  nozzleTip.y = hole.position.y;

  return { bottle, cap, capRestY: cap.position.y, liquid, nozzleTip };
}

// Mjuk kontaktskugga: en platt yta med radiell gradient under flaskan.
export function createContactShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(40,42,40,0.42)");
  grad.addColorStop(0.45, "rgba(40,42,40,0.16)");
  grad.addColorStop(1, "rgba(40,42,40,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.6),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.002;
  return mesh;
}
