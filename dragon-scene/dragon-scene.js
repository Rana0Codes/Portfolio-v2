import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

// --- CONFIGURATION & CONSTANTS ---
const LOOP_DURATION = 8.0; // 8.0 seconds deterministic cinematic loop
const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 280;

// Arena Coordinates (Centered in right 60% of canvas, leaving left 40% pristine for developer text)
const DRAGON_POS = new THREE.Vector3(2.35, -0.32, 0.1);
const PERCH_LAND_POS = new THREE.Vector3(0.35, 0.22, 0.4);
const BIRD_START_POS = new THREE.Vector3(-0.6, 2.4, -0.4);
const BIRD_ESCAPE_APEX = new THREE.Vector3(-0.1, 1.65, 0.5);
const BIRD_ESCAPE_END = new THREE.Vector3(1.2, 1.75, 0.2);

let scene, camera, renderer;
let dragonModel, birdModel;
let dragonMixer, birdMixer;
let dragonClips = {}, birdClipAction;
let dragonHeadBone = null, dragonNeckBone = null, dragonSnoutBone = null;
let fireLight, impactLight, ambientLight, moonLight, warmKey;

// Fire & Particle Objects
let mouthGlowSprite, branchScorchMesh;
let fireSpriteGroup, fireSprites = [];
let impactFireSprites = [];
let sparkSpriteGroup, sparkSprites = [];
let smokeSpriteGroup, smokeSprites = [];

let isAssetsLoaded = false;
let globalTime = 0.0;
let isManualTime = false;

// Procedural Canvas Textures
function createFlameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 235, 120, 0.95)');
  grad.addColorStop(0.45, 'rgba(255, 120, 10, 0.85)');
  grad.addColorStop(0.7, 'rgba(220, 40, 0, 0.45)');
  grad.addColorStop(0.9, 'rgba(120, 10, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(90, 80, 80, 0.7)');
  grad.addColorStop(0.4, 'rgba(60, 50, 50, 0.4)');
  grad.addColorStop(0.8, 'rgba(30, 25, 25, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createSparkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.3, 'rgba(255, 240, 150, 0.95)');
  grad.addColorStop(0.6, 'rgba(255, 170, 20, 0.55)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// --- INITIALIZATION ---
function init() {
  const canvas = document.getElementById('dragon-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  scene = new THREE.Scene();

  // Perspective camera framing the stage nicely
  camera = new THREE.PerspectiveCamera(30, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 50);
  camera.position.set(0.72, 0.72, 5.7);
  camera.lookAt(0.72, 0.32, 0);

  setupLighting();
  setupEnvironment();
  setupFireAndParticles();
  loadModels();

  window.seekSimulationTime = (t) => {
    isManualTime = true;
    updateScene(t % LOOP_DURATION, 0.016);
    renderer.render(scene, camera);
  };

  requestAnimationFrame(renderLoop);
}

// --- LIGHTING ---
function setupLighting() {
  ambientLight = new THREE.AmbientLight(0x111625, 1.8);
  scene.add(ambientLight);

  // Cool celestial moonlight from top-left
  moonLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
  moonLight.position.set(-2, 5, 3);
  scene.add(moonLight);

  // Warm key light illuminating dragon and bird anatomy
  warmKey = new THREE.DirectionalLight(0xffeedd, 2.0);
  warmKey.position.set(3, 4, 3.5);
  scene.add(warmKey);

  // Dramatic rim light outlining dragon wings, horns and tail silhouette
  const rimLight = new THREE.DirectionalLight(0xa855f7, 3.5);
  rimLight.position.set(5, 3.5, -3.5);
  scene.add(rimLight);

  // Dynamic point lights for fire & impact
  fireLight = new THREE.PointLight(0xff5500, 0, 8);
  fireLight.position.set(1.8, 0.4, 0.2);
  scene.add(fireLight);

  impactLight = new THREE.PointLight(0xffaa00, 0, 7);
  impactLight.position.copy(PERCH_LAND_POS);
  scene.add(impactLight);
}

// --- ENVIRONMENT (PERCH & CLIFF) ---
function setupEnvironment() {
  // 1. Dragon Obsidian Perch Cliff at right
  const cliffGeo = new THREE.CylinderGeometry(1.5, 2.2, 1.9, 8);
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.8,
    metalness: 0.25,
    flatShading: true
  });
  const cliff = new THREE.Mesh(cliffGeo, cliffMat);
  cliff.position.set(2.65, -1.2, 0);
  cliff.rotation.y = 0.5;
  scene.add(cliff);

  // 2. Ancient Gnarled Tree Branch / Perch
  const branchGroup = new THREE.Group();
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, -0.4, 0.1),
    new THREE.Vector3(0.0, -0.05, 0.25),
    new THREE.Vector3(0.2, 0.14, 0.35),
    new THREE.Vector3(0.35, 0.20, 0.4),
    new THREE.Vector3(0.55, 0.15, 0.45)
  ]);
  const branchGeo = new THREE.TubeGeometry(branchCurve, 32, 0.08, 8, false);
  const branchMat = new THREE.MeshStandardMaterial({
    color: 0x2b1d16,
    roughness: 0.85,
    metalness: 0.05
  });
  const branchMesh = new THREE.Mesh(branchGeo, branchMat);
  branchGroup.add(branchMesh);

  // Sub-twig branch fork
  const subCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.14, 0.35),
    new THREE.Vector3(0.35, 0.35, 0.25),
    new THREE.Vector3(0.48, 0.42, 0.18)
  ]);
  const subTwig = new THREE.Mesh(new THREE.TubeGeometry(subCurve, 16, 0.04, 6, false), branchMat);
  branchGroup.add(subTwig);

  // Moss cushion where bird perches
  const mossGeo = new THREE.SphereGeometry(0.09, 8, 6);
  mossGeo.scale(1.3, 0.4, 1.1);
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x2d4420, roughness: 0.9 });
  const moss = new THREE.Mesh(mossGeo, mossMat);
  moss.position.copy(PERCH_LAND_POS);
  moss.position.y -= 0.03;
  branchGroup.add(moss);

  // Scorched hot-spot mesh on branch (glows white-hot then cools to charred amber)
  const scorchGeo = new THREE.SphereGeometry(0.12, 10, 10);
  scorchGeo.scale(1.4, 0.6, 1.2);
  const scorchMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });
  branchScorchMesh = new THREE.Mesh(scorchGeo, scorchMat);
  branchScorchMesh.position.copy(PERCH_LAND_POS);
  branchGroup.add(branchScorchMesh);

  scene.add(branchGroup);
}

