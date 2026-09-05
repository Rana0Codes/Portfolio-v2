/**
 * Juyel OS — Ambient Media Player
 * Curated real audio playback engine with HTML5 Audio, Web Audio API Analyser
 * for real-time frequency-synchronized visualizer waves, progress tracking,
 * playlist navigation, volume persistence, and auto-advance.
 */

export class AudioController {
  constructor() {
    this.isPlaying = false;
    this.volume = parseFloat(localStorage.getItem('personal-os-audio-vol-v1') || '0.6');
    this.currentTrackIndex = 0;
    this.isMuted = false;
    this.prevVolume = this.volume > 0 ? this.volume : 0.6;

    // Curated high-vibe tracks bundled locally for zero CORS and 100% offline reliability
    this.tracks = [
      {
        title: 'Midnight Lo-Fi',
        artist: 'Vision Chill & Beats',
        src: './assets/audio/midnight-lofi.mp3'
      },
      {
        title: 'Deep Focus Flow',
        artist: 'Lofi Dreamscape',
        src: './assets/audio/deep-focus.mp3'
      },
      {
        title: 'Chasing That Feeling',
        artist: 'Quincy Larson & Synth Crew',
        src: './assets/audio/chasing-feeling.mp3'
      },
      {
        title: 'Cyber Neon Groove',
        artist: 'Mixkit Electronic Labs',
        src: './assets/audio/cyber-groove.mp3'
      }
    ];

    // Native HTML5 Audio element
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.audio.volume = this.volume;

    // Web Audio API context & nodes for real frequency analysis
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.animFrameId = null;
    this.isAudioCtxInitialized = false;

    this.init();
  }

  init() {
    this.renderPlayerUI();
    this.setupAudioEvents();
    this.setupUIListeners();
    this.loadCurrentTrack(false);
  }

  renderPlayerUI() {
    const dockContainer = document.getElementById('dock-player-mount');
    if (!dockContainer) return;

    const currentTrack = this.tracks[this.currentTrackIndex];

    dockContainer.innerHTML = `
      <div class="dock-media-player" id="dock-media-player">
        <div class="player-visualizer" id="player-visualizer" title="Real-Time Audio Frequency Equalizer">
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
        </div>

        <div class="player-track-meta">
          <div class="player-title" id="player-track-title">${currentTrack.title}</div>
          <div class="player-artist-row">
            <span class="player-artist" id="player-track-artist">${currentTrack.artist}</span>
            <span class="player-time" id="player-time-display">0:00 / 0:00</span>
          </div>
          <div class="player-progress-track" id="player-progress-track" title="Click to seek">
            <div class="player-progress-fill" id="player-progress-fill"></div>
          </div>
        </div>

        <div class="player-controls-row">
          <button class="player-btn" id="player-prev" title="Previous Track"><i class="fas fa-step-backward"></i></button>
          <button class="player-btn play-main" id="player-play-toggle" title="Play Ambient Music"><i class="fas fa-play" id="play-icon"></i></button>
          <button class="player-btn" id="player-next" title="Next Track"><i class="fas fa-step-forward"></i></button>
        </div>

        <div class="player-slider-wrap">
          <button class="player-btn player-vol-btn" id="player-mute-toggle" title="Mute / Unmute">
            <i class="fas fa-volume-up player-vol-icon" id="player-vol-icon"></i>
          </button>
          <input type="range" class="player-volume-slider" id="player-vol-slider" min="0" max="1" step="0.05" value="${this.volume}" title="Volume">
        </div>
      </div>
    `;
  }

  setupAudioEvents() {
    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('ended', () => {
      // Auto-advance to the next track in the playlist
      this.nextTrack(true);
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayStateUI(true);
      this.startVisualizer();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayStateUI(false);
      this.stopVisualizer();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[Juyel.OS Audio] Playback error encountered:', e);
      this.isPlaying = false;
      this.updatePlayStateUI(false);
      this.stopVisualizer();
    });
  }

