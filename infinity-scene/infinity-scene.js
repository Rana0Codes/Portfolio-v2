import * as THREE from 'three';
window.THREE = THREE;

// --- CONFIGURATION & CALIBRATED PARAMETERS ---
// Calibrated speed: 11.4 seconds per complete cycle (~35% of original 4.0s speed)
const LOOP_DURATION = 11.4;
const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 280;

// Infinity placement: centered in the right 58% of the banner (utilizing right side with balanced margin)
// Leaves left 42% clear for developer title & typography (ends at X <= 0.0)
const INFINITY_CENTER = new THREE.Vector3(2.20, 0.0, 0.0);
const SCALE_A = 1.95; // Loop half-width (Total width = 3.90 units, reaches X = 4.15)
const SCALE_B = 2.65; // Calibrated for full, open, round loops (Loop height = 1.77 units, aspect = 2.20 : 1)
const DEPTH_C = 0.36; // 3D z-depth separation at central crossing for clear over-under path

let scene, camera, renderer;
let curveSamples = [];
let curveLength = 0;
let codeSpriteList = [];
let sparkPoints, sparkGeo;
let ambientMotes, motesGeo;
let centerGlowSprite;
let isLoaded = false;
let globalTime = 0.0;
let isManualTime = false;

// --- 1. PARAMETRIC 3D LEMNISCATE CURVE SAMPLING ---
// Lemniscate of Bernoulli with 3D Möbius elevation twist & calibrated aspect ratio
function getInfinityPoint(u) {
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);
  const denom = 1 + sinU * sinU;

  const x = INFINITY_CENTER.x + (SCALE_A * cosU) / denom;
  const y = INFINITY_CENTER.y + (SCALE_B * sinU * cosU) / denom;
  // z elevation twist: passes in front at u = π/2, behind at u = 3π/2
  const z = INFINITY_CENTER.z + DEPTH_C * sinU;

  return new THREE.Vector3(x, y, z);
}

// Pre-sample 2400 points for ultra-fine uniform arc-length parameterization
function precomputeCurve() {
  const SAMPLES = 2400;
  curveSamples = [];
  let totalLen = 0;

  for (let i = 0; i <= SAMPLES; i++) {
    const u = (i / SAMPLES) * Math.PI * 2;
    const pt = getInfinityPoint(u);
    if (i > 0) {
      const prev = curveSamples[i - 1].point;
      totalLen += pt.distanceTo(prev);
    }
    curveSamples.push({ u, point: pt, arcLen: totalLen });
  }

  curveLength = totalLen;

  // Normalize arc-lengths to [0, 1]
  for (let i = 0; i < curveSamples.length; i++) {
    curveSamples[i].s = curveSamples[i].arcLen / curveLength;
  }
}

// Get interpolated 3D position and tangent for normalized distance s in [0, 1)
function samplePathByArcLength(s) {
  const normS = ((s % 1.0) + 1.0) % 1.0;
  const targetLen = normS * curveLength;

  let low = 0, high = curveSamples.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (curveSamples[mid].arcLen < targetLen) low = mid + 1;
    else high = mid - 1;
  }

  const idx = Math.max(1, Math.min(low, curveSamples.length - 1));
  const p0 = curveSamples[idx - 1];
  const p1 = curveSamples[idx];
  const segLen = p1.arcLen - p0.arcLen;
  const frac = segLen > 0.000001 ? (targetLen - p0.arcLen) / segLen : 0;

  const pos = new THREE.Vector3().lerpVectors(p0.point, p1.point, frac);
  const tangent = new THREE.Vector3().subVectors(p1.point, p0.point).normalize();

  return { pos, tangent, normS };
}

// Custom 3D Curve class for Three.js TubeGeometry
class Infinity3DCurve extends THREE.Curve {
  constructor() {
    super();
  }
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const u = t * Math.PI * 2;
    const pt = getInfinityPoint(u);
    return optionalTarget.copy(pt);
  }
}

