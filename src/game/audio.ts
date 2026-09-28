// ============================================================
// AUDIO - Web Audio API, fully synthesized sounds and music
// ============================================================
import { clamp } from './constants';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private initialized = false;
  private musicOsc: OscillatorNode | null = null;
  private musicGainNode: GainNode | null = null;
  private currentTrack: string = '';
  private musicInterval: number | null = null;

  // Volume settings (0-1)
  masterVolume = 0.7;
  musicVolume = 0.4;
  sfxVolume = 0.6;
  uiVolume = 0.5;

  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.uiGain = this.ctx.createGain();
      this.uiGain.gain.value = this.uiVolume;
      this.uiGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(v: number): void {
    this.masterVolume = clamp(v, 0, 1);
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  setMusicVolume(v: number): void {
    this.musicVolume = clamp(v, 0, 1);
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = clamp(v, 0, 1);
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  // ---- SFX ----
  playSwordSwing(): void {
    this.playTone(800, 0.05, 'sawtooth', 0.3, this.sfxGain);
    setTimeout(() => this.playTone(400, 0.05, 'sawtooth', 0.2, this.sfxGain), 30);
  }

  playJump(): void {
    this.playTone(300, 0.08, 'sine', 0.2, this.sfxGain);
    setTimeout(() => this.playTone(450, 0.06, 'sine', 0.15, this.sfxGain), 40);
  }

  playHit(): void {
    this.playNoise(0.08, 0.4, this.sfxGain);
    this.playTone(200, 0.06, 'square', 0.3, this.sfxGain);
  }

  playBlockBreak(): void {
    // Crunchy breaking sound with multiple layers
    this.playNoise(0.15, 0.3, this.sfxGain);
    this.playTone(150, 0.08, 'sawtooth', 0.25, this.sfxGain);
    setTimeout(() => {
      this.playTone(100, 0.06, 'square', 0.2, this.sfxGain);
    }, 30);
    setTimeout(() => {
      this.playNoise(0.1, 0.2, this.sfxGain);
    }, 50);
  }

  playHurt(): void {
    this.playTone(150, 0.1, 'square', 0.4, this.sfxGain);
    setTimeout(() => this.playTone(100, 0.1, 'square', 0.3, this.sfxGain), 50);
  }

  playEnemyDeath(): void {
    this.playTone(400, 0.05, 'square', 0.3, this.sfxGain);
    setTimeout(() => this.playTone(300, 0.05, 'square', 0.25, this.sfxGain), 50);
    setTimeout(() => this.playTone(200, 0.08, 'square', 0.2, this.sfxGain), 100);
  }

  playChestOpen(): void {
    this.playTone(523, 0.08, 'square', 0.3, this.sfxGain);
    setTimeout(() => this.playTone(659, 0.08, 'square', 0.3, this.sfxGain), 80);
    setTimeout(() => this.playTone(784, 0.12, 'square', 0.3, this.sfxGain), 160);
  }

  playCoin(): void {
    this.playTone(988, 0.05, 'square', 0.2, this.sfxGain);
    setTimeout(() => this.playTone(1319, 0.08, 'square', 0.2, this.sfxGain), 50);
  }

  playPickup(): void {
    this.playTone(440, 0.06, 'square', 0.25, this.sfxGain);
    setTimeout(() => this.playTone(660, 0.08, 'square', 0.25, this.sfxGain), 60);
  }

  playDoorOpen(): void {
    this.playTone(220, 0.15, 'triangle', 0.3, this.sfxGain);
    setTimeout(() => this.playTone(330, 0.15, 'triangle', 0.25, this.sfxGain), 100);
  }

  playBossHit(): void {
    this.playNoise(0.12, 0.5, this.sfxGain);
    this.playTone(100, 0.1, 'sawtooth', 0.4, this.sfxGain);
  }

  playQuestComplete(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.12, 'square', 0.3, this.sfxGain), i * 100);
    });
  }

  // ---- UI Sounds ----
  playUIClick(): void {
    this.playTone(660, 0.04, 'square', 0.2, this.uiGain);
  }

  playUIHover(): void {
    this.playTone(440, 0.03, 'sine', 0.1, this.uiGain);
  }

  playUIError(): void {
    this.playTone(150, 0.1, 'sawtooth', 0.3, this.uiGain);
  }

  // ---- Music (simple procedural chiptune) ----
  playMusic(track: string): void {
    if (!this.ctx || !this.musicGain) return;
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;

    // Different melodies per area
    const melodies: Record<string, number[]> = {
      village: [262, 294, 330, 349, 330, 294, 262, 247],
      woods: [220, 247, 262, 294, 330, 294, 262, 247],
      ruins: [196, 220, 247, 262, 247, 220, 196, 175],
      boss: [165, 196, 220, 247, 262, 247, 220, 196],
    };

    const melody = melodies[track] || melodies.village;
    let noteIndex = 0;
    const tempo = track === 'boss' ? 180 : 250;

    const playNote = () => {
      if (!this.ctx || !this.musicGain) return;
      const freq = melody[noteIndex % melody.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = track === 'boss' ? 'sawtooth' : 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
      noteIndex++;
    };

    playNote();
    this.musicInterval = window.setInterval(playNote, tempo);
  }

  stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = '';
  }

  pauseMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  resumeMusic(): void {
    if (this.currentTrack && this.musicInterval === null) {
      const track = this.currentTrack;
      this.currentTrack = '';
      this.playMusic(track);
    }
  }

  // ---- Helpers ----
  private playTone(freq: number, duration: number, type: OscillatorType, volume: number, dest: GainNode | null): void {
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number, dest: GainNode | null): void {
    if (!this.ctx || !dest) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(dest);
    source.start();
  }
}
