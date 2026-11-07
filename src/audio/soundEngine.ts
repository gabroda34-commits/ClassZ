import { progressionManager } from '../game/progression';
import { WeaponId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private bgmInterval: number | null = null;
  private bgmMode: 'menu' | 'combat' | 'boss' | 'off' = 'off';
  private bgmStep: number = 0;

  constructor() {
    // AudioContext will be lazily initialized on first user interaction
  }

  private ensureContext(): AudioContext | null {
    if (progressionManager.settings.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.noiseBuffer) {
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.ctx;
  }

  private get sfxScale(): number {
    if (progressionManager.settings.muted) return 0;
    return Math.max(0, Math.min(1, progressionManager.settings.sfxVolume / 100));
  }

  private get musicScale(): number {
    if (progressionManager.settings.muted || progressionManager.settings.bgmStyle === 'off') return 0;
    return Math.max(0, Math.min(1, progressionManager.settings.musicVolume / 100));
  }

  public setMuted(muted: boolean) {
    progressionManager.updateSettings({ muted });
    if (muted) {
      this.stopMusic();
    }
  }

  public isMuted(): boolean {
    return progressionManager.settings.muted;
  }

  // ==========================================================================
  // PROCEDURAL BACKGROUND MUSIC SEQUENCER (Menu, Combat & Elemental Boss BGM)
  // ==========================================================================
  public setMusicState(mode: 'menu' | 'combat' | 'boss' | 'off') {
    if (this.bgmMode === mode && this.bgmInterval !== null) return;
    this.bgmMode = mode;
    if (this.bgmInterval !== null) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (mode === 'off') return;

    const tempoMs = mode === 'boss' ? 145 : mode === 'combat' ? 175 : 240;
    this.bgmStep = 0;
    this.bgmInterval = window.setInterval(() => {
      this.tickMusicSequencer();
    }, tempoMs);
  }

  public stopMusic() {
    this.setMusicState('off');
  }

  private tickMusicSequencer() {
    const vol = this.musicScale;
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const step = this.bgmStep % 16;
    this.bgmStep++;

    const isSynthwave = progressionManager.settings.bgmStyle === 'synthwave';

    if (this.bgmMode === 'menu') {
      // Atmospheric dark tactical pulse
      const bassNotes = [55, 55, 65.41, 49]; // A1, A1, C2, G1
      if (step % 4 === 0) {
        const freq = bassNotes[Math.floor(step / 4) % bassNotes.length];
        this.playRawTone(ctx, now, freq, freq, 0.42, isSynthwave ? 'sawtooth' : 'triangle', 0.08 * vol);
      }
      if (step % 2 === 0) {
        const arp = [220, 261.63, 329.63, 293.66, 220, 329.63, 392, 329.63];
        const f = arp[(step / 2) % arp.length];
        this.playRawTone(ctx, now, f, f * 1.005, 0.16, 'sine', 0.035 * vol);
      }
    } else if (this.bgmMode === 'combat') {
      // Driving 16-step tactical bass + hi-hat + kick
      const bassPattern = [
        65.41, 65.41, 0, 65.41,
        77.78, 0, 73.42, 0,
        58.27, 58.27, 0, 58.27,
        65.41, 0, 87.31, 77.78
      ];
      const freq = bassPattern[step];
      if (freq > 0) {
        this.playRawTone(ctx, now, freq, freq * 0.98, 0.14, isSynthwave ? 'sawtooth' : 'square', 0.075 * vol);
      }
      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        this.playRawTone(ctx, now, 115, 32, 0.11, 'sine', 0.12 * vol);
      }
      // Hi-hat on off-beats
      if (step % 2 === 1 && this.noiseBuffer) {
        this.playRawNoise(ctx, now, 0.035, 5200, 'highpass', 0.035 * vol);
      }
      // Lead motif on steps 0, 3, 6, 10, 12
      if (isSynthwave && [0, 3, 6, 10, 12].includes(step)) {
        const lead = [261.63, 311.13, 349.23, 392.0, 311.13];
        const lf = lead[[0, 3, 6, 10, 12].indexOf(step)];
        this.playRawTone(ctx, now, lf, lf, 0.13, 'triangle', 0.045 * vol);
      }
    } else if (this.bgmMode === 'boss') {
      // High-intensity Elemental Boss Raid theme
      const bossBass = [
        55, 55, 110, 55,
        61.74, 55, 98, 55,
        51.91, 51.91, 103.83, 51.91,
        65.41, 61.74, 58.27, 55
      ];
      const freq = bossBass[step];
      this.playRawTone(ctx, now, freq, freq * 0.96, 0.12, 'sawtooth', 0.095 * vol);

      if (step % 2 === 0) {
        this.playRawTone(ctx, now, 130, 34, 0.1, 'sine', 0.13 * vol);
      }
      if (step % 4 === 2 && this.noiseBuffer) {
        this.playRawNoise(ctx, now, 0.08, 1800, 'bandpass', 0.07 * vol);
      }
      if ([0, 2, 4, 7, 8, 11, 14].includes(step)) {
        const stabs = [440, 466.16, 523.25, 440, 392, 466.16, 587.33];
        const sf = stabs[step % stabs.length];
        this.playRawTone(ctx, now, sf, sf * 0.99, 0.09, 'square', 0.045 * vol);
      }
    }
  }

  // ==========================================================================
  // WEAPON & COMBAT SFX
  // ==========================================================================
  public playWeaponFire(weaponId: WeaponId) {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;

    switch (weaponId) {
      case 'pistol':
      case 'dual_pistols': {
        this.playRawNoise(ctx, now, 0.06, 1400, 'bandpass', 0.15 * sfx);
        this.playRawTone(ctx, now, 320, 90, 0.06, 'triangle', 0.17 * sfx);
        break;
      }
      case 'revolver': {
        this.playRawNoise(ctx, now, 0.11, 950, 'lowpass', 0.24 * sfx);
        this.playRawTone(ctx, now, 260, 65, 0.1, 'sawtooth', 0.24 * sfx);
        break;
      }
      case 'uzi':
      case 'vector_smg': {
        this.playRawNoise(ctx, now, 0.042, 2100, 'bandpass', 0.12 * sfx);
        this.playRawTone(ctx, now, 420, 140, 0.04, 'sawtooth', 0.13 * sfx);
        break;
      }
      case 'plasma_carbine': {
        this.playRawTone(ctx, now, 980, 260, 0.07, 'sawtooth', 0.15 * sfx);
        this.playRawTone(ctx, now, 540, 1120, 0.05, 'sine', 0.1 * sfx);
        break;
      }
      case 'shotgun':
      case 'auto_shotgun': {
        this.playRawNoise(ctx, now, 0.17, 750, 'lowpass', 0.28 * sfx);
        this.playRawTone(ctx, now, 180, 42, 0.14, 'sawtooth', 0.25 * sfx);
        break;
      }
      case 'cryo_shotgun': {
        this.playRawNoise(ctx, now, 0.14, 2400, 'bandpass', 0.2 * sfx);
        this.playRawTone(ctx, now, 880, 220, 0.13, 'triangle', 0.2 * sfx);
        break;
      }
      case 'battle_rifle': {
        this.playRawNoise(ctx, now, 0.09, 1200, 'bandpass', 0.2 * sfx);
        this.playRawTone(ctx, now, 290, 75, 0.09, 'sawtooth', 0.2 * sfx);
        break;
      }
      case 'sniper_rifle': {
        this.playRawNoise(ctx, now, 0.22, 650, 'lowpass', 0.32 * sfx);
        this.playRawTone(ctx, now, 220, 38, 0.19, 'sawtooth', 0.28 * sfx);
        break;
      }
      case 'railgun': {
        this.playRawTone(ctx, now, 1650, 220, 0.24, 'sawtooth', 0.22 * sfx);
        this.playRawTone(ctx, now, 880, 1960, 0.16, 'sine', 0.15 * sfx);
        this.playRawNoise(ctx, now, 0.13, 3200, 'highpass', 0.12 * sfx);
        break;
      }
      case 'rocket':
      case 'cluster_mortar': {
        this.playRawNoise(ctx, now, 0.22, 600, 'bandpass', 0.22 * sfx);
        this.playRawTone(ctx, now, 150, 290, 0.2, 'sawtooth', 0.16 * sfx);
        break;
      }
      case 'grenade': {
        this.playRawTone(ctx, now, 280, 520, 0.08, 'sine', 0.12 * sfx);
        break;
      }
      case 'flamethrower': {
        this.playRawNoise(ctx, now, 0.08, 520, 'lowpass', 0.11 * sfx);
        break;
      }
      case 'tesla_rifle': {
        this.playRawTone(ctx, now, 1320, 360, 0.11, 'square', 0.15 * sfx);
        this.playRawNoise(ctx, now, 0.08, 2800, 'bandpass', 0.12 * sfx);
        break;
      }
      case 'barricade_kit':
      case 'sentry_turret': {
        this.playRawTone(ctx, now, 240, 480, 0.09, 'square', 0.15 * sfx);
        this.playRawNoise(ctx, now, 0.05, 900, 'lowpass', 0.12 * sfx);
        break;
      }
    }
  }

  public playReloadStart() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playRawTone(ctx, now, 340, 210, 0.06, 'square', 0.12 * sfx);
    this.playRawTone(ctx, now + 0.07, 220, 160, 0.05, 'triangle', 0.1 * sfx);
  }

  public playReloadComplete() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playRawTone(ctx, now, 420, 680, 0.055, 'triangle', 0.14 * sfx);
    this.playRawTone(ctx, now + 0.05, 680, 920, 0.07, 'sine', 0.14 * sfx);
  }

  public playClassSkill() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playRawTone(ctx, now, 330, 880, 0.22, 'sawtooth', 0.18 * sfx);
    this.playRawTone(ctx, now + 0.06, 550, 1100, 0.2, 'sine', 0.16 * sfx);
  }

  public playLevelUp() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      this.playRawTone(ctx, now + idx * 0.065, freq, freq * 1.02, 0.15, 'triangle', 0.18 * sfx);
    });
  }

  public playRevive() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      this.playRawTone(ctx, now + idx * 0.055, freq, freq * 1.03, 0.18, 'sine', 0.2 * sfx);
    });
  }

  public playExplosion(scale: number = 1) {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const duration = Math.min(0.75, 0.32 + scale * 0.14);
    const vol = Math.min(0.42, 0.24 * scale) * sfx;

    this.playRawTone(ctx, now, 125, 26, duration * 0.85, 'sine', vol);
    this.playRawTone(ctx, now, 95, 30, duration * 0.6, 'sawtooth', vol * 0.7);
    this.playRawNoise(ctx, now, duration, 480, 'lowpass', vol * 1.1);
  }

  public playEnemyHit(isHeavy: boolean = false) {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    if (isHeavy) {
      this.playRawTone(ctx, now, 160, 75, 0.07, 'sawtooth', 0.13 * sfx);
    } else {
      this.playRawNoise(ctx, now, 0.04, 950, 'bandpass', 0.08 * sfx);
    }
  }

  public playDevilFireball() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    this.playRawNoise(ctx, now, 0.18, 950, 'bandpass', 0.16 * sfx);
    this.playRawTone(ctx, now, 260, 95, 0.18, 'sawtooth', 0.16 * sfx);
  }

  public playTeslaCannon() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    this.playRawTone(ctx, now, 1450, 280, 0.24, 'sawtooth', 0.2 * sfx);
    this.playRawTone(ctx, now + 0.04, 520, 1820, 0.18, 'square', 0.14 * sfx);
    this.playRawNoise(ctx, now, 0.22, 2600, 'bandpass', 0.16 * sfx);
  }

  public playPickup(isUpgrade: boolean = false) {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (isUpgrade) {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        this.playRawTone(ctx, now + idx * 0.055, freq, freq * 1.03, 0.12, 'triangle', 0.16 * sfx);
      });
    } else {
      this.playRawTone(ctx, now, 440, 660, 0.07, 'sine', 0.14 * sfx);
      this.playRawTone(ctx, now + 0.05, 660, 880, 0.09, 'sine', 0.14 * sfx);
    }
  }

  public playPlayerHurt() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playRawTone(ctx, now, 210, 85, 0.14, 'sawtooth', 0.22 * sfx);
  }

  public playUIClick() {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playRawTone(ctx, now, 620, 420, 0.035, 'triangle', 0.1 * sfx);
  }

  public playTacticalPing(kind: 'RALLY' | 'ENEMY' | 'SUPPLY' = 'RALLY') {
    const sfx = this.sfxScale;
    if (sfx <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (kind === 'ENEMY') {
      this.playRawTone(ctx, now, 880, 1320, 0.08, 'sawtooth', 0.15 * sfx);
      this.playRawTone(ctx, now + 0.09, 1320, 1760, 0.12, 'sawtooth', 0.16 * sfx);
    } else if (kind === 'SUPPLY') {
      this.playRawTone(ctx, now, 587.33, 880, 0.09, 'triangle', 0.15 * sfx);
      this.playRawTone(ctx, now + 0.08, 880, 1174.66, 0.12, 'triangle', 0.15 * sfx);
    } else {
      this.playRawTone(ctx, now, 740, 1110, 0.07, 'sine', 0.15 * sfx);
      this.playRawTone(ctx, now + 0.08, 1110, 1480, 0.14, 'sine', 0.14 * sfx);
    }
  }

  private playRawTone(
    ctx: AudioContext,
    startTime: number,
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    if (volume <= 0.001) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, startFreq), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private playRawNoise(
    ctx: AudioContext,
    startTime: number,
    duration: number,
    filterFreq: number,
    filterType: BiquadFilterType,
    volume: number
  ) {
    if (!this.noiseBuffer || volume <= 0.001) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(startTime, Math.random() * 0.5, duration);
    src.stop(startTime + duration + 0.01);
  }
}

export const soundEngine = new SoundEngine();