// --- 2. AUTHENTIC MULTICOLOR CODE SYNTAX ATLAS ---
// Real developer code tokens from JavaScript, TypeScript, Python, HTML & CSS
const SYNTAX_TOKENS = [
  // 1. Blue tokens (Functions, async calls, methods)
  { text: 'function', color: '#60a5fa', isShort: false },
  { text: 'async',    color: '#38bdf8', isShort: false },
  { text: 'await',    color: '#38bdf8', isShort: false },
  { text: 'render()', color: '#60a5fa', isShort: false },
  { text: 'query',    color: '#38bdf8', isShort: false },
  { text: 'fetch',    color: '#60a5fa', isShort: false },
  { text: 'deploy',   color: '#38bdf8', isShort: false },
  { text: 'yield',    color: '#60a5fa', isShort: false },
  { text: 'handle()', color: '#38bdf8', isShort: false },

  // 2. Brown / Amber / Warm Rust tokens ("sums are kind of brown other kind of colors")
  { text: "'ready'",  color: '#e28743', isShort: false },
  { text: "'api'",    color: '#d19a66', isShort: false },
  { text: '3000',     color: '#ce9178', isShort: true  },
  { text: '8080',     color: '#d19a66', isShort: true  },
  { text: '200',      color: '#e28743', isShort: true  },
  { text: '404',      color: '#ce9178', isShort: true  },
  { text: '500',      color: '#e28743', isShort: true  },
  { text: 'PORT',     color: '#cd853f', isShort: false },
  { text: 'TIMEOUT',  color: '#d19a66', isShort: false },
  { text: "'dev'",    color: '#e28743', isShort: true  },

  // 3. Purple / Magenta / Violet tokens (Keywords, declarations)
  { text: 'const',    color: '#c084fc', isShort: false },
  { text: 'let',      color: '#c084fc', isShort: true  },
  { text: 'return',   color: '#e879f9', isShort: false },
  { text: 'export',   color: '#c084fc', isShort: false },
  { text: 'import',   color: '#c084fc', isShort: false },
  { text: 'class',    color: '#e879f9', isShort: false },
  { text: 'if',       color: '#c084fc', isShort: true  },
  { text: 'else',     color: '#c084fc', isShort: true  },
  { text: 'def',      color: '#e879f9', isShort: true  },
  { text: 'with',     color: '#c084fc', isShort: true  },
  { text: 'elif',     color: '#e879f9', isShort: true  },

  // 4. Green / Mint tokens (Booleans, types, success, HTML)
  { text: 'true',     color: '#4ade80', isShort: false },
  { text: 'false',    color: '#4ade80', isShort: false },
  { text: 'null',     color: '#2dd4bf', isShort: false },
  { text: 'None',     color: '#4ade80', isShort: false },
  { text: 'boolean',  color: '#4ade80', isShort: false },
  { text: 'string',   color: '#2dd4bf', isShort: false },
  { text: '<div>',    color: '#4ade80', isShort: false },
  { text: '<span>',   color: '#2dd4bf', isShort: false },

  // 5. Yellow / Gold tokens (Types, classes, CSS attributes)
  { text: 'API',      color: '#facc15', isShort: true  },
  { text: 'State',    color: '#ffd700', isShort: false },
  { text: 'Promise',  color: '#facc15', isShort: false },
  { text: 'Config',   color: '#ffd700', isShort: false },
  { text: 'flex',     color: '#facc15', isShort: true  },
  { text: 'grid',     color: '#ffd700', isShort: true  },
  { text: 'rem',      color: '#facc15', isShort: true  },

  // 6. Cyan / Bright Aqua tokens (Identifiers, parameters, variables)
  { text: 'self',     color: '#00f0ff', isShort: false },
  { text: 'props',    color: '#00f0ff', isShort: false },
  { text: 'data',     color: '#22d3ee', isShort: false },
  { text: 'token',    color: '#00f0ff', isShort: false },
  { text: 'state',    color: '#22d3ee', isShort: false },
  { text: 'req',      color: '#00f0ff', isShort: true  },
  { text: 'res',      color: '#22d3ee', isShort: true  },

  // 7. White / Crisp Silver tokens (Operators, brackets, syntax)
  { text: '{ }',      color: '#ffffff', isShort: true  },
  { text: '[ ]',      color: '#ffffff', isShort: true  },
  { text: '( )',      color: '#f8fafc', isShort: true  },
  { text: '=>',       color: '#ffffff', isShort: true  },
  { text: '</>',      color: '#f8fafc', isShort: true  },
  { text: '===',      color: '#ffffff', isShort: true  },
  { text: '!==',      color: '#f8fafc', isShort: true  },
  { text: '&&',       color: '#ffffff', isShort: true  },
  { text: '||',       color: '#ffffff', isShort: true  },
  { text: '??',       color: '#f8fafc', isShort: true  },
  { text: ';',        color: '#e2e8f0', isShort: true  },
  { text: ':',        color: '#e2e8f0', isShort: true  },
  { text: '.',        color: '#ffffff', isShort: true  }
];

