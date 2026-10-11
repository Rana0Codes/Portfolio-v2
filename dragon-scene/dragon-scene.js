import * as THREE from 'three';
window.THREE = THREE;
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

// --- CONFIGURATION & CALIBRATED DIMENSIONS ---
// Continuous deterministic flight loop: exactly 2.4 seconds per wing beat cycle
const FLIGHT_CYCLE = 2.4;
const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 280;

// Dragon placement: perfectly framed on the right side
// Generous margins: >50px from top, bottom, and right edge at all cycle extrema
const DRAGON_BASE_POS = new THREE.Vector3(1.88, -0.46, 0.0);
const DRAGON_SCALE = 0.45;
const DRAGON_BASE_ROTY = -1.18; // Dynamic 3/4 angle facing viewer
const DRAGON_BASE_ROTX = 0.30;  // Forward-leaning predatory aerodynamic flight pitch

let scene, camera, renderer;
let dragonModel = null;
let dragonBones = {};
let isAssetsLoaded = false;
let globalTime = 0.0;
let isManualTime = false;

// Lighting references
let keyLight, rimLight, ambientLight, fillLight, bounceLight;

// --- PROCEDURAL PBR TEXTURE GENERATION ---
// 1. Organic Interlocking Dragon Scales Bump Map
function createDragonScalesTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base mid-tone gray for bump neutral
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  // Draw hexagonal/cellular reptilian scale grid
  const scaleSize = 16;
  for (let y = -scaleSize; y < 512 + scaleSize; y += scaleSize * 1.5) {
    const rowOffset = (Math.floor(y / (scaleSize * 1.5)) % 2) * (scaleSize * 1.732 / 2);
    for (let x = -scaleSize; x < 512 + scaleSize; x += scaleSize * 1.732) {
      const cx = x + rowOffset;
      const cy = y;

      // Convex scale gradient (bright peak in center, dark rim crevice)
      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, scaleSize * 0.85);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.5, 'rgba(200, 200, 200, 0.45)');
      grad.addColorStop(0.85, 'rgba(128, 128, 128, 0.0)');
      grad.addColorStop(1.0, 'rgba(40, 40, 40, 0.7)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, scaleSize * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.needsUpdate = true;
  return tex;
}

// 2. Leathery Wing Membrane Texture with Fibrous Struts
function createWingMembraneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, 512, 512);

  // Draw striated tension folds along wing membrane
  ctx.strokeStyle = 'rgba(220, 220, 220, 0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const yStart = (i * 24) % 512;
    ctx.beginPath();
    ctx.moveTo(0, yStart);
    ctx.bezierCurveTo(
      150, yStart + Math.sin(i) * 30,
      350, yStart - Math.cos(i) * 30,
      512, (yStart + 60) % 512
    );
    ctx.stroke();
  }

  // Crevice shadows
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 35; i++) {
    const yStart = (i * 31) % 512;
    ctx.beginPath();
    ctx.moveTo(0, yStart + 6);
    ctx.bezierCurveTo(
      160, yStart + 6 + Math.sin(i) * 30,
      360, yStart + 6 - Math.cos(i) * 30,
      512, (yStart + 66) % 512
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

// 3. Volcanic Basalt Rock Texture
function createBasaltRockTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#606060';
  ctx.fillRect(0, 0, 512, 512);

  // Horizontal geological strata
  for (let y = 0; y < 512; y += 4) {
    const noise = (Math.random() - 0.5) * 60;
    const v = Math.min(255, Math.max(0, 100 + noise));
    ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
    ctx.fillRect(0, y, 512, 3);
  }

  // Vertical rock fissures & cracks
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 15; i++) {
    let x = (i * 37) % 512;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y < 512; y += 40) {
      x += (Math.random() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

// 4. Predatory Molten Amber Dragon Eye with Vertical Slit Pupil
function createDragonEyeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep obsidian outer ring
  ctx.fillStyle = '#110702';
  ctx.fillRect(0, 0, 256, 256);

  // Molten amber/gold radiating iris
  const irisGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 110);
  irisGrad.addColorStop(0.0, '#fff3b0');
  irisGrad.addColorStop(0.3, '#ffaa00');
  irisGrad.addColorStop(0.7, '#d9480f');
  irisGrad.addColorStop(0.95, '#5c1d02');
  irisGrad.addColorStop(1.0, '#110702');

  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.fill();

  // Radiating iris striations
  ctx.strokeStyle = 'rgba(255, 230, 120, 0.35)';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += 0.08) {
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 20, 128 + Math.sin(a) * 20);
    ctx.lineTo(128 + Math.cos(a) * 105, 128 + Math.sin(a) * 105);
    ctx.stroke();
  }

  // Vertical slit pupil (draconic predatory eye)
  ctx.fillStyle = '#050200';
  ctx.beginPath();
  ctx.ellipse(128, 128, 14, 82, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pinpoint specular glint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(142, 105, 7, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// --- INITIALIZATION ---
function init() {
  const canvas = document.getElementById('dragon-canvas');
  if (!canvas) {
    console.error('Canvas #dragon-canvas not found');
    return;
  }

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false
  });
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  scene = new THREE.Scene();

  // Wide perspective camera calibrated to keep all dragon parts inside the frame
  camera = new THREE.PerspectiveCamera(30, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 50);
  camera.position.set(0.55, 0.35, 6.4);
  camera.lookAt(0.55, -0.05, 0.0);

  setupLighting();
  setupEnvironment();
  loadDragonModel();

  // Deterministic seeking interface for frame capture & visual validation
  window.seekSimulationTime = (t) => {
    isManualTime = true;
    updateScene(t % FLIGHT_CYCLE);
    renderer.render(scene, camera);
  };

  requestAnimationFrame(renderLoop);
}

