/**
 * Juyel OS — Command Palette & Spotlight Search Engine
 * Quick navigation via Ctrl+K or search trigger: search apps, projects, services, and commands.
 */

import { ownerProfile } from './owner-profile.js';
import { windowManager } from './os-window-manager.js';
import { desktopController } from './os-desktop.js';

export class TerminalController {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.results = [];

    this.commands = [
      // Applications
      { title: 'Open Projects (Main Drive)', category: 'App', action: () => windowManager.openWindow('projects') },
      { title: 'Open Results & Proof Vault', category: 'App', action: () => windowManager.openWindow('results') },
      { title: 'Open Systems (Operating Loop)', category: 'App', action: () => windowManager.openWindow('systems') },
      { title: 'Open Founder.txt Memo', category: 'App', action: () => windowManager.openWindow('founder') },
      { title: 'Open Whiteboard & Sticky Notes', category: 'App', action: () => windowManager.openWindow('whiteboard') },
      { title: 'Open RanaNet Browser', category: 'App', action: () => windowManager.openWindow('browser') },
      { title: 'Open Contact & Project Brief', category: 'App', action: () => windowManager.openWindow('contact') },
      { title: 'Open Resume & Career Journey', category: 'App', action: () => windowManager.openWindow('resume') },
      { title: 'Open Services Catalog', category: 'App', action: () => windowManager.openWindow('services') },

      // Themes
      { title: 'Theme: Switch to Dark Obsidian', category: 'Theme', action: () => desktopController.applyTheme('dark') },
      { title: 'Theme: Switch to Night Indigo', category: 'Theme', action: () => desktopController.applyTheme('night') },
      { title: 'Theme: Switch to Daylight Mode', category: 'Theme', action: () => desktopController.applyTheme('day') },

      // Actions
      { title: 'Download Official Resume (PDF)', category: 'Action', action: () => window.open(ownerProfile.conversion.secondaryUrl, '_blank') },
      { title: 'Chat on WhatsApp', category: 'Action', action: () => window.open(ownerProfile.conversion.whatsappUrl, '_blank') },
      { title: 'Visit GitHub (@Rana0Codes)', category: 'Link', action: () => window.open('https://github.com/Rana0Codes', '_blank') }
    ];

    // Add projects to searchable list
    ownerProfile.projects.forEach((p) => {
      this.commands.push({
        title: `Project: ${p.name} (${p.category})`,
        category: 'Project',
        action: () => {
          windowManager.openWindow('projects');
        }
      });
    });

    this.init();
  }

  init() {
    this.createModalDOM();
    this.setupListeners();
  }

  createModalDOM() {
    const modal = document.createElement('div');
    modal.id = 'command-palette-modal';
    modal.className = 'cmd-palette-backdrop';
    modal.style.display = 'none';

    modal.innerHTML = `
      <div class="cmd-palette-box">
        <div class="cmd-input-wrap">
          <i class="fas fa-search cmd-search-icon"></i>
          <input type="text" id="cmd-search-input" class="cmd-input" placeholder="Type an app, project, or command..." autocomplete="off">
          <span class="cmd-esc-hint">ESC to close</span>
        </div>
        <div class="cmd-results-list" id="cmd-results-list"></div>
        <div class="cmd-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to execute</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  setupListeners() {
    const trigger = document.getElementById('search-trigger');
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('cmd-search-input');

    if (trigger) {
      trigger.addEventListener('click', () => this.open());
    }

    // Shortcut: Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      } else if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
          this.highlightSelected();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
          this.highlightSelected();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });

    // Close on click backdrop
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    // Input filter
    if (input) {
      input.addEventListener('input', (e) => {
        this.filterResults(e.target.value);
      });
    }
  }

  open() {
    this.isOpen = true;
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('cmd-search-input');
    if (modal && input) {
      modal.style.display = 'flex';
      input.value = '';
      this.filterResults('');
      setTimeout(() => input.focus(), 50);
    }
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('command-palette-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  filterResults(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.results = this.commands.slice(0, 8);
    } else {
      this.results = this.commands.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q)
      );
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    const list = document.getElementById('cmd-results-list');
    if (!list) return;

    if (this.results.length === 0) {
      list.innerHTML = `
        <div style="padding: 18px; text-align: center; color: var(--text-dim); font-size: 12px;">
          No matching commands or projects found.
        </div>
      `;
      return;
    }

    list.innerHTML = this.results.map((item, idx) => `
      <div class="cmd-result-item ${idx === this.selectedIndex ? 'selected' : ''}" data-idx="${idx}">
        <span class="cmd-item-title">${item.title}</span>
        <span class="cmd-item-cat">${item.category}</span>
      </div>
    `).join('');

    list.querySelectorAll('.cmd-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        this.selectedIndex = idx;
        this.executeSelected();
      });
    });
  }

  highlightSelected() {
    const items = document.querySelectorAll('.cmd-result-item');
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  executeSelected() {
    const selected = this.results[this.selectedIndex];
    if (selected && selected.action) {
      selected.action();
      this.close();
    }
  }
}

export const terminalController = new TerminalController();
