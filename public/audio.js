// =============================================================================
// 🎵 Procedural Web Audio API Sound Synthesizer for Basta Mexicano
// Zero external sound files needed. 100% synthesized sound effects.
// =============================================================================

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('basta_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('basta_muted', this.muted);
    return this.muted;
  }

  // Realistic pencil scratching stroke on paper
  playPencilStroke() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + Math.random() * 800, now);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (_) {}
  }

  // Letter wheel tick
  playLetterTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (_) {}
  }

  // Dramatic "¡BASTA!" buzzer & bell alert
  playBastaAlarm() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // School bell / buzzer component
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(523.25, now + 0.15); // C5

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(392, now + 0.15); // G4

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.68);
      osc2.stop(now + 0.68);
    } catch (_) {}
  }

  // Countdown heartbeat or woodblock click
  playClockTick(isUrgent = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isUrgent ? 880 : 540;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(isUrgent ? 0.22 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch (_) {}
  }

  // Voting interaction sound
  playVoteChime(approved = true) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (approved) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.stop(now + 0.36);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.stop(now + 0.24);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
    } catch (_) {}
  }

  // Triumphant Mariachi Victory Fanfare
  playVictoryFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Notes: G4, C5, E5, G5, F5, E5, D5, C5 (Trumpet fanfare)
      const notes = [
        { f: 392.00, t: 0.00, d: 0.12 },
        { f: 523.25, t: 0.12, d: 0.12 },
        { f: 659.25, t: 0.24, d: 0.12 },
        { f: 783.99, t: 0.36, d: 0.28 },
        { f: 698.46, t: 0.64, d: 0.14 },
        { f: 659.25, t: 0.78, d: 0.14 },
        { f: 587.33, t: 0.92, d: 0.18 },
        { f: 523.25, t: 1.10, d: 0.55 },
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now + t);

        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.exponentialRampToValueAtTime(0.005, now + t + d);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d + 0.02);
      });
    } catch (_) {}
  }
}

window.soundFX = new SoundFX();
