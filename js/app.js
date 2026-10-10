/**
 * Juyel OS — Main Application Bootstrapper
 * Coordinates window registrations, desktop controllers, and initial system state.
 */

import { ownerProfile } from './owner-profile.js';
import { windowManager } from './os-window-manager.js';
import { desktopController } from './os-desktop.js';
import { appManager } from './os-apps.js';
import { whiteboardController } from './os-whiteboard.js';
import { companionController } from './os-companion.js';
import { terminalController } from './os-terminal.js';
import { audioController } from './os-audio.js';
import { universe3DController } from './os-universe3d.js';

document.addEventListener('DOMContentLoaded', () => {
  // Register all OS windows with their default dimensions & positions
  windowManager.registerWindow('projects', {
    title: 'Projects — Main Drive',
    defaultWidth: 780,
    defaultHeight: 560,
    defaultX: 80,
    defaultY: 50
  });

  windowManager.registerWindow('results', {
    title: 'Results & Proof Vault',
    defaultWidth: 720,
    defaultHeight: 540,
    defaultX: 110,
    defaultY: 70
  });

  windowManager.registerWindow('systems', {
    title: 'Systems — Operating Loop',
    defaultWidth: 680,
    defaultHeight: 520,
    defaultX: 140,
    defaultY: 80
  });

  windowManager.registerWindow('founder', {
    title: 'Founder_Memo.txt',
    defaultWidth: 620,
    defaultHeight: 480,
    defaultX: 160,
    defaultY: 90
  });

  windowManager.registerWindow('whiteboard', {
    title: 'Whiteboard & Sticky Notes',
    defaultWidth: 740,
    defaultHeight: 540,
    defaultX: 120,
    defaultY: 70
  });

  windowManager.registerWindow('browser', {
    title: 'RanaNet — Internal Browser',
    defaultWidth: 760,
    defaultHeight: 540,
    defaultX: 100,
    defaultY: 60
  });

  windowManager.registerWindow('contact', {
    title: 'Contact & Commercial Brief',
    defaultWidth: 740,
    defaultHeight: 560,
    defaultX: 130,
    defaultY: 65
  });

  windowManager.registerWindow('resume', {
    title: 'Curriculum Vitae & Journey',
    defaultWidth: 720,
    defaultHeight: 550,
    defaultX: 90,
    defaultY: 55
  });

  windowManager.registerWindow('services', {
    title: 'Services & Capabilities',
    defaultWidth: 740,
    defaultHeight: 540,
    defaultX: 105,
    defaultY: 65
  });

  windowManager.registerWindow('terminal', {
    title: 'Terminal — juyel@os:~$',
    defaultWidth: 680,
    defaultHeight: 480,
    defaultX: 150,
    defaultY: 85
  });

  // Wire up hero action buttons
  const heroExploreBtn = document.getElementById('hero-explore-projects');
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener('click', () => {
      windowManager.openWindow('projects');
    });
  }

  const heroHireBtn = document.getElementById('hero-hire-contact');
  if (heroHireBtn) {
    heroHireBtn.addEventListener('click', () => {
      windowManager.openWindow('contact');
    });
  }

  console.log('✓ Juyel.OS v1.3 loaded successfully.');
});
