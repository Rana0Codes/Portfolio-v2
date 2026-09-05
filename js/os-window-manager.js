/**
 * Juyel OS — Window Manager (Titanium VisionOS)
 * Robust multi-window lifecycle: open, close, minimize, maximize, z-index elevation, and dragging.
 */

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.activeWindowId = null;
    this.baseZIndex = 1000;
    this.currentZIndex = 1000;
    this.windowLayer = null;

    this.init();
  }

  init() {
    this.windowLayer = document.getElementById('window-layer');
    if (!this.windowLayer) return;

    // Keyboard listener: Escape key closes active window
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeWindowId) {
        this.closeWindow(this.activeWindowId);
      }
    });

    // Resize handling to keep windows within viewport
    window.addEventListener('resize', () => {
      this.clampAllWindows();
    });
  }

  registerWindow(id, config) {
    const windowEl = document.getElementById(`win-${id}`);
    if (!windowEl) return;

    const titleBar = windowEl.querySelector('.window-titlebar');
    const closeBtn = windowEl.querySelector('.traffic-btn.close');
    const minBtn = windowEl.querySelector('.traffic-btn.minimize');
    const maxBtn = windowEl.querySelector('.traffic-btn.maximize');

    const winData = {
      id,
      element: windowEl,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: config.defaultX || Math.min(80 + (this.windows.size * 30), window.innerWidth - 450),
      y: config.defaultY || Math.min(50 + (this.windows.size * 25), window.innerHeight - 350),
      width: config.defaultWidth || 760,
      height: config.defaultHeight || 540,
      title: config.title || id
    };

    // Ensure hidden initially
    windowEl.style.display = 'none';
    windowEl.style.width = `${winData.width}px`;
    windowEl.style.height = `${winData.height}px`;
    windowEl.style.left = `${winData.x}px`;
    windowEl.style.top = `${winData.y}px`;

    // Titlebar dragging
    if (titleBar) {
      this.setupDragging(winData, titleBar);
    }

    // Control buttons
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeWindow(id);
      });
    }

    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimizeWindow(id);
      });
    }

    if (maxBtn) {
      maxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMaximize(id);
      });
    }

    // Bring to front on pointerdown
    windowEl.addEventListener('pointerdown', () => {
      this.focusWindow(id);
    });

    this.windows.set(id, winData);
  }

  openWindow(id) {
    // Alias routing: support 'journey' pointing to 'resume'
    if (id === 'journey') id = 'resume';

    const win = this.windows.get(id);
    if (!win) return;

    win.isOpen = true;
    win.isMinimized = false;
    win.element.style.display = 'flex';

    // Micro-delay to trigger CSS transition
    requestAnimationFrame(() => {
      win.element.classList.add('is-open');
      win.element.classList.remove('is-minimized');
    });

    this.focusWindow(id);
    this.updateDockState(id, true);

    // If on mobile, clamp automatically
    if (window.innerWidth <= 768) {
      win.element.style.left = '6px';
      win.element.style.top = '6px';
    }
  }

  closeWindow(id) {
    if (id === 'journey') id = 'resume';

    const win = this.windows.get(id);
    if (!win) return;

    win.isOpen = false;
    win.element.classList.remove('is-open');
    win.element.classList.remove('is-active');

    // Hide display after transition completes
    setTimeout(() => {
      if (!win.isOpen) {
        win.element.style.display = 'none';
      }
    }, 200);

    this.updateDockState(id, false);

    if (this.activeWindowId === id) {
      this.activeWindowId = null;
      let highestZ = -1;
      let nextWinId = null;
      this.windows.forEach((w, wId) => {
        if (w.isOpen && !w.isMinimized) {
          const z = parseInt(w.element.style.zIndex, 10) || 0;
          if (z > highestZ) {
            highestZ = z;
            nextWinId = wId;
          }
        }
      });
      if (nextWinId) {
        this.focusWindow(nextWinId);
      }
    }
  }

  focusWindow(id) {
    if (id === 'journey') id = 'resume';

    const win = this.windows.get(id);
    if (!win) return;

    this.currentZIndex += 1;
    win.element.style.zIndex = this.currentZIndex;

    this.windows.forEach((w) => {
      w.element.classList.remove('is-active');
    });

    win.element.classList.add('is-active');
    this.activeWindowId = id;
  }

  minimizeWindow(id) {
    if (id === 'journey') id = 'resume';

    const win = this.windows.get(id);
    if (!win) return;

    win.isMinimized = true;
    win.element.classList.add('is-minimized');
    win.element.style.display = 'none';
    this.updateDockState(id, false);

    if (this.activeWindowId === id) {
      this.activeWindowId = null;
    }
  }

  toggleMaximize(id) {
    if (id === 'journey') id = 'resume';

    const win = this.windows.get(id);
    if (!win) return;

    win.isMaximized = !win.isMaximized;
    if (win.isMaximized) {
      win.element.classList.add('is-maximized');
    } else {
      win.element.classList.remove('is-maximized');
      win.element.style.left = `${win.x}px`;
      win.element.style.top = `${win.y}px`;
      win.element.style.width = `${win.width}px`;
      win.element.style.height = `${win.height}px`;
    }
    this.focusWindow(id);
  }

  setupDragging(win, titleBar) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const onPointerDown = (e) => {
      if (window.innerWidth <= 768 || win.isMaximized) return;
      if (e.target.closest('.window-controls-traffic')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = parseInt(win.element.style.left, 10) || win.x;
      initialTop = parseInt(win.element.style.top, 10) || win.y;

      titleBar.setPointerCapture(e.pointerId);
      this.focusWindow(win.id);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newX = initialLeft + deltaX;
      let newY = initialTop + deltaY;

      const maxRight = window.innerWidth - 80;
      const maxBottom = window.innerHeight - 80;

      newX = Math.max(-win.width + 120, Math.min(newX, maxRight));
      newY = Math.max(10, Math.min(newY, maxBottom));

      win.x = newX;
      win.y = newY;
      win.element.style.left = `${newX}px`;
      win.element.style.top = `${newY}px`;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        titleBar.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    titleBar.addEventListener('pointerdown', onPointerDown);
    titleBar.addEventListener('pointermove', onPointerMove);
    titleBar.addEventListener('pointerup', onPointerUp);
    titleBar.addEventListener('pointercancel', onPointerUp);
  }

  clampAllWindows() {
    if (window.innerWidth <= 768) return;
    this.windows.forEach((win) => {
      if (win.isOpen && !win.isMaximized) {
        const maxX = window.innerWidth - 120;
        const maxY = window.innerHeight - 100;
        let curX = parseInt(win.element.style.left, 10) || win.x;
        let curY = parseInt(win.element.style.top, 10) || win.y;

        curX = Math.max(10, Math.min(curX, maxX));
        curY = Math.max(10, Math.min(curY, maxY));

        win.element.style.left = `${curX}px`;
        win.element.style.top = `${curY}px`;
      }
    });
  }

  updateDockState(id, isOpen) {
    const dockBtn = document.querySelector(`.dock-item-btn[data-app="${id}"]`);
    if (dockBtn) {
      if (isOpen) {
        dockBtn.classList.add('is-open');
      } else {
        dockBtn.classList.remove('is-open');
      }
    }
  }
}

export const windowManager = new WindowManager();
