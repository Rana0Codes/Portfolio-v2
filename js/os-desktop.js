/**
 * Juyel OS — Desktop Environment & System Controller
 * Handles system bar, live clock, theme toggles, boot screen, and desktop affordances.
 */

import { ownerProfile } from './owner-profile.js';
import { windowManager } from './os-window-manager.js';

export class DesktopController {
  constructor() {
    this.currentTheme = localStorage.getItem('personal-os-theme-v1') || 'dark';
    this.descriptorIndex = 0;
    this.descriptorInterval = null;

    this.quotes = [
      '“Simplicity is prerequisite for reliability.” — Edsger Dijkstra',
      '“First, solve the problem. Then, write the code.” — John Johnson',
      '“The best way to predict the future is to invent it.” — Alan Kay',
      '“Make it work, make it right, make it fast.” — Kent Beck',
      '“AI does not replace engineers; engineers with AI replace those without.”'
    ];

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.initClock();
    this.initDescriptor();
    this.initDailyTransmission();
    this.initThemeSwitchers();
    this.initBootScreen();
    this.initDesktopIcons();
    this.initFoldedCorner();
    this.initParticleBackground();
    this.initSystemMonitorSimulation();
  }

  /* --------------------------------------------------------------------------
     Clock & Date Engine (IST Time)
     -------------------------------------------------------------------------- */
  initClock() {
    const clockEl = document.getElementById('system-clock');
    if (!clockEl) return;

    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      };
      const formatter = new Intl.DateTimeFormat('en-IN', options);
      clockEl.textContent = `${formatter.format(now)} IST`;
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  /* --------------------------------------------------------------------------
     Dynamic Role Descriptor Animation
     -------------------------------------------------------------------------- */
  initDescriptor() {
    const descEl = document.getElementById('dynamic-descriptor');
    if (!descEl) return;

    const roles = ownerProfile.identity.roles;
    if (!roles || roles.length === 0) return;

    const updateRole = () => {
      descEl.style.opacity = '0';
      descEl.style.transform = 'translateY(4px)';

      setTimeout(() => {
        this.descriptorIndex = (this.descriptorIndex + 1) % roles.length;
        descEl.textContent = `> ${roles[this.descriptorIndex]}`;
        descEl.style.opacity = '1';
        descEl.style.transform = 'translateY(0)';
      }, 250);
    };

    descEl.textContent = `> ${roles[0]}`;
    descEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    this.descriptorInterval = setInterval(updateRole, 3200);
  }

  /* --------------------------------------------------------------------------
     Theme Switcher (Dark Obsidian, Night Indigo, Daylight Pearl)
     -------------------------------------------------------------------------- */
  initThemeSwitchers() {
    const buttons = document.querySelectorAll('.theme-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme-val');
        if (theme) {
          this.applyTheme(theme);
        }
      });
    });
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('personal-os-theme-v1', theme);

    // Update active button state
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      if (btn.getAttribute('data-theme-val') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /* --------------------------------------------------------------------------
     Daily Transmission & System Monitor
     -------------------------------------------------------------------------- */
  initDailyTransmission() {
    const quoteEl = document.getElementById('daily-quote-text');
    const stickyBtn = document.getElementById('quick-sticky-trigger');

    if (quoteEl) {
      const dayIndex = new Date().getDate() % this.quotes.length;
      quoteEl.textContent = this.quotes[dayIndex];
    }

    if (stickyBtn) {
      stickyBtn.addEventListener('click', () => {
        windowManager.openWindow('whiteboard');
      });
    }
  }

  initSystemMonitorSimulation() {
    const cpuFill = document.getElementById('cpu-bar-fill');
    const ramFill = document.getElementById('ram-bar-fill');
    const cpuVal = document.getElementById('cpu-val-text');
    const ramVal = document.getElementById('ram-val-text');

    if (!cpuFill || !ramFill) return;

    setInterval(() => {
      const cpu = Math.floor(Math.random() * 18 + 8);
      const ram = Math.floor(Math.random() * 6 + 32);

      cpuFill.style.width = `${cpu}%`;
      ramFill.style.width = `${ram}%`;
      if (cpuVal) cpuVal.textContent = `${cpu}%`;
      if (ramVal) ramVal.textContent = `${ram}%`;
    }, 2800);
  }

  /* --------------------------------------------------------------------------
     Boot Screen Sequence
     -------------------------------------------------------------------------- */
  initBootScreen() {
    const bootScreen = document.getElementById('boot-screen');
    const skipBtn = document.getElementById('skip-boot');
    const progressBar = document.getElementById('boot-progress');
    const logEl = document.getElementById('boot-log');

    if (!bootScreen) return;

    let progress = 0;
    const logs = [
      'Initializing Juyel.OS Kernel v1.3...',
      'Mounting /dev/projects [BachatGuru, Flutter, Utilities]...',
      'Loading Verified Case Metrics [50+ Rescues, 100+ Devices]...',
      'Starting Astro-J AI Companion Subsystem...',
      'System Ready.'
    ];

    const finishBoot = () => {
      bootScreen.classList.add('fade-out');
      setTimeout(() => {
        bootScreen.style.display = 'none';
      }, 450);
    };

    if (skipBtn) {
      skipBtn.addEventListener('click', finishBoot);
    }

    const interval = setInterval(() => {
      progress += 25;
      if (progressBar) progressBar.style.width = `${progress}%`;
      const logIdx = Math.min(Math.floor(progress / 25), logs.length - 1);
      if (logEl) logEl.textContent = logs[logIdx];

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(finishBoot, 300);
      }
    }, 140);
  }

  /* --------------------------------------------------------------------------
     Desktop Icons & Drag Support
     -------------------------------------------------------------------------- */
  initDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon-item');
    icons.forEach((icon) => {
      icon.addEventListener('click', () => {
        const appId = icon.getAttribute('data-app');
        if (appId) {
          windowManager.openWindow(appId);
        }
      });
    });

    // Nav pill buttons
    const navButtons = document.querySelectorAll('.nav-pill-btn[data-open-win]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const winId = btn.getAttribute('data-open-win');
        if (winId) {
          windowManager.openWindow(winId);
        }
      });
    });

    // Dock items
    const dockButtons = document.querySelectorAll('.dock-item-btn[data-app]');
    dockButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app');
        if (!appId) return;

        const winData = windowManager.windows.get(appId);
        if (winData && winData.isOpen) {
          if (winData.isMinimized) {
            windowManager.openWindow(appId);
          } else if (windowManager.activeWindowId === appId) {
            windowManager.minimizeWindow(appId);
          } else {
            windowManager.focusWindow(appId);
          }
        } else {
          windowManager.openWindow(appId);
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     Folded-Corner Prompt
     -------------------------------------------------------------------------- */
  initFoldedCorner() {
    const foldedCorner = document.getElementById('folded-corner-call');
    if (foldedCorner) {
      foldedCorner.addEventListener('click', () => {
        windowManager.openWindow('contact');
      });
    }
  }

  /* --------------------------------------------------------------------------
     Subtle Ambient Particle Canvas
     -------------------------------------------------------------------------- */
  initParticleBackground() {
    const canvas = document.getElementById('ambient-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(40, Math.floor(width / 35));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.35 + 0.1
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const color = this.currentTheme === 'day' ? '37, 99, 235' : '59, 130, 246';

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(render);
    };

    render();
  }
}

export const desktopController = new DesktopController();
