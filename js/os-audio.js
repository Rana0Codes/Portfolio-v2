/**
 * Juyel OS — Ambient Media Player
 * Ambient synth harmonic audio engine with polyphonic pads, sub-bass,
 * visualizer animation, play/pause, volume, and multi-track switching.
 */

export class AudioController {
  constructor() {
    this.isPlaying = false;
    this.volume = parseFloat(localStorage.getItem('personal-os-audio-vol-v1') || '0.6');
    this.currentTrackIndex = 0;
    this.audioCtx = null;
    this.gainNode = null;
    this.timerId = null;

    this.tracks = [
      {
        title: 'Cyber Dreams',
        artist: 'Lofi Ambient Flow',
        chords: [
          [261.63, 329.63, 392.00, 493.88], // Cmaj9
          [220.00, 261.63, 329.63, 392.00], // Am9
          [174.61, 220.00, 261.63, 329.63], // Fmaj7
          [196.00, 246.94, 293.66, 329.63]  // G6
        ],
        bass: [65.41, 55.00, 43.65, 49.00]
      },
      {
        title: 'Midnight Terminal',
        artist: 'Deep Focus Synth',
        chords: [
          [293.66, 349.23, 440.00, 523.25], // Dm7
          [233.08, 293.66, 349.23, 440.00], // Bbmaj7
          [196.00, 233.08, 293.66, 349.23], // Gm7
          [220.00, 293.66, 329.63, 440.00]  // Asus4
        ],
        bass: [73.42, 58.27, 49.00, 55.00]
      },
      {
        title: 'Cosmic Flow',
        artist: 'Analog Space Wave',
        chords: [
          [164.81, 196.00, 246.94, 293.66], // Em9
          [130.81, 164.81, 196.00, 246.94], // Cmaj7
          [196.00, 246.94, 293.66, 369.99], // Gmaj7
          [146.83, 220.00, 293.66, 369.99]  // D6
        ],
        bass: [41.20, 32.70, 49.00, 36.71]
      }
    ];

    this.init();
  }

  init() {
    this.renderPlayerUI();
    this.setupListeners();
  }

  renderPlayerUI() {
    const dockContainer = document.getElementById('dock-player-mount');
    if (!dockContainer) return;

    dockContainer.innerHTML = `
      <div class="dock-media-player" id="dock-media-player">
        <div class="player-visualizer" id="player-visualizer" title="Ambient Sound Equalizer">
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
        </div>

        <div class="player-track-meta">
          <div class="player-title" id="player-track-title">${this.tracks[this.currentTrackIndex].title}</div>
          <div class="player-artist" id="player-track-artist">${this.tracks[this.currentTrackIndex].artist}</div>
        </div>

        <div class="player-controls-row">
          <button class="player-btn" id="player-prev" title="Previous Track"><i class="fas fa-step-backward"></i></button>
          <button class="player-btn play-main" id="player-play-toggle" title="Play Ambient Music"><i class="fas fa-play" id="play-icon"></i></button>
          <button class="player-btn" id="player-next" title="Next Track"><i class="fas fa-step-forward"></i></button>
        </div>

        <div class="player-slider-wrap">
          <i class="fas fa-volume-up player-vol-icon"></i>
          <input type="range" class="player-volume-slider" id="player-vol-slider" min="0" max="1" step="0.05" value="${this.volume}" title="Volume">
        </div>
      </div>
    `;
  }

  setupListeners() {
    const playBtn = document.getElementById('player-play-toggle');
    const prevBtn = document.getElementById('player-prev');
    const nextBtn = document.getElementById('player-next');
    const volSlider = document.getElementById('player-vol-slider');

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
        this.nextTrack();
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.volume = parseFloat(e.target.value);
        localStorage.setItem('personal-os-audio-vol-v1', this.volume.toString());
        if (this.gainNode && this.audioCtx) {
          this.gainNode.gain.setValueAtTime(this.volume * 0.45, this.audioCtx.currentTime);
        }
      });
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
    this.isPlaying = true;
    const playIcon = document.getElementById('play-icon');
    if (playIcon) playIcon.className = 'fas fa-pause';

    const visualizer = document.getElementById('player-visualizer');
    if (visualizer) visualizer.classList.add('is-playing');

    this.startSynthHarmonics();
  }

  pause() {
    this.isPlaying = false;
    const playIcon = document.getElementById('play-icon');
    if (playIcon) playIcon.className = 'fas fa-play';

    const visualizer = document.getElementById('player-visualizer');
    if (visualizer) visualizer.classList.remove('is-playing');

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.updateTrackMeta();
    if (this.isPlaying) {
      this.startSynthHarmonics();
    }
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.updateTrackMeta();
    if (this.isPlaying) {
      this.startSynthHarmonics();
    }
  }

  updateTrackMeta() {
    const track = this.tracks[this.currentTrackIndex];
    const titleEl = document.getElementById('player-track-title');
    const artistEl = document.getElementById('player-track-artist');
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
  }

  async initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume * 0.45, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.warn('[Juyel.OS Audio] Error resuming AudioContext:', err);
      }
    }
  }

  startSynthHarmonics() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    const track = this.tracks[this.currentTrackIndex];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const freqs = track.chords[chordIdx];
      const bassFreq = track.bass ? track.bass[chordIdx] : null;
      chordIdx = (chordIdx + 1) % track.chords.length;

      const now = this.audioCtx.currentTime;

      // Synthesize polyphonic pad notes
      freqs.forEach((f, idx) => {
        try {
          const osc = this.audioCtx.createOscillator();
          const noteGain = this.audioCtx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(f, now);

          // Proper exponential envelope starting above 0
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.12, now + 0.5);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

          osc.connect(noteGain);
          noteGain.connect(this.gainNode);

          osc.start(now);
          osc.stop(now + 4.0);
        } catch (err) {
          console.warn('[Juyel.OS Audio] Pad synthesis error:', err);
        }
      });

      // Synthesize deep anchor bass
      if (bassFreq) {
        try {
          const bassOsc = this.audioCtx.createOscillator();
          const bassGain = this.audioCtx.createGain();

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.0001, now);
          bassGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

          bassOsc.connect(bassGain);
          bassGain.connect(this.gainNode);

          bassOsc.start(now);
          bassOsc.stop(now + 4.0);
        } catch (err) {
          console.warn('[Juyel.OS Audio] Bass synthesis error:', err);
        }
      }
    };

    playChord();
    this.timerId = setInterval(playChord, 3800);
  }
}

export const audioController = new AudioController();
