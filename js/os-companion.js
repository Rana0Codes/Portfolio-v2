/**
 * Juyel OS — Astro-J Holographic Cyber Droid Companion
 * Futuristic floating droid with expressive glowing visor, smooth physics, and activity toast.
 */

import { ownerProfile } from './owner-profile.js';

export class CompanionController {
  constructor() {
    this.currentState = 'idle';
    this.isMuted = true;
    this.audioCtx = null;
    this.toastDismissed = false;

    this.speechPhrases = [
      'Welcome to Juyel.OS!',
      'Check out BachatGuru in Projects!',
      'Need an app or website? Click Contact.',
      'Juyel has recovered 50+ locked accounts.',
      'Type Ctrl+K to open Command Search.'
    ];

    this.init();
  }

  init() {
    this.renderCompanion();
    this.renderBookingToast();
    this.setupInteractions();
    this.scheduleIdleBehaviors();
  }

  renderCompanion() {
    const mount = document.getElementById('companion-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="companion-anchor" id="companion-root">
        <!-- Activity Ping Toast -->
        <div class="booking-ping-toast" id="booking-ping-toast">
          <div class="ping-toast-header">
            <span><i class="fas fa-bolt"></i> Activity Ping</span>
            <button class="ping-close-btn" id="ping-close-btn" title="Dismiss">&times;</button>
          </div>
          <div class="ping-toast-body" id="ping-toast-text">
            Someone just inquired about a project build with ${ownerProfile.identity.fullName}. Fast-tracking delivery.
          </div>
          <div class="ping-toast-meta">
            <span>Verified Inquiry • Anonymized</span>
            <span>Just now</span>
          </div>
        </div>

        <!-- Astro-J Floating Cyber Droid -->
        <div class="j-bot-container state-idle" id="j-bot-body" title="Click or drag Astro-J!">
          <div class="j-bot-speech-bubble" id="j-bot-bubble">
            Hello! I'm Astro-J.
          </div>

          <div class="j-bot-avatar-box">
            <svg class="jbot-svg" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="droid-shell-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#1e293b"/>
                  <stop offset="60%" stop-color="#0f172a"/>
                  <stop offset="100%" stop-color="#020617"/>
                </linearGradient>
                <linearGradient id="droid-visor-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#38bdf8"/>
                  <stop offset="100%" stop-color="#3b82f6"/>
                </linearGradient>
              </defs>

              <!-- Floating Levitation Ring Shadow -->
              <ellipse class="droid-shadow-ring" cx="50" cy="102" rx="24" ry="5" fill="rgba(59, 130, 246, 0.3)"/>

              <g class="jbot-body">
                <!-- Hover Thruster Light -->
                <ellipse cx="50" cy="88" rx="8" ry="3" fill="#38bdf8" filter="drop-shadow(0 0 8px #38bdf8)"/>

                <!-- Sleek Oval Droid Torso -->
                <rect x="22" y="24" width="56" height="62" rx="22" fill="url(#droid-shell-grad)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

                <!-- Antenna Sensor -->
                <line x1="50" y1="24" x2="50" y2="12" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="50" cy="10" r="4.5" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)"/>

                <!-- Curved Holographic Visor Screen -->
                <rect x="28" y="36" width="44" height="28" rx="10" fill="#040711" stroke="#3b82f6" stroke-width="1.5"/>

                <!-- Visor Dynamic Eyes -->
                <g class="jbot-eyes" id="jbot-eyes-g">
                  <ellipse cx="40" cy="50" rx="4.5" ry="5" fill="#38bdf8" filter="drop-shadow(0 0 5px #38bdf8)"/>
                  <ellipse cx="60" cy="50" rx="4.5" ry="5" fill="#38bdf8" filter="drop-shadow(0 0 5px #38bdf8)"/>
                </g>

                <!-- Status Chest Core -->
                <circle cx="50" cy="74" r="3.5" fill="#8b5cf6" filter="drop-shadow(0 0 6px #8b5cf6)"/>
              </g>
            </svg>
          </div>

          <button class="companion-mute-btn" id="companion-audio-toggle" title="Toggle audio chirps">
            <i class="fas fa-volume-mute" id="mute-icon"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderBookingToast() {
    const toast = document.getElementById('booking-ping-toast');
    const closeBtn = document.getElementById('ping-close-btn');

    if (closeBtn && toast) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toast.classList.remove('is-visible');
        this.toastDismissed = true;
      });
    }

    // Show initial notification toast after 4s
    setTimeout(() => {
      if (!this.toastDismissed && toast) {
        toast.classList.add('is-visible');
        setTimeout(() => {
          if (toast) toast.classList.remove('is-visible');
        }, 9000);
      }
    }, 4000);
  }

  setupInteractions() {
    const bot = document.getElementById('j-bot-body');
    const muteToggle = document.getElementById('companion-audio-toggle');
    const muteIcon = document.getElementById('mute-icon');

    if (muteToggle) {
      muteToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
          muteIcon.className = 'fas fa-volume-mute';
        } else {
          muteIcon.className = 'fas fa-volume-up';
          this.playChirp(750, 0.08);
        }
      });
    }

    if (bot) {
      bot.addEventListener('click', () => {
        this.setState('happy');
        const phrase = this.speechPhrases[Math.floor(Math.random() * this.speechPhrases.length)];
        this.showSpeech(phrase);
        this.playChirp(920, 0.1);

        setTimeout(() => {
          this.setState('idle');
        }, 3000);
      });

      this.setupDragging(bot);
    }
  }

  showSpeech(text) {
    const bubble = document.getElementById('j-bot-bubble');
    if (!bubble) return;

    bubble.textContent = text;
    bubble.classList.add('is-visible');

    setTimeout(() => {
      bubble.classList.remove('is-visible');
    }, 3500);
  }

  setState(state) {
    this.currentState = state;
    const bot = document.getElementById('j-bot-body');
    const eyesG = document.getElementById('jbot-eyes-g');
    if (!bot || !eyesG) return;

    bot.classList.remove('state-idle', 'state-happy', 'state-sad', 'state-excited');
    bot.classList.add(`state-${state}`);

    if (state === 'happy') {
      eyesG.innerHTML = `
        <path d="M35 52 Q40 45 45 52" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M55 52 Q60 45 65 52" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round"/>
      `;
    } else if (state === 'sad') {
      eyesG.innerHTML = `
        <path d="M35 48 Q40 54 45 48" stroke="#818cf8" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M55 48 Q60 54 65 48" stroke="#818cf8" stroke-width="3" fill="none" stroke-linecap="round"/>
      `;
    } else if (state === 'excited') {
      eyesG.innerHTML = `
        <polygon points="40,45 44,52 36,52" fill="#38bdf8"/>
        <polygon points="60,45 64,52 56,52" fill="#38bdf8"/>
      `;
    } else {
      // Idle
      eyesG.innerHTML = `
        <ellipse cx="40" cy="50" rx="4.5" ry="5" fill="#38bdf8" filter="drop-shadow(0 0 5px #38bdf8)"/>
        <ellipse cx="60" cy="50" rx="4.5" ry="5" fill="#38bdf8" filter="drop-shadow(0 0 5px #38bdf8)"/>
      `;
    }
  }

  setupDragging(bot) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    const root = document.getElementById('companion-root');
    if (!root) return;

    let initLeft = 30;
    let initBottom = 24;

    const onPointerDown = (e) => {
      if (window.innerWidth <= 768) return;
      if (e.target.closest('.companion-mute-btn')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = root.getBoundingClientRect();
      initLeft = rect.left;
      initBottom = window.innerHeight - rect.bottom;

      bot.setPointerCapture(e.pointerId);
      this.setState('excited');
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = Math.max(10, Math.min(initLeft + dx, window.innerWidth - 180));
      let newBottom = Math.max(10, Math.min(initBottom - dy, window.innerHeight - 140));

      root.style.left = `${newLeft}px`;
      root.style.bottom = `${newBottom}px`;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.setState('idle');
      try {
        bot.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    bot.addEventListener('pointerdown', onPointerDown);
    bot.addEventListener('pointermove', onPointerMove);
    bot.addEventListener('pointerup', onPointerUp);
    bot.addEventListener('pointercancel', onPointerUp);
  }

  playChirp(freq, duration) {
    if (this.isMuted) return;

    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (err) {}
  }

  scheduleIdleBehaviors() {
    setInterval(() => {
      if (this.currentState === 'idle' && Math.random() > 0.65) {
        this.setState('happy');
        setTimeout(() => {
          if (this.currentState === 'happy') this.setState('idle');
        }, 1800);
      }
    }, 14000);
  }
}

export const companionController = new CompanionController();