// --- LIGHTING SYSTEM (CINEMATIC DARK FANTASY) ---
function setupLighting() {
  // 1. Deep Midnight Navy Ambient Base
  ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
  scene.add(ambientLight);

  // 2. Celestial Cyan-Ice Fill Light (Upper Left Sky)
  fillLight = new THREE.DirectionalLight(0x38bdf8, 1.9);
  fillLight.position.set(-3.0, 4.5, 3.0);
  scene.add(fillLight);

  // 3. Warm Sunlit Ivory Key Light (Upper Right Front - Sculpting Dragon Facial Anatomy)
  keyLight = new THREE.DirectionalLight(0xfff1e6, 2.7);
  keyLight.position.set(2.8, 3.8, 4.2);
  scene.add(keyLight);

  // 4. Dramatic Magenta-Purple Silhouette Rim Light (Behind Dragon)
  rimLight = new THREE.DirectionalLight(0xc084fc, 4.2);
  rimLight.position.set(4.8, 3.2, -3.2);
  scene.add(rimLight);

  // 5. Basalt Ground Reflection Bounce Light (Warm Amber Underbelly Fill)
  bounceLight = new THREE.DirectionalLight(0xd97706, 1.3);
  bounceLight.position.set(2.0, -3.0, 1.5);
  scene.add(bounceLight);
}

// --- ENVIRONMENT: CARVED OBSIDIAN BASALT PERCH ---
function setupEnvironment() {
  const perchGroup = new THREE.Group();
  const basaltBump = createBasaltRockTexture();

  // Main Carved Basalt Perch Plinth directly beneath dragon's talons
  const perchGeo = new THREE.CylinderGeometry(1.25, 1.75, 1.8, 9, 3);
  const posAttr = perchGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    if (y < 0.8 && y > -0.8) {
      posAttr.setX(i, x + (Math.sin(y * 4 + i) * 0.04));
      posAttr.setZ(i, z + (Math.cos(y * 4 + i) * 0.04));
    }
  }
  perchGeo.computeVertexNormals();

  const perchMat = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    bumpMap: basaltBump,
    bumpScale: 0.06,
    roughness: 0.82,
    metalness: 0.20,
    flatShading: true
  });
  const perchMesh = new THREE.Mesh(perchGeo, perchMat);
  perchMesh.position.set(1.95, -1.55, 0.0);
  perchMesh.rotation.y = 0.42;
  perchGroup.add(perchMesh);

  // Secondary Basalt Shelf Step
  const stepGeo = new THREE.CylinderGeometry(0.70, 0.95, 0.8, 7);
  const stepMat = new THREE.MeshStandardMaterial({
    color: 0x0c101a,
    bumpMap: basaltBump,
    bumpScale: 0.05,
    roughness: 0.88,
    metalness: 0.15,
    flatShading: true
  });
  const stepMesh = new THREE.Mesh(stepGeo, stepMat);
  stepMesh.position.set(1.30, -1.75, 0.35);
  stepMesh.rotation.y = 1.1;
  perchGroup.add(stepMesh);

  scene.add(perchGroup);
}