// --- VOLUMETRIC FIRE & SPRITE SYSTEMS ---
function setupFireAndParticles() {
  const flameTex = createFlameTexture();
  const smokeTex = createSmokeTexture();
  const sparkTex = createSparkTexture();

  // 1. Throat Glow Sprite inside dragon's maw (State D anticipation)
  const mouthMat = new THREE.SpriteMaterial({
    map: flameTex,
    color: 0xffcc33,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  mouthGlowSprite = new THREE.Sprite(mouthMat);
  mouthGlowSprite.scale.set(0.4, 0.4, 1.0);
  scene.add(mouthGlowSprite);

  // 2. High-Density Additive Fire Stream (48 billboard flame sprites)
  fireSpriteGroup = new THREE.Group();
  fireSpriteGroup.visible = false;

  for (let i = 0; i < 48; i++) {
    const mat = new THREE.SpriteMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sp = new THREE.Sprite(mat);
    sp.userData = {
      index: i,
      offset: (Math.random() - 0.5) * 0.1,
      speed: 0.8 + Math.random() * 0.4
    };
    fireSprites.push(sp);
    fireSpriteGroup.add(sp);
  }
  scene.add(fireSpriteGroup);

  // 3. Branch Impact Flame Burst (10 impact sprites)
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.SpriteMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sp = new THREE.Sprite(mat);
    sp.position.copy(PERCH_LAND_POS);
    impactFireSprites.push(sp);
    scene.add(sp);
  }

  // 4. Branch Impact Sparks (35 ricocheting ember sprites)
  sparkSpriteGroup = new THREE.Group();
  for (let i = 0; i < 35; i++) {
    const mat = new THREE.SpriteMaterial({
      map: sparkTex,
      color: 0xffd23f,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sp = new THREE.Sprite(mat);
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.5;
    sp.userData = {
      vx: Math.cos(angle) * speed * 0.5 - 0.25, // Spray upward & left
      vy: 0.6 + Math.random() * 1.4,
      vz: Math.sin(angle) * speed * 0.5,
      life: Math.random(),
      rate: 1.2 + Math.random() * 1.4
    };
    sp.scale.set(0.12, 0.12, 1.0);
    sparkSprites.push(sp);
    sparkSpriteGroup.add(sp);
  }
  scene.add(sparkSpriteGroup);

  // 5. Rising Smoke Billows (20 soft smoke sprites)
  smokeSpriteGroup = new THREE.Group();
  for (let i = 0; i < 20; i++) {
    const mat = new THREE.SpriteMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    const sp = new THREE.Sprite(mat);
    sp.userData = {
      xOffset: (Math.random() - 0.5) * 0.35,
      yVel: 0.35 + Math.random() * 0.45,
      xVel: (Math.random() - 0.5) * 0.2,
      life: Math.random(),
      rate: 0.4 + Math.random() * 0.3
    };
    sp.scale.set(0.65, 0.65, 1.0);
    smokeSprites.push(sp);
    smokeSpriteGroup.add(sp);
  }
  scene.add(smokeSpriteGroup);
}

// --- MODEL LOADING ---
function loadModels() {
  const loader = new GLTFLoader();
  const loadingEl = document.getElementById('loading-indicator');

  let loadedCount = 0;
  const checkDone = () => {
    loadedCount++;
    if (loadedCount >= 2) {
      isAssetsLoaded = true;
      if (loadingEl) loadingEl.style.display = 'none';
      console.log('✓ All 3D character models loaded successfully!');
    }
  };

  // 1. Dragon (Quaternius Rigged Low-Poly Dragon)
  loader.load('../assets/models/Dragon.glb', (gltf) => {
    dragonModel = gltf.scene;
    dragonModel.scale.set(0.65, 0.65, 0.65);
    dragonModel.position.copy(DRAGON_POS);
    dragonModel.rotation.y = -1.25;

    // Apply distinct PBR materials based on model's named material slots
    dragonModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat) => {
          if (!mat) return;
          mat.roughness = 0.6;
          mat.metalness = 0.25;
          const matName = mat.name ? mat.name.toLowerCase() : '';

          if (matName === 'main') {
            // Rich Crimson-Obsidian scales
            mat.color.setHex(0x881c1c);
          } else if (matName === 'wings') {
            // Leathery crimson-purple wing membranes
            mat.color.setHex(0x5a1836);
          } else if (matName === 'belly') {
            // Warm amber-gold underbelly armor plates
            mat.color.setHex(0xd97706);
          } else if (matName === 'claws') {
            // Gleaming golden horns, dorsal spikes, and sharp talons
            mat.color.setHex(0xf59e0b);
            mat.roughness = 0.25;
            mat.metalness = 0.75;
          } else if (matName === 'eyes') {
            // Incandescent dragon eye glow
            mat.color.setHex(0xffdd00);
            mat.emissive.setHex(0xffaa00);
            mat.emissiveIntensity = 2.5;
          }
        });
      }
      if (node.isBone) {
        if (node.name === 'Head') dragonHeadBone = node;
        if (node.name === 'Neck') dragonNeckBone = node;
        if (node.name === 'Nose_end' || node.name === 'Nose') dragonSnoutBone = node;
      }
    });

    dragonMixer = new THREE.AnimationMixer(dragonModel);
    gltf.animations.forEach((clip) => {
      dragonClips[clip.name] = dragonMixer.clipAction(clip);
    });

    if (dragonClips['Idle']) {
      dragonClips['Idle'].play();
    }

    scene.add(dragonModel);
    checkDone();
  }, undefined, (err) => console.error('Error loading Dragon.glb:', err));

  // 2. Bird (Three.js Core Morph-Animated Flight Bird)
  loader.load('../assets/models/Parrot.glb', (gltf) => {
    birdModel = gltf.scene;
    birdModel.scale.set(0.024, 0.024, 0.024);
    birdModel.position.copy(BIRD_START_POS);

    birdMixer = new THREE.AnimationMixer(birdModel);
    if (gltf.animations && gltf.animations.length > 0) {
      birdClipAction = birdMixer.clipAction(gltf.animations[0]);
      birdClipAction.play();
    }

    // Preserve vivid vertex colors on parrot feathers
    birdModel.traverse((node) => {
      if (node.isMesh && node.material) {
        node.material.vertexColors = true;
        node.material.roughness = 0.5;
        node.material.metalness = 0.1;
      }
    });

    scene.add(birdModel);
    checkDone();
  }, undefined, (err) => console.error('Error loading Parrot.glb:', err));
}

