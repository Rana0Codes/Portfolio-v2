import * as THREE from 'three';
window.THREE = THREE;

// --- CONFIGURATION & CALIBRATED PARAMETERS ---
// Calibrated speed: 16.2 seconds per complete cycle (slowed down by ~30% from 11.4s)
const LOOP_DURATION = 16.2;
const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 280;

// Infinity placement & dimensions: harmoniously adjusted to the canvas area
// Leaves left 42% clear for developer title & typography (ends at X <= 0.0)
const INFINITY_CENTER = new THREE.Vector3(2.15, 0.0, 0.0);
const SCALE_A = 2.00; // Loop half-width (Total width = 4.00 units, spans X: [0.15, 4.15])
const SCALE_B = 2.70; // Calibrated round loop curvature (Loop height = 2.08 units, aspect = 2.20 : 1)
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

// 2D distance calculation from any coordinate to the infinity curve
function getDistanceToInfinityCurve(x, y) {
  let minDistSq = 1e9;
  for (let i = 0; i < curveSamples.length; i += 30) {
    const pt = curveSamples[i].point;
    const dx = pt.x - x;
    const dy = pt.y - y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) minDistSq = dSq;
  }
  return Math.sqrt(minDistSq);
}

// --- 1.1 KINETIC ACCELERATION DYNAMICS MAPPING ---
// Smooth bounded velocity factor: acceleration surges as particles approach nexus (s = 0.25 and 0.75)
// and gently decelerates in the outer turning loops (s = 0.0 and 0.5) for keyword readability
const KINETIC_SAMPLES = 2400;
const timeToArcLengthTable = new Float32Array(KINETIC_SAMPLES + 1);

function getKineticVelocityProfile(s) {
  const d1 = Math.abs(s - 0.25);
  const d2 = Math.abs(s - 0.75);
  const dMin = Math.min(d1, d2);
  const sigma = 0.085;
  const accelFactor = Math.exp(-(dMin * dMin) / (2 * sigma * sigma));
  return 0.80 + 0.52 * accelFactor; // Base 0.80x, peak 1.32x at central crossing
}

function precomputeKineticTiming() {
  let cumulativeTime = 0;
  const dtArray = new Float32Array(KINETIC_SAMPLES);
  for (let i = 0; i < KINETIC_SAMPLES; i++) {
    const s = i / KINETIC_SAMPLES;
    const v = getKineticVelocityProfile(s);
    dtArray[i] = 1.0 / v;
    cumulativeTime += dtArray[i];
  }

  const timeTable = new Float32Array(KINETIC_SAMPLES + 1);
  let acc = 0;
  timeTable[0] = 0;
  for (let i = 0; i < KINETIC_SAMPLES; i++) {
    acc += dtArray[i] / cumulativeTime;
    timeTable[i + 1] = acc;
  }
  timeTable[KINETIC_SAMPLES] = 1.0;

  for (let j = 0; j <= KINETIC_SAMPLES; j++) {
    const targetT = j / KINETIC_SAMPLES;
    let low = 0, high = KINETIC_SAMPLES;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (timeTable[mid] < targetT) low = mid + 1;
      else high = mid - 1;
    }
    const idx = Math.max(1, Math.min(low, KINETIC_SAMPLES));
    const t0 = timeTable[idx - 1];
    const t1 = timeTable[idx];
    const frac = (t1 > t0) ? (targetT - t0) / (t1 - t0) : 0;
    const s0 = (idx - 1) / KINETIC_SAMPLES;
    const s1 = idx / KINETIC_SAMPLES;
    timeToArcLengthTable[j] = s0 + (s1 - s0) * frac;
  }
}