// --- DRAGON MODEL & PBR MATERIAL SETUP ---
function loadDragonModel() {
  const loader = new GLTFLoader();
  const loadingEl = document.getElementById('loading-indicator');

  const scalesBump = createDragonScalesTexture();
  const wingBump = createWingMembraneTexture();
  const eyeTexture = createDragonEyeTexture();

  loader.load('../assets/models/Dragon.glb', (gltf) => {
    dragonModel = gltf.scene;
    dragonModel.scale.setScalar(DRAGON_SCALE);
    dragonModel.position.copy(DRAGON_BASE_POS);
    dragonModel.rotation.set(DRAGON_BASE_ROTX, DRAGON_BASE_ROTY, 0);

    // Apply Premium PBR multi-material system with procedural relief textures
    dragonModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat) => {
          if (!mat) return;
          const matName = (mat.name || '').toLowerCase();

          if (matName === 'main') {
            // Rich Crimson-Obsidian Dragon Scales with relief displacement
            mat.color.setHex(0x821c1c);
            mat.bumpMap = scalesBump;
            mat.bumpScale = 0.035;
            mat.roughness = 0.58;
            mat.metalness = 0.28;
          } else if (matName === 'wings') {
            // Leathery plum-burgundy wing membrane with fibrous bump
            mat.color.setHex(0x54122f);
            mat.bumpMap = wingBump;
            mat.bumpScale = 0.025;
            mat.roughness = 0.68;
            mat.metalness = 0.15;
            mat.side = THREE.DoubleSide;
          } else if (matName === 'belly') {
            // Warm burnished amber-gold gastrostegite armor plates
            mat.color.setHex(0xd97706);
            mat.bumpMap = scalesBump;
            mat.bumpScale = 0.028;
            mat.roughness = 0.38;
            mat.metalness = 0.44;
          } else if (matName === 'claws') {
            // Ancient polished golden horns, cranial ridges & claws
            mat.color.setHex(0xf59e0b);
            mat.roughness = 0.18;
            mat.metalness = 0.85;
          } else if (matName === 'eyes') {
            // Molten amber dragon eye with slit pupil
            mat.map = eyeTexture;
            mat.emissive.setHex(0xff9900);
            mat.emissiveIntensity = 1.8;
            mat.roughness = 0.15;
            mat.metalness = 0.1;
          }
        });
      }

      // Catalog all skeletal bones (using exact bone names from Dragon.glb)
      if (node.isBone) {
        dragonBones[node.name] = node;
        node.userData.baseRotation = node.rotation.clone();
        node.userData.basePosition = node.position.clone();
      }
    });

    scene.add(dragonModel);
    window.dragonModel = dragonModel;
    window.dragonBones = dragonBones;
    isAssetsLoaded = true;
    if (loadingEl) loadingEl.style.display = 'none';
    console.log('✓ Premium 3D Dragon loaded with PBR relief textures & flight rig!');
  }, undefined, (err) => {
    console.error('Error loading Dragon.glb:', err);
    if (loadingEl) loadingEl.textContent = '3D Canvas Ready';
  });
}