// --- STATE MACHINE & CINEMATIC CHOREOGRAPHY ---
function updateScene(t, dt) {
  if (!isAssetsLoaded) return;

  const stateText = document.getElementById('current-state-text');

  // --- 7 DETERMINISTIC STATE INTERVALS (Total 8.0s) ---
  let state = 'A';
  if (t < 1.8) state = 'A';       // 0.0 - 1.8s: Dragon Idle
  else if (t < 3.2) state = 'B';  // 1.8 - 3.2s: Bird Arrival & Landing
  else if (t < 4.2) state = 'C';  // 3.2 - 4.2s: Dragon Threat Gaze
  else if (t < 5.0) state = 'D';  // 4.2 - 5.0s: Fire Preparation & Maw Glow
  else if (t < 5.6) state = 'E';  // 5.0 - 5.6s: Bird Emergency Takeoff & Escape
  else if (t < 6.8) state = 'F';  // 5.6 - 6.8s: Fire Torrent & Branch Blast
  else state = 'G';               // 6.8 - 8.0s: Ember Cool-down & Seamless Reset

  if (stateText) {
    const labels = {
      'A': 'STATE A: DRAGON IDLE & PERCHED',
      'B': 'STATE B: BIRD ARRIVAL & LANDING ON BRANCH',
      'C': 'STATE C: DRAGON THREAT DETECTION & GAZE TRACK',
      'D': 'STATE D: FIRE-BREATH ANTICIPATION & JAW OPEN',
      'E': 'STATE E: BIRD EMERGENCY TAKEOFF ESCAPE',
      'F': 'STATE F: ROARING FIRE TORRENT & BRANCH IMPACT',
      'G': 'STATE G: EMBER COOL-DOWN & LOOP RESET'
    };
    stateText.textContent = labels[state] || state;
  }

  // --- 1. BIRD KINEMATICS & FLIGHT PATH ---
  if (birdModel) {
    if (state === 'A') {
      // Hidden off-screen in high sky
      birdModel.position.set(-4.0, 4.0, -1.0);
      if (birdClipAction) birdClipAction.timeScale = 0;
    } else if (state === 'B') {
      // Smooth swooping descent onto the branch perch
      const u = (t - 1.8) / (3.2 - 1.8);
      const ease = 1 - Math.pow(1 - u, 3); // Decelerating landing flare

      // 3-point Catmull curve for natural aerodynamic banking
      const midPoint = new THREE.Vector3(-0.1, 1.2, 0.1);
      const p1 = new THREE.Vector3().lerpVectors(BIRD_START_POS, midPoint, ease);
      const p2 = new THREE.Vector3().lerpVectors(midPoint, PERCH_LAND_POS, ease);
      birdModel.position.lerpVectors(p1, p2, ease);

      birdModel.rotation.y = THREE.MathUtils.lerp(1.3, 0.45, ease);
      birdModel.rotation.z = Math.sin(u * Math.PI) * -0.35; // Bank wings into turn
      birdModel.rotation.x = THREE.MathUtils.lerp(0.3, 0.0, ease);

      if (birdClipAction) {
        birdClipAction.timeScale = THREE.MathUtils.lerp(2.4, 0.6, ease);
      }
    } else if (state === 'C' || state === 'D') {
      // Securely perched on branch moss
      birdModel.position.copy(PERCH_LAND_POS);
      birdModel.rotation.set(0.04, 0.45, 0);

      // Subtle resting body bob & alert head movements
      birdModel.position.y += Math.sin((t - 3.2) * 5) * 0.008;
      if (state === 'D') {
        // Tenses up as dragon mouth starts glowing
        birdModel.rotation.y = 0.45 + Math.sin((t - 4.2) * 12) * 0.08;
      }

      if (birdClipAction) birdClipAction.timeScale = 0; // Wings folded
    } else if (state === 'E') {
      // EXPLOSIVE PANIC TAKEOFF! Bird leaps into air before fire strikes
      const u = (t - 5.0) / (5.6 - 5.0);
      const ease = u * (2 - u); // Rapid initial leap

      birdModel.position.lerpVectors(PERCH_LAND_POS, BIRD_ESCAPE_APEX, ease);
      birdModel.rotation.y = THREE.MathUtils.lerp(0.45, -0.6, ease);
      birdModel.rotation.x = THREE.MathUtils.lerp(0, -0.35, ease); // Climbing pitch
      birdModel.rotation.z = THREE.MathUtils.lerp(0, 0.35, ease);

      if (birdClipAction) birdClipAction.timeScale = 3.8; // Furious wing flapping!
    } else if (state === 'F') {
      // Soaring safely across upper sky (fully within frame)
      const u = (t - 5.6) / (6.8 - 5.6);
      birdModel.position.lerpVectors(BIRD_ESCAPE_APEX, BIRD_ESCAPE_END, u);
      birdModel.rotation.set(-0.1, -0.65, 0.15);
      if (birdClipAction) birdClipAction.timeScale = 1.8;
    } else if (state === 'G') {
      // Accelerating into upper sky to exit frame for seamless loop reset
      const u = (t - 6.8) / (LOOP_DURATION - 6.8);
      const offscreenTarget = new THREE.Vector3(3.8, 3.2, -0.4);
      birdModel.position.lerpVectors(BIRD_ESCAPE_END, offscreenTarget, u);
      birdModel.rotation.set(-0.1, -0.65, 0.15);
      if (birdClipAction) birdClipAction.timeScale = 1.4;
    }
  }

  // --- 2. DRAGON ANIMATIONS & PROCEDURAL HEAD TRACKING ---
  const mouthPos = new THREE.Vector3(1.78, 0.35, 0.22); // Calculated mouth position

  if (dragonModel) {
    dragonModel.position.copy(DRAGON_POS);
    dragonModel.rotation.y = -1.25;

    // Live world position of snout bone for exact flame origin
    if (dragonSnoutBone) {
      dragonSnoutBone.getWorldPosition(mouthPos);
    } else if (dragonHeadBone) {
      dragonHeadBone.getWorldPosition(mouthPos);
      mouthPos.x -= 0.28;
      mouthPos.y -= 0.04;
    }

    if (state === 'C') {
      // Threat reaction: Turn head & gaze directly at perched bird
      const progress = (t - 3.2) / 1.0;
      if (dragonHeadBone) {
        dragonHeadBone.rotation.y = THREE.MathUtils.lerp(0, -0.35, progress);
        dragonHeadBone.rotation.x = THREE.MathUtils.lerp(0, -0.15, progress); // Gaze downward at branch
      }
    } else if (state === 'D') {
      // Fire Prep: Rearing back, swelling chest, jaw opening wide
      const progress = (t - 4.2) / 0.8;
      dragonModel.position.y += Math.sin(progress * Math.PI) * 0.06;
      if (dragonHeadBone) {
        dragonHeadBone.rotation.x = THREE.MathUtils.lerp(-0.15, 0.2, progress); // Head pulls back in anticipation
        dragonHeadBone.rotation.y = -0.35;
      }
    } else if (state === 'F') {
      // Sustained fire thrust forward aiming directly down at branch
      dragonModel.position.x = DRAGON_POS.x - 0.05;
      if (dragonHeadBone) {
        dragonHeadBone.rotation.x = -0.25; // Lean head forward & DOWN toward perch
        dragonHeadBone.rotation.y = -0.32;
      }
    } else {
      if (dragonHeadBone) dragonHeadBone.rotation.set(0, 0, 0);
    }

    // Play attack motion clip during anticipation & fire
    const attackClip = dragonClips['DragonArmature|DragonArmature|Dragon_Attack2'] || dragonClips['2H_Melee_Attack_Chop'];
    if (attackClip) {
      if (state === 'D' || state === 'F') {
        attackClip.play();
        attackClip.setEffectiveWeight(1.0);
      } else {
        attackClip.setEffectiveWeight(0.0);
      }
    }
  }

  // Position throat glow sprite & light
  mouthGlowSprite.position.copy(mouthPos);
  fireLight.position.copy(mouthPos);

  // --- 3. DIRECTIONAL FIRE BLAST, PARTICLES & IMPACT ---
  if (state === 'D') {
    // State D: Maw glow & anticipation sparks
    const u = (t - 4.2) / 0.8;
    mouthGlowSprite.material.opacity = u * 0.9;
    mouthGlowSprite.scale.setScalar(0.3 + u * 0.4);
    fireLight.intensity = u * 5.0;
    fireLight.color.setHex(0xffaa00);

    impactLight.intensity = 0;
    branchScorchMesh.material.opacity = 0;
    fireSpriteGroup.visible = false;
    sparkSpriteGroup.visible = false;
    smokeSpriteGroup.visible = false;
  } else if (state === 'F') {
    // State F: ROARING DIRECTIONAL FIRE TORRENT!
    mouthGlowSprite.material.opacity = 1.0;
    mouthGlowSprite.scale.setScalar(0.7);
    fireLight.intensity = 13.0;
    fireLight.color.setHex(0xfff5ea);

    fireSpriteGroup.visible = true;

    const streamVec = new THREE.Vector3().subVectors(PERCH_LAND_POS, mouthPos);
    const count = fireSprites.length;

    // Animate 48 volumetric flame sprites along stream
    for (let i = 0; i < count; i++) {
      const sp = fireSprites[i];
      const u = i / (count - 1); // 0 (mouth) to 1 (perch)

      // Dynamic turbulent waves
      const turb = Math.sin(t * 22 + u * 10 + sp.userData.offset * 15);
      const turbZ = Math.cos(t * 18 + u * 8);
      const spread = Math.sin(u * Math.PI) * (0.04 + u * 0.28);

      sp.position.x = mouthPos.x + streamVec.x * u + turb * spread * 0.4;
      sp.position.y = mouthPos.y + streamVec.y * u + turb * spread * 0.8;
      sp.position.z = mouthPos.z + streamVec.z * u + turbZ * spread * 0.4;

      // Scale expands as fire billows downstream
      const scale = THREE.MathUtils.lerp(0.22, 0.65, u) * (0.9 + Math.sin(t * 26 + i) * 0.15);
      sp.scale.set(scale, scale, 1.0);

      // Color ramp: Intense white-hot at mouth -> golden yellow -> roaring flame red
      if (u < 0.25) {
        sp.material.color.setHex(0xffffff);
        sp.material.opacity = 0.95;
      } else if (u < 0.65) {
        sp.material.color.setHex(0xffb703);
        sp.material.opacity = 0.9;
      } else {
        sp.material.color.setHex(0xfb8500);
        sp.material.opacity = 0.85;
      }
    }

    // Branch Impact (t >= 5.75s, after bird has safely climbed into the sky!)
    if (t >= 5.75) {
      impactLight.intensity = 10.0;
      impactLight.color.setHex(0xffb703);

      branchScorchMesh.material.opacity = 0.9;

      // Impact flame billows
      impactFireSprites.forEach((sp, i) => {
        const rad = 0.08 + (i * 0.02);
        const ang = (i / 10) * Math.PI * 2 + t * 8;
        sp.position.x = PERCH_LAND_POS.x + Math.cos(ang) * rad;
        sp.position.y = PERCH_LAND_POS.y + Math.sin(ang) * rad * 0.5 + 0.05;
        sp.position.z = PERCH_LAND_POS.z + Math.sin(ang) * rad;
        const s = 0.4 + Math.sin(t * 20 + i) * 0.15;
        sp.scale.set(s, s, 1.0);
        sp.material.opacity = 0.85;
      });

      // Violent ricocheting sparks off branch
      sparkSpriteGroup.visible = true;
      sparkSprites.forEach((sp) => {
        const ud = sp.userData;
        ud.life = (ud.life + dt * ud.rate) % 1.0;
        const sTime = ud.life * 0.65;

        sp.position.x = PERCH_LAND_POS.x + ud.vx * sTime;
        sp.position.y = PERCH_LAND_POS.y + ud.vy * sTime - (9.8 * sTime * sTime * 0.25); // Parabolic gravity arc
        sp.position.z = PERCH_LAND_POS.z + ud.vz * sTime;
        sp.material.opacity = (1.0 - ud.life) * 0.95;
      });

      // Billowing smoke from charred perch
      smokeSpriteGroup.visible = true;
      smokeSprites.forEach((sp) => {
        const ud = sp.userData;
        ud.life = (ud.life + dt * ud.rate) % 1.0;
        sp.position.x = PERCH_LAND_POS.x + ud.xOffset + ud.xVel * ud.life;
        sp.position.y = PERCH_LAND_POS.y + ud.yVel * ud.life;
        sp.position.z = PERCH_LAND_POS.z;
        const s = 0.4 + ud.life * 0.55;
        sp.scale.set(s, s, 1.0);
        sp.material.opacity = (1.0 - ud.life) * 0.5;
      });
    } else {
      impactLight.intensity = 0;
      impactFireSprites.forEach(sp => sp.material.opacity = 0);
      sparkSpriteGroup.visible = false;
      smokeSpriteGroup.visible = false;
    }
  } else if (state === 'G') {
    // State G: Ember Cool-down, Smoke Dissipation, and Seamless Reset
    const u = 1 - ((t - 6.8) / 1.2);
    mouthGlowSprite.material.opacity = Math.max(0, u * 0.3);
    fireLight.intensity = Math.max(0, u * 2.5);
    impactLight.intensity = Math.max(0, u * 3.0);

    branchScorchMesh.material.opacity = Math.max(0, u * 0.6);
    fireSpriteGroup.visible = false;
    impactFireSprites.forEach(sp => sp.material.opacity = 0);

    // Fading residual sparks falling into ash
    if (u > 0.3) {
      sparkSpriteGroup.visible = true;
      sparkSprites.forEach((sp) => {
        const ud = sp.userData;
        ud.life = (ud.life + dt * ud.rate) % 1.0;
        const sTime = ud.life * 0.65;
        sp.position.x = PERCH_LAND_POS.x + ud.vx * sTime;
        sp.position.y = PERCH_LAND_POS.y + ud.vy * sTime - (9.8 * sTime * sTime * 0.25);
        sp.position.z = PERCH_LAND_POS.z + ud.vz * sTime;
        sp.material.opacity = (1.0 - ud.life) * u * 0.8;
      });
    } else {
      sparkSpriteGroup.visible = false;
    }

    // Dissipating smoke
    smokeSpriteGroup.visible = true;
    smokeSprites.forEach((sp) => {
      const ud = sp.userData;
      ud.life = (ud.life + dt * ud.rate) % 1.0;
      sp.position.x = PERCH_LAND_POS.x + ud.xOffset + ud.xVel * ud.life;
      sp.position.y = PERCH_LAND_POS.y + ud.yVel * ud.life;
      sp.position.z = PERCH_LAND_POS.z;
      const s = 0.4 + ud.life * 0.55;
      sp.scale.set(s, s, 1.0);
      sp.material.opacity = (1.0 - ud.life) * u * 0.4;
    });
  } else {
    // State A & B
    mouthGlowSprite.material.opacity = 0;
    fireLight.intensity = 0;
    impactLight.intensity = 0;
    branchScorchMesh.material.opacity = 0;
    fireSpriteGroup.visible = false;
    impactFireSprites.forEach(sp => sp.material.opacity = 0);
    sparkSpriteGroup.visible = false;
    smokeSpriteGroup.visible = false;
  }

  // Update animation mixers
  if (dragonMixer) dragonMixer.update(dt);
  if (birdMixer) birdMixer.update(dt);
}

// --- RENDER LOOP ---
let lastTime = performance.now();
function renderLoop(now) {
  if (!isManualTime) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    globalTime = (globalTime + dt) % LOOP_DURATION;
    updateScene(globalTime, dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(renderLoop);
}

window.addEventListener('DOMContentLoaded', init);