function createTokenTexture(token) {
  const canvas = document.createElement('canvas');
  canvas.width = token.isShort ? 72 : 148;
  canvas.height = 44;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Soft atmospheric colored glow matching token's exact syntax color
  ctx.shadowColor = token.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = token.color;
  const fontSize = token.isShort ? 21 : 17;
  ctx.font = `bold ${fontSize}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(token.text, cx, cy);

  // Sharp second pass with zero blur for crisp, saturated letterforms
  ctx.shadowBlur = 0;
  ctx.fillStyle = token.color;
  ctx.fillText(token.text, cx, cy);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createRadialGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(0, 240, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(56, 189, 248, 0.7)');
  grad.addColorStop(0.55, 'rgba(37, 99, 235, 0.3)');
  grad.addColorStop(0.85, 'rgba(10, 25, 60, 0.08)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// --- 3. SCENE INITIALIZATION ---
function init() {
  const canvas = document.getElementById('infinity-canvas');
  if (!canvas) {
    console.error('Canvas #infinity-canvas not found');
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
  renderer.toneMapping = THREE.LinearToneMapping; // Preserves rich saturated syntax colors

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(30, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 50);
  camera.position.set(0.55, 0.0, 5.15);
  camera.lookAt(0.55, 0.0, 0.0);

  precomputeCurve();
  setupLighting();
  setupLuminousCore();
  setupCodeParticles();
  setupSparkParticles();
  setupCenterGlow();
  setupAmbientMotes();

  const loadingEl = document.getElementById('loading-indicator');
  if (loadingEl) loadingEl.style.display = 'none';
  isLoaded = true;

  // Deterministic frame capture seeking interface
  window.seekSimulationTime = (t) => {
    isManualTime = true;
    updateScene(t % LOOP_DURATION);
    renderer.render(scene, camera);
  };

  requestAnimationFrame(renderLoop);
}

// --- 4. LIGHTING SYSTEM ---
function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0x0a1428, 1.2);
  scene.add(ambientLight);

  // Soft cyan key light illuminating the crossing
  const keyLight = new THREE.PointLight(0x00f0ff, 1.8, 8);
  keyLight.position.set(INFINITY_CENTER.x, INFINITY_CENTER.y, 1.8);
  scene.add(keyLight);

  // Deep royal blue fill from behind
  const backLight = new THREE.PointLight(0x3b82f6, 1.4, 7);
  backLight.position.set(INFINITY_CENTER.x, INFINITY_CENTER.y, -1.8);
  scene.add(backLight);
}

// --- 5. LUMINOUS 3D CORE RIBBON (Silhouette Anchor) ---
function setupLuminousCore() {
  const path = new Infinity3DCurve();
  const tubeGeo = new THREE.TubeGeometry(path, 240, 0.018, 8, true);

  const tubeMat = new THREE.MeshBasicMaterial({
    color: 0x00b4d8,
    transparent: true,
    opacity: 0.10,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tubeMesh);
}

// --- 6. HIGH-DENSITY 3-TRACK MULTICOLOR CODE TOKEN SPRITES ---
// Total 280 code particles (substantial density increase across 3 staggered ribbon lanes)
const TOTAL_TOKENS = 280;

function setupCodeParticles() {
  const tokenTextures = SYNTAX_TOKENS.map(tok => createTokenTexture(tok));
  codeSpriteList = [];

  // Multi-lane staggered distribution: Lane 0 (inner: -0.09), Lane 1 (center: 0.0), Lane 2 (outer: +0.09)
  const LANES = [-0.09, 0.0, 0.09];
  const DEPTH_LANES = [-0.06, 0.0, 0.06];

  for (let i = 0; i < TOTAL_TOKENS; i++) {
    const tokIdx = i % SYNTAX_TOKENS.length;
    const tokenInfo = SYNTAX_TOKENS[tokIdx];

    // NormalBlending preserves saturated colors (blues, browns, purples, greens, yellows, whites)
    const mat = new THREE.SpriteMaterial({
      map: tokenTextures[tokIdx],
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(mat);

    // Initial normalized path position s in [0, 1)
    const baseS = i / TOTAL_TOKENS;

    // Deterministic pseudo-random 3-lane stagger for high density without visual chaos
    const laneIdx = i % 3;
    const seed = (i * 1.6180339887) % 1.0;
    const seed2 = (i * 2.7182818284) % 1.0;

    const radialOffset = LANES[laneIdx] + (seed - 0.5) * 0.05;
    const depthOffset = DEPTH_LANES[(laneIdx + 1) % 3] + (seed2 - 0.5) * 0.05;

    // Compact token scaling for crisp readability at high density
    const baseH = tokenInfo.isShort ? 0.095 + seed * 0.02 : 0.105 + seed * 0.025;
    const aspect = tokenInfo.isShort ? 1.6 : 3.3;

    sprite.userData = {
      baseS,
      radialOffset,
      depthOffset,
      baseH,
      aspect,
      tilt: (seed - 0.5) * 0.16
    };

    sprite.scale.set(baseH * aspect, baseH, 1.0);
    scene.add(sprite);
    codeSpriteList.push(sprite);
  }
}

// --- 7. MULTICOLOR MICRO-SPARKS & SYNTAX DOTS (620 Particles) ---
const NUM_SPARKS = 620;
let sparkData = [];

function setupSparkParticles() {
  const sparkTex = createRadialGlowTexture();
  sparkGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(NUM_SPARKS * 3);
  const colors = new Float32Array(NUM_SPARKS * 3);
  sparkData = [];

  // Multicolor spark palette matching syntax theme
  const sparkColors = [
    new THREE.Color(0x00f0ff), // Cyan
    new THREE.Color(0x38bdf8), // Sky Blue
    new THREE.Color(0xe28743), // Amber/Brown
    new THREE.Color(0xc084fc), // Purple
    new THREE.Color(0x4ade80), // Green
    new THREE.Color(0xffffff)  // White
  ];

  for (let i = 0; i < NUM_SPARKS; i++) {
    const baseS = i / NUM_SPARKS;
    const seed = (i * 3.14159265) % 1.0;
    const seed2 = (i * 1.41421356) % 1.0;

    sparkData.push({
      baseS,
      radOffset: (seed - 0.5) * 0.22,
      depthOffset: (seed2 - 0.5) * 0.16,
      speedMult: 1.0 // Perfectly uniform speed for rock-solid loop continuity
    });

    const c = sparkColors[i % sparkColors.length];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const sparkMat = new THREE.PointsMaterial({
    size: 0.055,
    map: sparkTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparkPoints);
}

// --- 8. CENTRAL CROSSING GLOW PULSE ---
function setupCenterGlow() {
  const glowTex = createRadialGlowTexture();
  const mat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  centerGlowSprite = new THREE.Sprite(mat);
  centerGlowSprite.position.copy(INFINITY_CENTER);
  centerGlowSprite.scale.set(1.4, 1.4, 1.0);
  scene.add(centerGlowSprite);
}

// --- 9. BACKGROUND DIGITAL DUST MOTES ---
const NUM_MOTES = 45;
let motesData = [];

function setupAmbientMotes() {
  const moteTex = createRadialGlowTexture();
  motesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(NUM_MOTES * 3);
  motesData = [];

  for (let i = 0; i < NUM_MOTES; i++) {
    const x = INFINITY_CENTER.x + (Math.random() - 0.5) * 5.2;
    const y = INFINITY_CENTER.y + (Math.random() - 0.5) * 2.8;
    const z = (Math.random() - 0.5) * 2.0;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    motesData.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5
    });
  }

  motesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const moteMat = new THREE.PointsMaterial({
    size: 0.045,
    color: 0x38bdf8,
    map: moteTex,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  ambientMotes = new THREE.Points(motesGeo, moteMat);
  scene.add(ambientMotes);
}

// --- 10. DETERMINISTIC DYNAMICS UPDATE (Continuous, Smooth & Time-Based) ---
function updateScene(t) {
  if (!isLoaded) return;

  const cycleProgress = (t % LOOP_DURATION) / LOOP_DURATION; // [0, 1)

  // 1. UPDATE HIGH-DENSITY CODE TOKEN SPRITES
  const upVec = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < codeSpriteList.length; i++) {
    const sp = codeSpriteList[i];
    const ud = sp.userData;

    // Advance path coordinate s continuously
    const curS = (ud.baseS + cycleProgress) % 1.0;
    const { pos, tangent } = samplePathByArcLength(curS);

    const normal = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    sp.position.copy(pos);
    sp.position.addScaledVector(normal, ud.radialOffset);
    sp.position.addScaledVector(binormal, ud.depthOffset);

    // Smooth C1 rotation aligned with tangent.y (eliminates atan2 wrapping glitches)
    sp.material.rotation = (tangent.y * 0.12) + ud.tilt;

    // Smooth Hermite pulse at crossing
    const distToCrossing1 = Math.abs(curS - 0.25);
    const distToCrossing2 = Math.abs(curS - 0.75);
    const minDist = Math.min(distToCrossing1, distToCrossing2);

    let boost = 1.0;
    if (minDist < 0.06) {
      const u = minDist / 0.06;
      boost = 1.0 + (1.0 - u * u * (3.0 - 2.0 * u)) * 0.14;
    }

    const h = ud.baseH * boost;
    sp.scale.set(h * ud.aspect, h, 1.0);
    sp.material.opacity = 0.95;
  }

  // 2. UPDATE MICRO-SPARK PARTICLES
  const sparkPositions = sparkGeo.attributes.position.array;
  for (let i = 0; i < NUM_SPARKS; i++) {
    const sd = sparkData[i];
    const curS = (sd.baseS + cycleProgress * sd.speedMult) % 1.0;
    const { pos, tangent } = samplePathByArcLength(curS);

    const normal = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    const p = pos.clone()
      .addScaledVector(normal, sd.radOffset)
      .addScaledVector(binormal, sd.depthOffset);

    sparkPositions[i * 3] = p.x;
    sparkPositions[i * 3 + 1] = p.y;
    sparkPositions[i * 3 + 2] = p.z;
  }
  sparkGeo.attributes.position.needsUpdate = true;

  // 3. CENTER CROSSING GLOW PULSE
  if (centerGlowSprite) {
    const pulse = 1.0 + Math.sin(cycleProgress * Math.PI * 4) * 0.06;
    centerGlowSprite.scale.set(1.4 * pulse, 1.4 * pulse, 1.0);
    centerGlowSprite.material.opacity = 0.20 + Math.sin(cycleProgress * Math.PI * 4) * 0.04;
  }

  // 4. AMBIENT DIGITAL MOTES
  if (ambientMotes) {
    const motePositions = motesGeo.attributes.position.array;
    for (let i = 0; i < NUM_MOTES; i++) {
      const md = motesData[i];
      const mTime = t * md.speed + md.phase;
      motePositions[i * 3] = md.baseX + Math.sin(mTime) * 0.08;
      motePositions[i * 3 + 1] = md.baseY + Math.cos(mTime * 0.8) * 0.06;
      motePositions[i * 3 + 2] = md.baseZ + Math.sin(mTime * 0.6) * 0.05;
    }
    motesGeo.attributes.position.needsUpdate = true;
  }
}

// --- 11. CONTINUOUS RENDER LOOP (Time-Based & Frame-Rate Independent) ---
let lastTime = performance.now();
function renderLoop(now) {
  if (!isManualTime) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    globalTime = (globalTime + dt) % LOOP_DURATION;
    updateScene(globalTime);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(renderLoop);
}

window.addEventListener('DOMContentLoaded', init);