// --- HARMONIC FLIGHT KINEMATICS ENGINE ---
function updateScene(t) {
  if (!isAssetsLoaded || !dragonModel) return;

  const omega = (Math.PI * 2) / FLIGHT_CYCLE;
  const tau = (t % FLIGHT_CYCLE) * omega;

  // Snappy power downstroke, buoyant recovery upstroke
  const flapWave = Math.sin(tau) + 0.16 * Math.sin(2 * tau);
  const flapCos = Math.cos(tau);

  // 1. DRAGON TORSO HOVER COUNTER-BOB
  // Lift occurs as wings press downward (phase + π)
  const hoverLift = Math.sin(tau + Math.PI) * 0.048;
  const hoverDriftX = Math.sin(tau * 0.5) * 0.010;
  dragonModel.position.x = DRAGON_BASE_POS.x + hoverDriftX;
  dragonModel.position.y = DRAGON_BASE_POS.y + hoverLift;
  dragonModel.position.z = DRAGON_BASE_POS.z;

  // Aerodynamic body pitch tilting
  const pitchOffset = flapCos * 0.042;
  const yawAngle = DRAGON_BASE_ROTY + Math.sin(tau * 0.5) * 0.020;
  const rollAngle = Math.sin(tau) * 0.012;
  dragonModel.rotation.set(DRAGON_BASE_ROTX + pitchOffset, yawAngle, rollAngle);

  const b = dragonBones;

  // 2. WING ARTICULATION (4-SEGMENT HIERARCHICAL KINEMATICS)
  // Left & Right Wings
  // Flapping primary stroke along X-axis (+X moves up, -X moves down),
  // with Z-axis controlling sweep and Y-axis controlling twist
  
  // Shoulder Joint
  if (b['ShoulderL']) {
    b['ShoulderL'].rotation.copy(b['ShoulderL'].userData.baseRotation);
    b['ShoulderL'].rotation.x += flapWave * 0.12;
    b['ShoulderL'].rotation.z -= flapCos * 0.06;
  }
  if (b['ShoulderR']) {
    b['ShoulderR'].rotation.copy(b['ShoulderR'].userData.baseRotation);
    b['ShoulderR'].rotation.x += flapWave * 0.12;
    b['ShoulderR'].rotation.z += flapCos * 0.06;
  }

  // Inner Wing Bone (Humerus) - Main Power Flap
  if (b['Wing1L']) {
    b['Wing1L'].rotation.copy(b['Wing1L'].userData.baseRotation);
    b['Wing1L'].rotation.x += flapWave * 0.50; // Up/down flap
    b['Wing1L'].rotation.z -= flapWave * 0.22; // Forward/backward sweep
    b['Wing1L'].rotation.y += flapCos * 0.15;  // Aerodynamic feathering
  }
  if (b['Wing1R']) {
    b['Wing1R'].rotation.copy(b['Wing1R'].userData.baseRotation);
    b['Wing1R'].rotation.x += flapWave * 0.50;
    b['Wing1R'].rotation.z += flapWave * 0.22;
    b['Wing1R'].rotation.y -= flapCos * 0.15;
  }

  // Mid Wing Bone (Elbow / Radius) - Phase Lag ~25° (0.42 rad)
  const lag2 = 0.42;
  const flapWave2 = Math.sin(tau - lag2) + 0.16 * Math.sin(2 * (tau - lag2));
  const flapCos2 = Math.cos(tau - lag2);
  if (b['Wing2L']) {
    b['Wing2L'].rotation.copy(b['Wing2L'].userData.baseRotation);
    b['Wing2L'].rotation.x += flapWave2 * 0.40;
    b['Wing2L'].rotation.z -= flapWave2 * 0.16;
    b['Wing2L'].rotation.y += flapCos2 * 0.12;
  }
  if (b['Wing2R']) {
    b['Wing2R'].rotation.copy(b['Wing2R'].userData.baseRotation);
    b['Wing2R'].rotation.x += flapWave2 * 0.40;
    b['Wing2R'].rotation.z += flapWave2 * 0.16;
    b['Wing2R'].rotation.y -= flapCos2 * 0.12;
  }

  // Outer Wing Bone (Metacarpal strut) - Phase Lag ~50° (0.85 rad)
  const lag3 = 0.85;
  const flapWave3 = Math.sin(tau - lag3) + 0.16 * Math.sin(2 * (tau - lag3));
  if (b['Wing3L']) {
    b['Wing3L'].rotation.copy(b['Wing3L'].userData.baseRotation);
    b['Wing3L'].rotation.x += flapWave3 * 0.32;
    b['Wing3L'].rotation.z -= flapWave3 * 0.12;
  }
  if (b['Wing3R']) {
    b['Wing3R'].rotation.copy(b['Wing3R'].userData.baseRotation);
    b['Wing3R'].rotation.x += flapWave3 * 0.32;
    b['Wing3R'].rotation.z += flapWave3 * 0.12;
  }

  // Wing Tip Digit (Trailing Membrane Elastic Flex) - Phase Lag ~75° (1.30 rad)
  const lag4 = 1.30;
  const flapWave4 = Math.sin(tau - lag4) + 0.16 * Math.sin(2 * (tau - lag4));
  if (b['Wing4L']) {
    b['Wing4L'].rotation.copy(b['Wing4L'].userData.baseRotation);
    b['Wing4L'].rotation.x += flapWave4 * 0.26;
    b['Wing4L'].rotation.z -= flapWave4 * 0.10;
  }
  if (b['Wing4R']) {
    b['Wing4R'].rotation.copy(b['Wing4R'].userData.baseRotation);
    b['Wing4R'].rotation.x += flapWave4 * 0.26;
    b['Wing4R'].rotation.z += flapWave4 * 0.10;
  }

  // 3. HEAD & NECK GAZE STABILIZATION
  // Keeps the skull locked forward toward viewer despite torso pitch
  if (b['Neck']) {
    b['Neck'].rotation.copy(b['Neck'].userData.baseRotation);
    b['Neck'].rotation.x -= pitchOffset * 0.55;
    b['Neck'].rotation.y += Math.sin(tau * 0.5) * 0.03;
  }
  if (b['Head']) {
    b['Head'].rotation.copy(b['Head'].userData.baseRotation);
    b['Head'].rotation.x -= pitchOffset * 0.70;
    b['Head'].rotation.y += Math.sin(tau * 0.5) * 0.04;
  }
  if (b['Face']) {
    b['Face'].rotation.copy(b['Face'].userData.baseRotation);
    b['Face'].rotation.x += Math.sin(tau) * 0.015;
  }

  // 4. TAIL HARMONIC TRAVELING WAVE
  const tailLag = 0.52;
  const tailBones = ['Tail1', 'Tail2', 'Tail3', 'Tail4'];
  tailBones.forEach((name, idx) => {
    if (b[name]) {
      b[name].rotation.copy(b[name].userData.baseRotation);
      const tPhase = tau - (idx * tailLag);
      b[name].rotation.y += Math.sin(tPhase) * (0.12 + idx * 0.04);
      b[name].rotation.z += Math.cos(tPhase) * (0.05 + idx * 0.02);
    }
  });

  // 5. HOVERING TALONS SUSPENSION
  if (b['UpperLegL']) {
    b['UpperLegL'].rotation.copy(b['UpperLegL'].userData.baseRotation);
    b['UpperLegL'].rotation.x += 0.10 + flapCos * 0.03;
  }
  if (b['UpperLegR']) {
    b['UpperLegR'].rotation.copy(b['UpperLegR'].userData.baseRotation);
    b['UpperLegR'].rotation.x += 0.10 + flapCos * 0.03;
  }
  if (b['FeetL']) {
    b['FeetL'].rotation.copy(b['FeetL'].userData.baseRotation);
    b['FeetL'].rotation.x += 0.06 + flapWave * 0.02;
  }
  if (b['FeetR']) {
    b['FeetR'].rotation.copy(b['FeetR'].userData.baseRotation);
    b['FeetR'].rotation.x += 0.06 + flapWave * 0.02;
  }
}

// --- CONTINUOUS RENDER LOOP ---
let lastTime = performance.now();
function renderLoop(now) {
  if (!isManualTime) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    globalTime = (globalTime + dt) % FLIGHT_CYCLE;
    updateScene(globalTime);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(renderLoop);
}

window.addEventListener('DOMContentLoaded', init);