function getKineticS(timePhase) {
  const normT = ((timePhase % 1.0) + 1.0) % 1.0;
  const idxFloat = normT * KINETIC_SAMPLES;
  const i0 = Math.floor(idxFloat);
  const i1 = Math.min(i0 + 1, KINETIC_SAMPLES);
  const frac = idxFloat - i0;
  return timeToArcLengthTable[i0] + (timeToArcLengthTable[i1] - timeToArcLengthTable[i0]) * frac;
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

  // 2. Brown / Amber / Warm Rust tokens
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

// --- 2.1 CURATED LIBRARY OF 64 SHORT PROGRAMMING FRAGMENTS ---
const RANDOM_BACKGROUND_LIBRARY = [
  // Async & Reactive Flow
  { text: 'const flow = true;', color: '#38bdf8' },
  { text: 'requestAnimationFrame(tick);', color: '#60a5fa' },
  { text: 'while (connected) { build(); }', color: '#38bdf8' },
  { text: 'async function create()', color: '#60a5fa' },
  { text: 'render(deltaTime);', color: '#38bdf8' },
  { text: 'const motion = smooth;', color: '#c084fc' },
  { text: 'return infiniteLoop;', color: '#e879f9' },
  { text: 'particles.update(dt);', color: '#38bdf8' },
  { text: 'await buildExperience();', color: '#60a5fa' },
  { text: 'const ideas = iterate();', color: '#ffd700' },
  { text: 'if (quality > target) refine();', color: '#c084fc' },
  { text: '// keep building', color: '#94a3b8' },
  { text: 'ship(version);', color: '#4ade80' },
  { text: 'Observable.pipe(filter, map)', color: '#60a5fa' },
  { text: 'eventLoop.nextTick(drain)', color: '#38bdf8' },
  { text: 'Promise.allSettled(tasks)', color: '#60a5fa' },

  // Full-Stack, Architecture & DevOps
  { text: 'git commit -m "refine"', color: '#4ade80' },
  { text: 'kubectl apply -f cluster.yml', color: '#38bdf8' },
  { text: 'docker compose up -d --build', color: '#e28743' },
  { text: 'const [state, dispatch] = useReducer()', color: '#c084fc' },
  { text: 'export default function Hub()', color: '#c084fc' },
  { text: 'type Result<T, E> = Ok | Err', color: '#ffd700' },
  { text: 'SELECT id, latency FROM nodes', color: '#e28743' },
  { text: 'interface SystemGraph { nodes, edges }', color: '#ffd700' },
  { text: 'response.status(200).json(meta)', color: '#4ade80' },
  { text: 'cache.set(key, val, { ttl: 3600 })', color: '#d19a66' },
  { text: 'worker.postMessage({ type: "SYNC" })', color: '#38bdf8' },
  { text: 'const edge = new EdgeRuntime()', color: '#00f0ff' },
  { text: 'export const runtime = "nodejs"', color: '#c084fc' },
  { text: 'git push origin main --tags', color: '#4ade80' },
  { text: 'const cluster = await initMesh()', color: '#60a5fa' },
  { text: 'status: 200 OK • 12ms', color: '#2dd4bf' },

  // Graphics, Shaders, 3D & Animation
  { text: 'transform: translate3d(0, 0, 0)', color: '#ffd700' },
  { text: 'vec4 fragColor = vec4(rgb, 1.0);', color: '#00f0ff' },
  { text: 'uniform float u_time;', color: '#38bdf8' },
  { text: 'mat4 projection = perspective(fov)', color: '#60a5fa' },
  { text: 'ray.direction = normalize(target)', color: '#00f0ff' },
  { text: 'gl_Position = u_mvp * vec4(pos, 1.0)', color: '#38bdf8' },
  { text: 'THREE.TubeGeometry(path, 240)', color: '#60a5fa' },
  { text: 'float noise = simplex3D(pos * 2.0)', color: '#00f0ff' },
  { text: 'light.intensity = hermite(t)', color: '#ffd700' },
  { text: 'camera.lookAt(targetVector)', color: '#60a5fa' },
  { text: 'scene.add(ambientParticles)', color: '#38bdf8' },
  { text: 'material.roughness = 0.15;', color: '#e28743' },
  { text: 'viewport.aspect = width / height;', color: '#ffd700' },
  { text: 'renderer.toneMapping = Linear;', color: '#00f0ff' },

  // Python, Systems, Algorithms & AI
  { text: 'def execute_pipeline(context):', color: '#e879f9' },
  { text: 'yield from stream_telemetry()', color: '#60a5fa' },
  { text: 'with ThreadPoolExecutor() as pool:', color: '#c084fc' },
  { text: 'class Vector3D(NamedTuple):', color: '#e879f9' },
  { text: 'data = np.ascontiguousarray(buf)', color: '#e28743' },
  { text: 'std::unique_ptr<Node> root;', color: '#ce9178' },
  { text: 'auto [minX, maxX] = bounds;', color: '#cd853f' },
  { text: 'fn handle_stream(mut stream: TcpStream)', color: '#e28743' },
  { text: 'binary_search(samples, arcLength)', color: '#38bdf8' },
  { text: 'quicksort(partition, 0, len - 1)', color: '#ffd700' },
  { text: 'tensor.to(device="cuda:0")', color: '#4ade80' },
  { text: 'embeddings = model.encode(prompt)', color: '#2dd4bf' },
  { text: 'const omega = 2.0 * Math.PI / T;', color: '#38bdf8' },
  { text: 'velocity += acceleration * dt;', color: '#00f0ff' },
  { text: 'const lerp = (a, b, t) => a + (b - a)*t;', color: '#c084fc' },
  { text: 'quaternion.setFromAxisAngle(axis, phi);', color: '#60a5fa' },
  { text: 'matrix4.compose(pos, rot, scale);', color: '#ffd700' },
  { text: 'while (alive) { innovate(); }', color: '#38bdf8' }
];

let bgTextures = [];
function createFoggyTextTexture(text, color = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 44;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Foggy atmospheric blur pass
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.font = 'bold 15px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);

  // Crisp secondary pass for clear letterform definition
  ctx.shadowBlur = 3;
  ctx.fillText(text, cx, cy);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Pseudo-random hash generator for deterministic playback and real-time generation
function pseudoHash(a, b, c) {
  let h = (a * 1618033989) ^ (b * 2718281829) ^ (c * 3141592653);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function pseudoHashFloat(a, b, c) {
  return (pseudoHash(a, b, c) % 1000000) / 1000000.0;
}

// --- 2.2 EPHEMERAL BACKGROUND TEXT SYSTEM ---
const BG_SLOT_COUNT = 16;
let bgSlots = [];

function setupEphemeralBackgroundSystem() {
  // Pre-generate textures for the entire curated library
  bgTextures = RANDOM_BACKGROUND_LIBRARY.map(item => createFoggyTextTexture(item.text, item.color));

  bgSlots = [];
  const incommensuratePeriods = [
    4.3, 5.1, 4.6, 5.4, 4.8, 5.2, 4.4, 5.6,
    4.7, 5.3, 4.5, 5.5, 4.9, 5.0, 4.2, 5.7
  ];

  for (let k = 0; k < BG_SLOT_COUNT; k++) {
    const mat = new THREE.SpriteMaterial({
      map: bgTextures[k % bgTextures.length],
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sp = new THREE.Sprite(mat);
    const aspect = 256 / 44; // 5.81
    const baseH = 0.105;
    sp.scale.set(baseH * aspect, baseH, 1.0);
    scene.add(sp);

    bgSlots.push({
      sprite: sp,
      period: incommensuratePeriods[k],
      stagger: k * (5.0 / BG_SLOT_COUNT),
      aspect,
      baseH
    });
  }
}

// Rejection sampling for safe candidate spawn positions
function getSafeBackgroundPosition(k, cycle) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const seedX = pseudoHashFloat(k, cycle, 10 + attempt * 3);
    const seedY = pseudoHashFloat(k, cycle, 11 + attempt * 3);
    const seedZ = pseudoHashFloat(k, cycle, 12 + attempt * 3);

    const x = -1.6 + seedX * 5.8;
    const y = -1.0 + seedY * 2.0;
    const z = -2.3 + seedZ * 1.3;

    // Rule 1: Safe distance from the foreground infinity ribbon
    const distToCurve = getDistanceToInfinityCurve(x, y);
    if (distToCurve < 0.38) continue;

    // Rule 2: Safe clearance from left identity typography card
    if (x > -1.2 && x < 0.45 && y > -0.65 && y < 0.65) continue;

    return { x, y, z };
  }
  // Deterministic fallback in safe outer corner
  const fallbackX = 3.3 + (k % 3) * 0.3;
  const fallbackY = -0.8 + ((k * 7) % 5) * 0.35;
  return { x: fallbackX, y: fallbackY, z: -1.8 };
}

// Update ephemeral background text at simulation time t
function updateEphemeralBackground(t) {
  for (let k = 0; k < bgSlots.length; k++) {
    const slot = bgSlots[k];
    const absT = t + slot.stagger;
    const cycle = Math.floor(absT / slot.period);
    const tau = absT - cycle * slot.period; // [0, period)

    // Pick fragment text from library using cycle hash
    const textIdx = pseudoHash(k, cycle, 1) % RANDOM_BACKGROUND_LIBRARY.length;
    if (slot.sprite.material.map !== bgTextures[textIdx]) {
      slot.sprite.material.map = bgTextures[textIdx];
      slot.sprite.material.needsUpdate = true;
    }

    // Lifecycle phase durations
    const tIn = 0.8 + 0.4 * pseudoHashFloat(k, cycle, 2);
    const tOut = 0.8 + 0.4 * pseudoHashFloat(k, cycle, 3);
    const tHold = slot.period - tIn - tOut;
    const maxOpacity = 0.16 + 0.10 * pseudoHashFloat(k, cycle, 4);

    // Calculate smooth Hermite cubic opacity curve
    let opacity = 0.0;
    if (tau < tIn) {
      const u = tau / tIn;
      opacity = maxOpacity * (u * u * (3.0 - 2.0 * u));
    } else if (tau < tIn + tHold) {
      opacity = maxOpacity;
    } else {
      const u = (tau - tIn - tHold) / tOut;
      const clampedU = Math.min(1.0, Math.max(0.0, u));
      opacity = maxOpacity * (1.0 - (clampedU * clampedU * (3.0 - 2.0 * clampedU)));
    }

    // Safe spawn position with subtle organic drift
    const pos = getSafeBackgroundPosition(k, cycle);
    const driftVx = (pseudoHashFloat(k, cycle, 5) - 0.5) * 0.035;
    const driftVy = (pseudoHashFloat(k, cycle, 6) - 0.5) * 0.020;
    const driftPhase = (tau - slot.period * 0.5);

    slot.sprite.position.set(
      pos.x + driftVx * driftPhase,
      pos.y + driftVy * driftPhase,
      pos.z
    );

    const h = slot.baseH * (0.95 + 0.10 * pseudoHashFloat(k, cycle, 7));
    slot.sprite.scale.set(h * slot.aspect, h, 1.0);
    slot.sprite.material.opacity = Math.max(0.0, Math.min(0.25, opacity));
  }
}

// --- 2.3 KINETIC NEXUS ACCELERATION SPARKS ---
const NUM_NEXUS_SPARKS = 80;
let nexusSparkGeo, nexusSparkData = [];

function setupNexusSparks() {
  const sparkTex = createRadialGlowTexture();
  nexusSparkGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(NUM_NEXUS_SPARKS * 3);
  const colors = new Float32Array(NUM_NEXUS_SPARKS * 3);
  nexusSparkData = [];

  const sparkPalette = [
    new THREE.Color(0x00f0ff), // Cyan
    new THREE.Color(0x38bdf8), // Sky Blue
    new THREE.Color(0xffffff), // White
    new THREE.Color(0xc084fc)  // Purple
  ];

  for (let i = 0; i < NUM_NEXUS_SPARKS; i++) {
    const isFirstCrossing = (i % 2 === 0);
    const baseCrossingS = isFirstCrossing ? 0.25 : 0.75;

    nexusSparkData.push({
      baseCrossingS,
      phaseOffset: (i / NUM_NEXUS_SPARKS),
      radSpread: (Math.random() - 0.5) * 0.28,
      depthSpread: (Math.random() - 0.5) * 0.22,
      speedScale: 1.25 + Math.random() * 0.45
    });

    const c = sparkPalette[i % sparkPalette.length];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  nexusSparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nexusSparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.065,
    vertexColors: true,
    map: sparkTex,
    transparent: true,
    opacity: 0.90,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const nexusPoints = new THREE.Points(nexusSparkGeo, mat);
  scene.add(nexusPoints);
}

function updateNexusSparks(t) {
  if (!nexusSparkGeo) return;
  const positions = nexusSparkGeo.attributes.position.array;
  const cycleProgress = (t % LOOP_DURATION) / LOOP_DURATION;
  const upVec = new THREE.Vector3(0, 0, 1);

  for (let i = 0; i < NUM_NEXUS_SPARKS; i++) {
    const nd = nexusSparkData[i];
    // Spark emerges near crossing and accelerates outwards
    const sparkPhase = ((cycleProgress * nd.speedScale + nd.phaseOffset) % 0.16) - 0.08;
    const currentS = nd.baseCrossingS + sparkPhase;

    const { pos, tangent } = samplePathByArcLength(currentS);
    const normal = new THREE.Vector3().crossVectors(tangent, upVec).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    // Outward radial acceleration
    const accelRadius = nd.radSpread * (1.0 + Math.abs(sparkPhase) * 6.0);
    const p = pos.clone()
      .addScaledVector(normal, accelRadius)
      .addScaledVector(binormal, nd.depthSpread);

    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }
  nexusSparkGeo.attributes.position.needsUpdate = true;
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
  precomputeKineticTiming();
  setupLighting();
  setupLuminousCore();
  setupCodeParticles();
  setupSparkParticles();
  setupNexusSparks();
  setupCenterGlow();
  setupEphemeralBackgroundSystem();
  setupAmbientMotes();

  const loadingEl = document.getElementById('loading-indicator');
  if (loadingEl) loadingEl.style.display = 'none';
  isLoaded = true;

  // Deterministic frame capture seeking interface
  window.seekSimulationTime = (t) => {
    isManualTime = true;
    updateScene(t);
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
const TOTAL_TOKENS = 280;

function setupCodeParticles() {
  const tokenTextures = SYNTAX_TOKENS.map(tok => createTokenTexture(tok));
  codeSpriteList = [];

  const LANES = [-0.09, 0.0, 0.09];
  const DEPTH_LANES = [-0.06, 0.0, 0.06];

  for (let i = 0; i < TOTAL_TOKENS; i++) {
    const tokIdx = i % SYNTAX_TOKENS.length;
    const tokenInfo = SYNTAX_TOKENS[tokIdx];

    const mat = new THREE.SpriteMaterial({
      map: tokenTextures[tokIdx],
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(mat);
    const baseS = i / TOTAL_TOKENS;

    const laneIdx = i % 3;
    const seed = (i * 1.6180339887) % 1.0;
    const seed2 = (i * 2.7182818284) % 1.0;

    const radialOffset = LANES[laneIdx] + (seed - 0.5) * 0.05;
    const depthOffset = DEPTH_LANES[(laneIdx + 1) % 3] + (seed2 - 0.5) * 0.05;

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
      depthOffset: (seed2 - 0.5) * 0.16
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

// --- 9. BACKGROUND DIGITAL DUST PARTICLES (150 Particles) ---
const NUM_MOTES = 150;
let motesData = [];

function setupAmbientMotes() {
  const moteTex = createRadialGlowTexture();
  motesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(NUM_MOTES * 3);
  const colors = new Float32Array(NUM_MOTES * 3);
  motesData = [];

  const moteColors = [
    new THREE.Color(0x00f0ff), // Cyan
    new THREE.Color(0x38bdf8), // Sky Blue
    new THREE.Color(0x818cf8), // Indigo
    new THREE.Color(0xc084fc), // Purple
    new THREE.Color(0xe28743), // Amber
    new THREE.Color(0x2dd4bf)  // Mint
  ];

  for (let i = 0; i < NUM_MOTES; i++) {
    const seed1 = (i * 1.6180339887) % 1.0;
    const seed2 = (i * 2.7182818284) % 1.0;
    const seed3 = (i * 3.1415926535) % 1.0;

    const x = -1.8 + seed1 * 6.4;
    const y = -1.2 + seed2 * 2.4;
    const z = -2.4 + seed3 * 1.6;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const c = moteColors[i % moteColors.length];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    motesData.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      phase: seed1 * Math.PI * 2,
      harmonicK: (i % 3) + 1
    });
  }

  motesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  motesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const moteMat = new THREE.PointsMaterial({
    size: 0.052,
    vertexColors: true,
    map: moteTex,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  ambientMotes = new THREE.Points(motesGeo, moteMat);
  scene.add(ambientMotes);
}

// --- 10. DETERMINISTIC DYNAMICS UPDATE ---
function updateScene(t) {
  if (!isLoaded) return;

  const cycleProgress = (t % LOOP_DURATION) / LOOP_DURATION; // [0, 1)
  const upVec = new THREE.Vector3(0, 0, 1);

  // 1. UPDATE CODE TOKEN SPRITES WITH KINETIC ACCELERATION
  for (let i = 0; i < codeSpriteList.length; i++) {
    const sp = codeSpriteList[i];
    const ud = sp.userData;

    // Advance path coordinate s using kinetic timing mapping
    const curTimePhase = ud.baseS + cycleProgress;
    const curS = getKineticS(curTimePhase);
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

  // 2. UPDATE MICRO-SPARK PARTICLES WITH KINETIC ACCELERATION
  const sparkPositions = sparkGeo.attributes.position.array;
  for (let i = 0; i < NUM_SPARKS; i++) {
    const sd = sparkData[i];
    const curTimePhase = sd.baseS + cycleProgress;
    const curS = getKineticS(curTimePhase);
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

  // 3. UPDATE KINETIC NEXUS SPARKS
  updateNexusSparks(t);

  // 4. CENTER CROSSING GLOW PULSE
  if (centerGlowSprite) {
    const pulse = 1.0 + Math.sin(cycleProgress * Math.PI * 4) * 0.06;
    centerGlowSprite.scale.set(1.4 * pulse, 1.4 * pulse, 1.0);
    centerGlowSprite.material.opacity = 0.20 + Math.sin(cycleProgress * Math.PI * 4) * 0.04;
  }

  // 5. UPDATE EPHEMERAL RANDOMIZED BACKGROUND CODE TEXT
  updateEphemeralBackground(t);

  // 6. AMBIENT DIGITAL MOTES (Continuous harmonic drift)
  if (ambientMotes) {
    const motePositions = motesGeo.attributes.position.array;
    const twoPi = Math.PI * 2;
    for (let i = 0; i < NUM_MOTES; i++) {
      const md = motesData[i];
      const angle = cycleProgress * twoPi * md.harmonicK + md.phase;
      motePositions[i * 3] = md.baseX + Math.sin(angle) * 0.09;
      motePositions[i * 3 + 1] = md.baseY + Math.cos(angle * 0.8) * 0.07;
      motePositions[i * 3 + 2] = md.baseZ + Math.sin(angle * 0.6) * 0.05;
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
    globalTime += dt;
    updateScene(globalTime);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(renderLoop);
}

window.addEventListener('DOMContentLoaded', init);