  setupUIListeners() {
    const playBtn = document.getElementById('player-play-toggle');
    const prevBtn = document.getElementById('player-prev');
    const nextBtn = document.getElementById('player-next');
    const volSlider = document.getElementById('player-vol-slider');
    const muteBtn = document.getElementById('player-mute-toggle');
    const progressTrack = document.getElementById('player-progress-track');
    const visualizer = document.getElementById('player-visualizer');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.togglePlay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prevTrack();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextTrack(false);
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.setVolume(val);
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.toggleMute();
      });
    }

    if (progressTrack) {
      progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (width > 0 && this.audio.duration) {
          const ratio = Math.max(0, Math.min(1, clickX / width));
          this.audio.currentTime = ratio * this.audio.duration;
          this.updateProgress();
        }
      });
    }

    if (visualizer) {
      visualizer.addEventListener('click', () => {
        this.togglePlay();
      });
    }
  }

  loadCurrentTrack(autoPlay = false) {
    const track = this.tracks[this.currentTrackIndex];
    if (!track) return;

    this.audio.src = track.src;
    this.updateTrackMeta();

    if (autoPlay) {
      this.play();
    }
  }

  updateTrackMeta() {
    const track = this.tracks[this.currentTrackIndex];
    if (!track) return;

    const titleEl = document.getElementById('player-track-title');
    const artistEl = document.getElementById('player-track-artist');
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;

    const fillEl = document.getElementById('player-progress-fill');
    if (fillEl) fillEl.style.width = '0%';

    const timeEl = document.getElementById('player-time-display');
    if (timeEl) timeEl.textContent = '0:00 / 0:00';
  }

  async initAudioContext() {
    if (this.isAudioCtxInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        try {
          await this.audioCtx.resume();
        } catch (err) {
          console.warn('[Juyel.OS Audio] Could not resume AudioContext:', err);
        }
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64; // 32 frequency bins
      this.analyser.smoothingTimeConstant = 0.82;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      this.isAudioCtxInitialized = true;
    } catch (err) {
      console.warn('[Juyel.OS Audio] Web Audio API setup notice (falling back to direct audio):', err);
      // Even if AudioContext creation fails, HTML5 Audio element still plays sound
      this.isAudioCtxInitialized = true;
    }
  }

  async togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  async play() {
    await this.initAudioContext();
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('[Juyel.OS Audio] play() request failed or interrupted:', err);
    }
  }

  pause() {
    this.audio.pause();
  }

  prevTrack() {
    const wasPlaying = this.isPlaying;
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadCurrentTrack(wasPlaying);
  }

  nextTrack(autoPlay = false) {
    const wasPlaying = this.isPlaying || autoPlay;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.loadCurrentTrack(wasPlaying);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.audio.volume = this.volume;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    localStorage.setItem('personal-os-audio-vol-v1', this.volume.toString());

    this.isMuted = this.volume === 0;
    this.updateVolumeUI();
  }

  toggleMute() {
    if (this.isMuted || this.volume === 0) {
      this.setVolume(this.prevVolume > 0 ? this.prevVolume : 0.6);
    } else {
      this.prevVolume = this.volume;
      this.setVolume(0);
    }
  }

  updateVolumeUI() {
    const volSlider = document.getElementById('player-vol-slider');
    const volIcon = document.getElementById('player-vol-icon');

    if (volSlider) {
      volSlider.value = this.volume.toString();
    }

    if (volIcon) {
      if (this.volume === 0) {
        volIcon.className = 'fas fa-volume-mute player-vol-icon';
      } else if (this.volume < 0.4) {
        volIcon.className = 'fas fa-volume-down player-vol-icon';
      } else {
        volIcon.className = 'fas fa-volume-up player-vol-icon';
      }
    }
  }

  updateProgress() {
    const current = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;

    const fillEl = document.getElementById('player-progress-fill');
    if (fillEl && duration > 0) {
      const pct = (current / duration) * 100;
      fillEl.style.width = `${pct}%`;
    }

    const timeEl = document.getElementById('player-time-display');
    if (timeEl) {
      timeEl.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updatePlayStateUI(isPlaying) {
    const playIcon = document.getElementById('play-icon');
    if (playIcon) {
      playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    const playBtn = document.getElementById('player-play-toggle');
    if (playBtn) {
      playBtn.title = isPlaying ? 'Pause Ambient Music' : 'Play Ambient Music';
    }
  }

  startVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    const visualizer = document.getElementById('player-visualizer');
    if (visualizer) {
      visualizer.classList.add('is-playing');
    }

    const eqBars = document.querySelectorAll('#player-visualizer .eq-bar');
    if (!eqBars || eqBars.length === 0) return;

    const hasAnalyser = Boolean(this.analyser);
    const dataArray = hasAnalyser ? new Uint8Array(this.analyser.frequencyBinCount) : null;

    if (!hasAnalyser && visualizer) {
      // Fallback to CSS animation if Web Audio analyser is unavailable
      visualizer.classList.add('css-fallback');
      return;
    }

    if (visualizer) {
      visualizer.classList.remove('css-fallback');
    }

    // Frequency ranges mapped to 4 bars: sub-bass, mid-bass, melody/vocal, sparkle/highs
    const ranges = [
      [1, 3],
      [4, 8],
      [9, 16],
      [17, 26]
    ];

    const renderFrame = () => {
      if (!this.isPlaying) {
        eqBars.forEach((bar) => {
          bar.style.height = '3px';
        });
        return;
      }

      if (this.analyser && dataArray) {
        this.analyser.getByteFrequencyData(dataArray);

        eqBars.forEach((bar, idx) => {
          const range = ranges[idx] || [1, 4];
          let sum = 0;
          let count = 0;
          for (let i = range[0]; i <= range[1] && i < dataArray.length; i++) {
            sum += dataArray[i];
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          // Scale 0-255 to dynamic height 3px to 18px
          const heightPx = Math.max(3, Math.min(18, Math.round((avg / 255) * 16 + 2)));
          bar.style.height = `${heightPx}px`;
        });
      }

      this.animFrameId = requestAnimationFrame(renderFrame);
    };

    this.animFrameId = requestAnimationFrame(renderFrame);
  }

  stopVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const visualizer = document.getElementById('player-visualizer');
    if (visualizer) {
      visualizer.classList.remove('is-playing');
      visualizer.classList.remove('css-fallback');
    }

    const eqBars = document.querySelectorAll('#player-visualizer .eq-bar');
    eqBars.forEach((bar) => {
      bar.style.height = '3px';
    });
  }
}

export const audioController = new AudioController();
