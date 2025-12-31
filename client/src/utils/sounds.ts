/**
 * Sound Manager for Bonaken
 * Provides ambient casino sounds and card game audio feedback
 * Uses Web Audio API for low-latency playback
 */

type SoundType =
  | 'cardShuffle'
  | 'cardPlay'
  | 'cardDeal'
  | 'trickWin'
  | 'turnNotify'
  | 'gameStart'
  | 'gameEnd'
  | 'bonaken'
  | 'buttonClick';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  attack?: number;
  decay?: number;
  detune?: number;
}

// Sound configurations using Web Audio synthesis
const soundConfigs: Record<SoundType, SoundConfig | SoundConfig[]> = {
  cardPlay: {
    frequency: 200,
    duration: 0.08,
    type: 'triangle',
    volume: 0.15,
    attack: 0.005,
    decay: 0.07
  },
  cardDeal: [
    { frequency: 180, duration: 0.06, type: 'triangle', volume: 0.1, attack: 0.002 },
    { frequency: 220, duration: 0.04, type: 'triangle', volume: 0.08, attack: 0.002 }
  ],
  cardShuffle: [
    { frequency: 150, duration: 0.03, type: 'triangle', volume: 0.08 },
    { frequency: 180, duration: 0.03, type: 'triangle', volume: 0.08 },
    { frequency: 160, duration: 0.03, type: 'triangle', volume: 0.08 }
  ],
  trickWin: [
    { frequency: 523, duration: 0.15, type: 'sine', volume: 0.12 },
    { frequency: 659, duration: 0.15, type: 'sine', volume: 0.12 },
    { frequency: 784, duration: 0.2, type: 'sine', volume: 0.15 }
  ],
  turnNotify: {
    frequency: 880,
    duration: 0.1,
    type: 'sine',
    volume: 0.08,
    attack: 0.01,
    decay: 0.08
  },
  gameStart: [
    { frequency: 392, duration: 0.15, type: 'sine', volume: 0.1 },
    { frequency: 523, duration: 0.15, type: 'sine', volume: 0.1 },
    { frequency: 659, duration: 0.2, type: 'sine', volume: 0.12 },
    { frequency: 784, duration: 0.3, type: 'sine', volume: 0.15 }
  ],
  gameEnd: [
    { frequency: 784, duration: 0.2, type: 'sine', volume: 0.12 },
    { frequency: 659, duration: 0.2, type: 'sine', volume: 0.12 },
    { frequency: 523, duration: 0.25, type: 'sine', volume: 0.1 },
    { frequency: 392, duration: 0.4, type: 'sine', volume: 0.15 }
  ],
  bonaken: [
    { frequency: 440, duration: 0.1, type: 'square', volume: 0.08, detune: -10 },
    { frequency: 554, duration: 0.1, type: 'square', volume: 0.08 },
    { frequency: 659, duration: 0.15, type: 'square', volume: 0.1 },
    { frequency: 880, duration: 0.25, type: 'sine', volume: 0.15 }
  ],
  buttonClick: {
    frequency: 600,
    duration: 0.04,
    type: 'sine',
    volume: 0.05,
    attack: 0.002,
    decay: 0.035
  }
};

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted: boolean = false;
  private _volume: number = 0.5;
  private initialized: boolean = false;

  constructor() {
    // Load preferences from localStorage
    const savedMuted = localStorage.getItem('bonaken-sound-muted');
    const savedVolume = localStorage.getItem('bonaken-sound-volume');

    if (savedMuted !== null) {
      this._muted = savedMuted === 'true';
    }
    if (savedVolume !== null) {
      this._volume = parseFloat(savedVolume);
    }
  }

  /**
   * Initialize the audio context (must be called from user interaction)
   */
  init(): void {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.updateVolume();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Resume audio context if suspended (required after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a sound effect
   */
  play(soundType: SoundType): void {
    if (this._muted || !this.audioContext || !this.masterGain) return;

    // Ensure context is running
    this.resume();

    const config = soundConfigs[soundType];
    const configs = Array.isArray(config) ? config : [config];

    let delay = 0;
    configs.forEach((cfg, index) => {
      setTimeout(() => {
        this.playTone(cfg);
      }, delay);
      delay += cfg.duration * 1000 * 0.7; // Overlap sounds slightly
    });
  }

  /**
   * Play a synthesized tone
   */
  private playTone(config: SoundConfig): void {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const { frequency, duration, type, volume, attack = 0.01, decay = duration * 0.8, detune = 0 } = config;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;

    // Create gain envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    // Connect
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * this._volume, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

    // Play
    oscillator.start(now);
    oscillator.stop(now + duration);

    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  /**
   * Update master volume
   */
  private updateVolume(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
    }
  }

  /**
   * Get current volume (0-1)
   */
  get volume(): number {
    return this._volume;
  }

  /**
   * Set volume (0-1)
   */
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('bonaken-sound-volume', String(this._volume));
    this.updateVolume();
  }

  /**
   * Get muted state
   */
  get muted(): boolean {
    return this._muted;
  }

  /**
   * Set muted state
   */
  set muted(value: boolean) {
    this._muted = value;
    localStorage.setItem('bonaken-sound-muted', String(this._muted));
    this.updateVolume();
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.muted = !this._muted;
    return this._muted;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playSound = (type: SoundType) => soundManager.play(type);
export const initSound = () => soundManager.init();
export const resumeSound = () => soundManager.resume();
