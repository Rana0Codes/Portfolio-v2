/**
 * Juyel.OS — 3D Project Universe & Interactive Data Visualization Engine
 * Genuine browser-rendered Three.js WebGL experience with celestial node clustering,
 * orbital camera mechanics, raycasting interaction, and resilient 2D Canvas fallback.
 */

import { ownerProfile } from './owner-profile.js';
import { windowManager } from './os-window-manager.js';

export class Universe3DController {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animationFrameId = null;
    this.isWebGLAvailable = this.checkWebGL();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Interaction State
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0.001, y: 0.0006 };
    this.targetRotation = { x: 0.1, y: 0 };
    this.currentRotation = { x: 0.1, y: 0 };
    this.zoomDistance = 140;
    this.targetZoom = 140;
    this.hoveredNode = null;
    this.selectedNode = null;
    this.nodes = [];
    this.connectingLines = null;
    this.particles = null;
    this.raycaster = null;
    this.mouse = null;
    this.currentViewMode = '3d-universe'; // '3d-universe' or 'dependency-matrix'

    this.init();
  }

  checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  init() {
    this.createWindowMarkup();
    this.setupWindowMount();
    this.handleDeepLinks();
  }

  /* --------------------------------------------------------------------------
     1. Window DOM Injection & Lifecycle Mount
     -------------------------------------------------------------------------- */
  createWindowMarkup() {
    const windowLayer = document.getElementById('window-layer');
    if (!windowLayer) return;

    if (document.getElementById('win-universe3d')) return;

    const winEl = document.createElement('div');
    winEl.className = 'os-window';
    winEl.id = 'win-universe3d';
    winEl.setAttribute('role', 'dialog');
    winEl.setAttribute('aria-labelledby', 'title-universe3d');

    winEl.innerHTML = `
      <div class="window-titlebar">
        <div class="window-controls-traffic">
          <button class="traffic-btn close" title="Close window" aria-label="Close">&times;</button>
          <button class="traffic-btn minimize" title="Minimize window" aria-label="Minimize">&minus;</button>
          <button class="traffic-btn maximize" title="Maximize window" aria-label="Maximize">+</button>
        </div>
        <div class="window-title-info" id="title-universe3d">
          <i class="fas fa-cube"></i> 3D Project Universe — WebGL Interactive Cluster
        </div>
        <div class="window-actions-right">
          <span class="window-tag-badge" id="universe-fps-badge">Three.js WebGL</span>
        </div>
      </div>
      <div class="window-body universe3d-body" id="universe3d-mount">
        <!-- Top Control Bar -->
        <div class="universe-controls-bar">
          <div class="universe-view-modes">
            <button class="u-pill-btn active" id="btn-mode-3d" data-mode="3d-universe">
              <i class="fas fa-globe"></i> 3D Celestial Space
            </button>
            <button class="u-pill-btn" id="btn-mode-matrix" data-mode="dependency-matrix">
              <i class="fas fa-project-diagram"></i> Technology Dependency Graph
            </button>
          </div>
          <div class="universe-actions-row">
            <button class="u-pill-btn" id="btn-reset-cam" title="Reset Camera View">
              <i class="fas fa-compass"></i> Reset View
            </button>
            <button class="u-pill-btn" id="btn-motion-toggle" title="Toggle Auto-Rotation">
              <i class="fas fa-sync-alt"></i> Auto-Rotate: ON
            </button>
          </div>
        </div>

        <!-- Main Canvas Viewport -->
        <div class="universe-viewport-wrap" id="universe-viewport">
          <canvas id="universe3d-canvas" class="universe-canvas"></canvas>
          <div id="matrix-canvas-mount" class="matrix-canvas-wrap" style="display: none;"></div>

          <!-- 3D HUD Tooltip -->
          <div id="universe-hud-tooltip" class="universe-hud-tooltip" style="display: none;">
            <div class="hud-tooltip-title" id="hud-tt-title">Project Node</div>
            <div class="hud-tooltip-sub" id="hud-tt-sub">Category & Tech</div>
          </div>

          <!-- Bottom Control Instructions -->
          <div class="universe-hint-bar">
            <span><i class="fas fa-mouse-pointer"></i> Drag to rotate</span>
            <span><i class="fas fa-search-plus"></i> Scroll to zoom</span>
            <span><i class="fas fa-hand-pointer"></i> Click node to inspect</span>
          </div>
        </div>

        <!-- Node Inspector Drawer (Side HUD) -->
        <aside class="universe-inspector-drawer" id="universe-inspector" style="display: none;">
          <div class="inspector-header">
            <div class="inspector-badge" id="insp-cat-badge">Web Application</div>
            <button class="inspector-close" id="insp-close-btn">&times;</button>
          </div>
          <h3 class="inspector-title" id="insp-title">Project Name</h3>
          <div class="inspector-metric-card" id="insp-metric-box">
            <div class="metric-val" id="insp-metric-val">16.2ms</div>
            <div class="metric-desc" id="insp-metric-desc">Verified Metric</div>
          </div>
          <p class="inspector-desc" id="insp-desc">Project intervention summary...</p>
          <div class="inspector-tech-stack" id="insp-stack-chips"></div>
          <div class="inspector-actions">
            <a href="#" target="_blank" rel="noopener noreferrer" class="btn-primary" id="insp-live-btn">
              <i class="fas fa-external-link-alt"></i> Live Demo
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" class="btn-secondary" id="insp-repo-btn">
              <i class="fab fa-github"></i> Repository
            </a>
          </div>
        </aside>
      </div>
    `;

    windowLayer.appendChild(winEl);

    // Register with WindowManager
    windowManager.registerWindow('universe3d', {
      title: '3D Project Universe — WebGL',
      defaultWidth: 840,
      defaultHeight: 580,
      defaultX: 70,
      defaultY: 45
    });

    // Add Desktop Icon
    const desktopGrid = document.querySelector('.desktop-grid');
    if (desktopGrid) {
      const icon = document.createElement('div');
      icon.className = 'desktop-icon-item';
      icon.setAttribute('data-app', 'universe3d');
      icon.setAttribute('tabindex', '0');
      icon.setAttribute('role', 'button');
      icon.setAttribute('aria-label', 'Open 3D Universe');
      icon.innerHTML = `
        <div class="icon-badge-box icon-badge-3d" style="background: linear-gradient(135deg, rgba(0,240,255,0.2), rgba(157,78,221,0.3)); border-color: rgba(0,240,255,0.5);">
          <i class="fas fa-cube" style="color: #00f0ff;"></i>
        </div>
        <span class="icon-label">3D Universe</span>
        <span class="icon-subtag">WebGL Experience</span>
      `;
      icon.addEventListener('click', () => {
        windowManager.openWindow('universe3d');
      });
      desktopGrid.insertBefore(icon, desktopGrid.firstChild);
    }

    // Add Dock Icon
    const dockContainer = document.querySelector('.system-dock-container');
    if (dockContainer) {
      const dockBtn = document.createElement('button');
      dockBtn.className = 'dock-item-btn';
      dockBtn.setAttribute('data-app', 'universe3d');
      dockBtn.setAttribute('data-tooltip', '3D Project Universe (WebGL)');
      dockBtn.setAttribute('aria-label', 'Launch 3D Universe');
      dockBtn.innerHTML = `
        <i class="fas fa-cube" style="color: #00f0ff;"></i>
        <span class="dock-active-dot"></span>
      `;
      dockBtn.addEventListener('click', () => {
        const winData = windowManager.windows.get('universe3d');
        if (winData && winData.isOpen) {
          if (winData.isMinimized) {
            windowManager.openWindow('universe3d');
          } else if (windowManager.activeWindowId === 'universe3d') {
            windowManager.minimizeWindow('universe3d');
          } else {
            windowManager.focusWindow('universe3d');
          }
        } else {
          windowManager.openWindow('universe3d');
        }
      });
      const divider = dockContainer.querySelector('.dock-divider');
      if (divider) {
        dockContainer.insertBefore(dockBtn, divider);
      } else {
        dockContainer.appendChild(dockBtn);
      }
    }

    // Add Top System Bar Nav Pill
    const navLinks = document.querySelector('.system-nav-links');
    if (navLinks) {
      const pill = document.createElement('button');
      pill.className = 'nav-pill-btn';
      pill.setAttribute('data-open-win', 'universe3d');
      pill.innerHTML = `<i class="fas fa-cube" style="color: #00f0ff;"></i> 3D Universe`;
      pill.addEventListener('click', () => {
        windowManager.openWindow('universe3d');
      });
      navLinks.insertBefore(pill, navLinks.firstChild);
    }

    // Add Hero Stage CTA Button
    const heroActions = document.querySelector('.hero-actions-row');
    if (heroActions) {
      const cta = document.createElement('button');
      cta.className = 'btn-primary';
      cta.id = 'hero-launch-3d';
      cta.style.background = 'linear-gradient(135deg, #00f0ff 0%, #7928ca 100%)';
      cta.style.boxShadow = '0 0 16px rgba(0, 240, 255, 0.4)';
      cta.innerHTML = `<i class="fas fa-cube"></i> Explore in 3D WebGL`;
      cta.addEventListener('click', () => {
        windowManager.openWindow('universe3d');
      });
      heroActions.insertBefore(cta, heroActions.firstChild);
    }
  }

  setupWindowMount() {
    this.canvas = document.getElementById('universe3d-canvas');
    this.container = document.getElementById('universe-viewport');
    if (!this.canvas || !this.container) return;

    // Initialize 3D Engine or 2D Fallback
    if (this.isWebGLAvailable && typeof window.THREE !== 'undefined') {
      this.initThreeScene();
    } else if (this.isWebGLAvailable && typeof window.THREE === 'undefined') {
      // Load local Three.js script dynamically
      const script = document.createElement('script');
      script.src = 'js/vendor/three.min.js';
      script.onload = () => {
        this.initThreeScene();
      };
      script.onerror = () => {
        console.warn('Three.js failed to load, falling back to 2D Canvas');
        this.initCanvasFallback();
      };
      document.head.appendChild(script);
    } else {
      this.initCanvasFallback();
    }

    this.bindWindowEvents();
  }

  /* --------------------------------------------------------------------------
     2. Three.js 3D WebGL Scene Initialization
     -------------------------------------------------------------------------- */
  initThreeScene() {
    const THREE = window.THREE;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.z = this.zoomDistance;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 1.5, 300);
    pointLight1.position.set(60, 60, 80);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x9d4edd, 1.2, 300);
    pointLight2.position.set(-60, -50, -50);
    this.scene.add(pointLight2);

    // Starfield Particle Cluster
    this.createStarfield();

    // Core Cluster & Project Nodes
    this.buildCelestialNodes();

    // Raycasting & Mouse
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    // Event Listeners
    this.bindThreeInteractionEvents();

    // Start Animation Loop
    this.animate();
  }

  createStarfield() {
    const THREE = window.THREE;
    const particleCount = 650;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 600;
      positions[i + 1] = (Math.random() - 0.5) * 600;
      positions[i + 2] = (Math.random() - 0.5) * 600;

      // Color variation between cyan, purple and white
      const rVal = Math.random();
      if (rVal < 0.4) {
        colors[i] = 0.0; colors[i + 1] = 0.94; colors[i + 2] = 1.0; // Cyan
      } else if (rVal < 0.7) {
        colors[i] = 0.61; colors[i + 1] = 0.3; colors[i + 2] = 0.86; // Violet
      } else {
        colors[i] = 0.9; colors[i + 1] = 0.9; colors[i + 2] = 1.0; // White
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  buildCelestialNodes() {
    const THREE = window.THREE;
    this.nodes = [];

    // 1. Central Engineering Core
    const coreGeo = new THREE.IcosahedronGeometry(12, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.userData = {
      isCore: true,
      title: 'Juyel Rana Engineering Hub',
      category: 'Titanium System Core',
      metric: '5 Shipped Projects',
      desc: 'Central architecture connecting Full-Stack Systems, Edge AI, and Developer Utilities.'
    };
    this.scene.add(coreMesh);
    this.nodes.push(coreMesh);

    // Inner glowing sphere inside core
    const innerGeo = new THREE.SphereGeometry(6, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false
    });
    coreMesh.add(new THREE.Mesh(innerGeo, innerMat));

    // 2. Project Nodes Data
    const projectDefs = [
      {
        id: 'smart-image-document-detector',
        title: 'Smart Image & Document Detector',
        category: 'Edge AI / Vision',
        metric: '16.2–18.4ms Inference',
        desc: 'Browser-based neural classifier utilizing TensorFlow.js with MobileNetV2 UINT8 quantization.',
        color: 0x9d4edd, // Violet
        size: 7.5,
        pos: { x: 42, y: 22, z: 15 },
        repo: 'https://github.com/Rana0Codes/smart-image-document-detector',
        live: 'https://github.com/Rana0Codes/smart-image-document-detector',
        stack: ['TensorFlow.js', 'MobileNetV2', 'Python', 'WebGL']
      },
      {
        id: 'cv-template',
        title: 'CV Template & Biodata Builder',
        category: 'Client-Side Productivity',
        metric: '5 Modular Layouts',
        desc: 'Zero-server ATS resume and marriage biodata builder with vector A4 print engine.',
        color: 0x10b981, // Emerald Green
        size: 7.0,
        pos: { x: -45, y: 18, z: 20 },
        repo: 'https://github.com/Rana0Codes/cv-template',
        live: 'https://rana0codes.github.io/cv-template/',
        stack: ['Vanilla JS', 'CSS3 Print', 'PWA', 'Vite']
      },
      {
        id: 'anime-recommendation-generator',
        title: 'Anime Recommendation & Poster Studio',
        category: 'Creative Web Application',
        metric: '<300ms GraphQL Latency',
        desc: 'Interactive discovery and 1080p poster generation studio using AniList GraphQL API.',
        color: 0xf43f5e, // Coral/Rose
        size: 6.8,
        pos: { x: 38, y: -28, z: -18 },
        repo: 'https://github.com/Rana0Codes/Anime-Recommendation-Generator',
        live: 'https://github.com/Rana0Codes/Anime-Recommendation-Generator',
        stack: ['React 18', 'Material-UI', 'GraphQL', 'html2canvas']
      },
      {
        id: 'portfolio-v2',
        title: 'Portfolio v2 (Juyel.OS) & 3D Universe',
        category: 'Interactive Web Desktop',
        metric: '60 FPS Three.js Engine',
        desc: 'VisionOS-inspired multi-window operating system featuring Web Audio API and 3D WebGL.',
        color: 0x00f0ff, // Electric Cyan
        size: 7.2,
        pos: { x: -38, y: -24, z: -15 },
        repo: 'https://github.com/Rana0Codes/Portfolio-v2',
        live: 'https://rana0codes.github.io/Portfolio-v2/',
        stack: ['Three.js', 'Vanilla JS', 'Glassmorphism', 'Web Audio API']
      },
      {
        id: 'portfolio-system',
        title: 'Dynamic Web Engine & Admin CMS',
        category: 'Full-Stack Web Application',
        metric: 'Sub-Second Firestore Sync',
        desc: 'Authenticated developer showcase with real-time Firestore CRUD portal and Web3Forms.',
        color: 0xf59e0b, // Amber Gold
        size: 6.5,
        pos: { x: 0, y: 48, z: -25 },
        repo: 'https://github.com/Rana0Codes/Portfolio',
        live: 'https://rana0codes.github.io/Portfolio/',
        stack: ['JavaScript', 'Firebase Auth', 'Firestore', 'GSAP']
      },
      {
        id: 'bachat-guru',
        title: 'BachatGuru Expense Tracker',
        category: 'Mobile Utility Platform',
        metric: 'Zero Offline Data Loss',
        desc: 'Offline-first mobile budgeting tool with instant cloud synchronization.',
        color: 0x06b6d4, // Mint Cyan
        size: 6.2,
        pos: { x: 0, y: -46, z: 22 },
        repo: 'https://github.com/Rana0Codes',
        live: 'https://github.com/Rana0Codes',
        stack: ['Flutter', 'Dart', 'Firebase', 'State Management']
      }
    ];

    projectDefs.forEach((p) => {
      const geo = new THREE.SphereGeometry(p.size, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: 0.3,
        metalness: 0.7,
        emissive: p.color,
        emissiveIntensity: 0.4
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.pos.x, p.pos.y, p.pos.z);
      mesh.userData = {
        id: p.id,
        isProject: true,
        title: p.title,
        category: p.category,
        metric: p.metric,
        desc: p.desc,
        repo: p.repo,
        live: p.live,
        stack: p.stack,
        baseColor: p.color,
        baseSize: p.size
      };

      // Orbit Ring around node
      const ringGeo = new THREE.RingGeometry(p.size * 1.35, p.size * 1.45, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: p.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      mesh.add(ringMesh);

      this.scene.add(mesh);
      this.nodes.push(mesh);
    });

    // 3. Connect Luminous Dependency Splines
    this.createConstellationLines();
  }

  createConstellationLines() {
    const THREE = window.THREE;
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });

    const points = [];
    const core = this.nodes[0];

    // Connect core to all projects
    for (let i = 1; i < this.nodes.length; i++) {
      points.push(core.position);
      points.push(this.nodes[i].position);
    }

    // Connect interconnected projects (smart-image to anime, cv-template to portfolio-v2, etc.)
    if (this.nodes.length >= 6) {
      points.push(this.nodes[1].position, this.nodes[3].position);
      points.push(this.nodes[2].position, this.nodes[4].position);
      points.push(this.nodes[4].position, this.nodes[5].position);
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    this.connectingLines = new THREE.LineSegments(lineGeo, lineMat);
    this.scene.add(this.connectingLines);
  }

  /* --------------------------------------------------------------------------
     3. Interaction, Camera Orbit & Raycasting
     -------------------------------------------------------------------------- */
  bindThreeInteractionEvents() {
    const viewport = this.container;

    // Mouse / Touch Drag to Rotate
    viewport.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.targetRotation.y += deltaX * 0.006;
        this.targetRotation.x += deltaY * 0.006;

        // Clamp vertical rotation
        this.targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetRotation.x));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      // Update Mouse coordinates for Raycasting
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // Zoom on Wheel
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetZoom += e.deltaY * 0.12;
      this.targetZoom = Math.max(60, Math.min(260, this.targetZoom));
    }, { passive: false });

    // Click to Select Node
    viewport.addEventListener('click', (e) => {
      if (this.hoveredNode) {
        this.selectNode(this.hoveredNode);
      }
    });

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    resizeObserver.observe(viewport);
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Auto-rotation if not dragging and not reduced-motion
    if (!this.isDragging && !this.isReducedMotion) {
      this.targetRotation.y += 0.0022;
    }

    // Smooth Damping (Lerp)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
    this.zoomDistance += (this.targetZoom - this.zoomDistance) * 0.08;

    // Apply Camera Position in Spherical Coordinates
    this.camera.position.x = this.zoomDistance * Math.sin(this.currentRotation.y) * Math.cos(this.currentRotation.x);
    this.camera.position.y = this.zoomDistance * Math.sin(this.currentRotation.x);
    this.camera.position.z = this.zoomDistance * Math.cos(this.currentRotation.y) * Math.cos(this.currentRotation.x);
    this.camera.lookAt(0, 0, 0);

    // Particle subtle rotation
    if (this.particles) {
      this.particles.rotation.y += 0.0004;
    }

    // Core mesh subtle pulse
    if (this.nodes[0]) {
      this.nodes[0].rotation.x += 0.008;
      this.nodes[0].rotation.y += 0.01;
    }

    // Perform Raycasting
    this.handleRaycasting();

    this.renderer.render(this.scene, this.camera);
  }

  handleRaycasting() {
    if (!this.raycaster || !this.camera || !this.nodes.length) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodes, false);

    const hudTooltip = document.getElementById('universe-hud-tooltip');
    const ttTitle = document.getElementById('hud-tt-title');
    const ttSub = document.getElementById('hud-tt-sub');

    if (intersects.length > 0) {
      const hit = intersects[0].object;

      if (this.hoveredNode !== hit) {
        if (this.hoveredNode && this.hoveredNode !== this.selectedNode) {
          this.hoveredNode.scale.set(1, 1, 1);
        }
        this.hoveredNode = hit;
        this.canvas.style.cursor = 'pointer';
      }

      // Pulse hovered node
      this.hoveredNode.scale.set(1.2, 1.2, 1.2);

      // Show HUD tooltip
      if (hudTooltip && ttTitle && ttSub) {
        const uData = hit.userData;
        ttTitle.textContent = uData.title;
        ttSub.textContent = `${uData.category} • ${uData.metric}`;
        hudTooltip.style.display = 'block';

        // Project 3D coordinate to screen 2D
        const vector = hit.position.clone();
        vector.project(this.camera);
        const rect = this.canvas.getBoundingClientRect();
        const screenX = (vector.x * 0.5 + 0.5) * rect.width;
        const screenY = (-(vector.y * 0.5) + 0.5) * rect.height;

        hudTooltip.style.left = `${Math.min(rect.width - 160, Math.max(10, screenX - 60))}px`;
        hudTooltip.style.top = `${Math.max(10, screenY - 55)}px`;
      }
    } else {
      if (this.hoveredNode) {
        if (this.hoveredNode !== this.selectedNode) {
          this.hoveredNode.scale.set(1, 1, 1);
        }
        this.hoveredNode = null;
        this.canvas.style.cursor = 'default';
      }
      if (hudTooltip) {
        hudTooltip.style.display = 'none';
      }
    }
  }

  /* --------------------------------------------------------------------------
     4. Node Selection & Inspector Drawer
     -------------------------------------------------------------------------- */
  selectNode(node) {
    this.selectedNode = node;
    const data = node.userData;

    const drawer = document.getElementById('universe-inspector');
    const title = document.getElementById('insp-title');
    const badge = document.getElementById('insp-cat-badge');
    const metricVal = document.getElementById('insp-metric-val');
    const metricDesc = document.getElementById('insp-metric-desc');
    const desc = document.getElementById('insp-desc');
    const stackWrap = document.getElementById('insp-stack-chips');
    const liveBtn = document.getElementById('insp-live-btn');
    const repoBtn = document.getElementById('insp-repo-btn');

    if (!drawer) return;

    drawer.style.display = 'flex';
    title.textContent = data.title;
    badge.textContent = data.category;
    metricVal.textContent = data.metric;
    metricDesc.textContent = 'Verified Benchmark Metric';
    desc.textContent = data.desc;

    // Stack Chips
    if (stackWrap) {
      if (data.stack && data.stack.length) {
        stackWrap.innerHTML = data.stack.map(s => `<span class="tech-chip">${s}</span>`).join('');
      } else {
        stackWrap.innerHTML = '<span class="tech-chip">Architecture Core</span>';
      }
    }

    // Action buttons
    if (liveBtn) {
      if (data.live) {
        liveBtn.href = data.live;
        liveBtn.style.display = 'inline-flex';
      } else {
        liveBtn.style.display = 'none';
      }
    }

    if (repoBtn) {
      if (data.repo) {
        repoBtn.href = data.repo;
        repoBtn.style.display = 'inline-flex';
      } else {
        repoBtn.style.display = 'none';
      }
    }
  }

  /* --------------------------------------------------------------------------
     5. Resilient 2D Canvas Fallback (Graceful Degradation)
     -------------------------------------------------------------------------- */
  initCanvasFallback() {
    console.log('Rendering high-fidelity 2D Canvas interactive network fallback.');
    const fpsBadge = document.getElementById('universe-fps-badge');
    if (fpsBadge) fpsBadge.textContent = '2D Interactive Canvas';

    const canvas = this.canvas;
    const ctx = canvas.getContext('2d');
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;
    canvas.width = width;
    canvas.height = height;

    const fallbackNodes = [
      { name: 'Core Hub', x: width / 2, y: height / 2, r: 24, color: '#00f0ff', metric: 'Central OS' },
      { name: 'Smart Image Detector', x: width / 2 + 150, y: height / 2 - 80, r: 18, color: '#9d4edd', metric: '16.2ms WebGL' },
      { name: 'CV Template', x: width / 2 - 160, y: height / 2 - 70, r: 18, color: '#10b981', metric: '5 Layouts' },
      { name: 'Anime Studio', x: width / 2 + 140, y: height / 2 + 100, r: 16, color: '#f43f5e', metric: '<300ms GraphQL' },
      { name: 'Portfolio-v2', x: width / 2 - 140, y: height / 2 + 90, r: 18, color: '#00f0ff', metric: 'Titanium OS' },
      { name: 'Portfolio CMS', x: width / 2, y: height / 2 - 140, r: 16, color: '#f59e0b', metric: 'Firestore' }
    ];

    const render2D = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Draw connections
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < fallbackNodes.length; i++) {
        ctx.beginPath();
        ctx.moveTo(fallbackNodes[0].x, fallbackNodes[0].y);
        ctx.lineTo(fallbackNodes[i].x, fallbackNodes[i].y);
        ctx.stroke();
      }

      // Draw nodes
      fallbackNodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x, n.y + n.r + 16);
      });
    };

    render2D();
  }

  /* --------------------------------------------------------------------------
     6. Technology Dependency Graph & Matrix View (Mode B)
     -------------------------------------------------------------------------- */
  renderDependencyMatrix() {
    const mount = document.getElementById('matrix-canvas-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="matrix-graph-container">
        <div class="matrix-header-row">
          <h4 style="font-size: 14px; color: var(--color-cyan); font-family: var(--font-display);">
            <i class="fas fa-network-wired"></i> Architecture & Technology Dependency Matrix
          </h4>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">
            Verified Production Linkages
          </span>
        </div>

        <div class="matrix-card-grid">
          <div class="matrix-node-card">
            <div class="m-card-title"><i class="fas fa-brain" style="color: #9d4edd;"></i> Edge AI & Computer Vision</div>
            <div class="m-card-repo">smart-image-document-detector</div>
            <div class="m-card-stat"><strong>Benchmark:</strong> 16.2–18.4ms client WebGL inference</div>
            <div class="m-card-links">Dependencies: TensorFlow.js &bull; MobileNetV2 &bull; Python &bull; HTML5 Canvas</div>
          </div>

          <div class="matrix-node-card">
            <div class="m-card-title"><i class="fas fa-file-alt" style="color: #10b981;"></i> Document & Print Engine</div>
            <div class="m-card-repo">cv-template</div>
            <div class="m-card-stat"><strong>Benchmark:</strong> 5 A4 Layouts &bull; Sub-second print rendering</div>
            <div class="m-card-links">Dependencies: Vanilla JS &bull; CSS Paged Media &bull; PWA &bull; Vite</div>
          </div>

          <div class="matrix-node-card">
            <div class="m-card-title"><i class="fas fa-tv" style="color: #f43f5e;"></i> GraphQL Media Discovery</div>
            <div class="m-card-repo">Anime-Recommendation-Generator</div>
            <div class="m-card-stat"><strong>Benchmark:</strong> &lt;300ms AniList GraphQL Query &bull; 1080p Poster Export</div>
            <div class="m-card-links">Dependencies: React 18 &bull; Material-UI v5 &bull; html2canvas &bull; GraphQL</div>
          </div>

          <div class="matrix-node-card">
            <div class="m-card-title"><i class="fas fa-desktop" style="color: #00f0ff;"></i> VisionOS Web Desktop</div>
            <div class="m-card-repo">Portfolio-v2</div>
            <div class="m-card-stat"><strong>Benchmark:</strong> 60 FPS Three.js Canvas &bull; Multi-Window OS</div>
            <div class="m-card-links">Dependencies: Three.js &bull; Web Audio API &bull; Glassmorphic CSS &bull; ES6+</div>
          </div>

          <div class="matrix-node-card">
            <div class="m-card-title"><i class="fas fa-database" style="color: #f59e0b;"></i> Real-Time Cloud CMS</div>
            <div class="m-card-repo">Portfolio</div>
            <div class="m-card-stat"><strong>Benchmark:</strong> Sub-second Firestore Sync &bull; Admin Portal</div>
            <div class="m-card-links">Dependencies: Firebase Auth &bull; Cloud Firestore &bull; Web3Forms &bull; GSAP</div>
          </div>
        </div>
      </div>
    `;
  }

  /* --------------------------------------------------------------------------
     7. Window Control Events & Deep Linking
     -------------------------------------------------------------------------- */
  bindWindowEvents() {
    // Mode Switchers
    const btn3d = document.getElementById('btn-mode-3d');
    const btnMatrix = document.getElementById('btn-mode-matrix');
    const canvas = document.getElementById('universe3d-canvas');
    const matrixMount = document.getElementById('matrix-canvas-mount');

    if (btn3d && btnMatrix) {
      btn3d.addEventListener('click', () => {
        btn3d.classList.add('active');
        btnMatrix.classList.remove('active');
        canvas.style.display = 'block';
        if (matrixMount) matrixMount.style.display = 'none';
        this.currentViewMode = '3d-universe';
      });

      btnMatrix.addEventListener('click', () => {
        btnMatrix.classList.add('active');
        btn3d.classList.remove('active');
        canvas.style.display = 'none';
        if (matrixMount) matrixMount.style.display = 'block';
        this.currentViewMode = 'dependency-matrix';
        this.renderDependencyMatrix();
      });
    }

    // Reset View Button
    const btnReset = document.getElementById('btn-reset-cam');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.targetRotation = { x: 0.1, y: 0 };
        this.targetZoom = 140;
      });
    }

    // Motion Toggle Button
    const btnMotion = document.getElementById('btn-motion-toggle');
    if (btnMotion) {
      btnMotion.addEventListener('click', () => {
        this.isReducedMotion = !this.isReducedMotion;
        btnMotion.innerHTML = `<i class="fas fa-sync-alt"></i> Auto-Rotate: ${this.isReducedMotion ? 'OFF' : 'ON'}`;
      });
    }

    // Inspector Close Button
    const inspClose = document.getElementById('insp-close-btn');
    const inspector = document.getElementById('universe-inspector');
    if (inspClose && inspector) {
      inspClose.addEventListener('click', () => {
        inspector.style.display = 'none';
        if (this.selectedNode) {
          this.selectedNode.scale.set(1, 1, 1);
          this.selectedNode = null;
        }
      });
    }
  }

  handleDeepLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (urlParams.get('app') === 'universe3d' || hash.includes('universe3d') || hash.includes('3d')) {
      setTimeout(() => {
        windowManager.openWindow('universe3d');

        // Check if specific project requested
        const projId = urlParams.get('project');
        if (projId && this.nodes) {
          const match = this.nodes.find(n => n.userData && n.userData.id === projId);
          if (match) {
            setTimeout(() => this.selectNode(match), 500);
          }
        }
      }, 400);
    }
  }
}

export const universe3DController = new Universe3DController();
