/**
 * WebAudio-synthesized SFX per docs/DESIGN.md's juice plan — no audio
 * files. The AudioContext is created lazily on first play() (always
 * triggered by a user gesture: a drop or the mute toggle), and every
 * call is a safe no-op in environments without WebAudio (e.g. tests).
 */

const MUTE_STORAGE_KEY = "strength-stack:muted";
const MIN_REPEAT_INTERVAL_MS = 80;
const PEAK_GAIN = 0.13;
const CELEBRATE_PEAK_GAIN = 0.16;

type SoundName = "place" | "rescale" | "celebrate";

function resolveAudioContextCtor(): typeof AudioContext | undefined {
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return w.AudioContext ?? w.webkitAudioContext;
}

function readStoredMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  private lastPlayedAt: Partial<Record<SoundName, number>> = {};

  constructor() {
    this.muted = readStoredMuted();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      // Private-mode / test environments without localStorage: the
      // in-memory mute state still applies, it just won't persist.
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playPlace(): void {
    this.play("place", () => this.tone(440, 0, 0.06, PEAK_GAIN));
  }

  playRescale(): void {
    this.play("rescale", () => {
      this.tone(520, 0, 0.08, PEAK_GAIN);
      this.tone(720, 0.06, 0.1, PEAK_GAIN);
    });
  }

  playCelebrate(): void {
    this.play("celebrate", () => {
      this.tone(660, 0, 0.12, CELEBRATE_PEAK_GAIN);
      this.tone(880, 0.08, 0.12, CELEBRATE_PEAK_GAIN);
      this.tone(1100, 0.16, 0.2, CELEBRATE_PEAK_GAIN);
    });
  }

  private play(name: SoundName, emit: () => void): void {
    if (this.muted) return;

    const now = Date.now();
    const last = this.lastPlayedAt[name] ?? 0;
    if (now - last < MIN_REPEAT_INTERVAL_MS) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    this.lastPlayedAt[name] = now;
    emit();
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = resolveAudioContextCtor();
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  private tone(
    frequencyHz: number,
    startOffsetSeconds: number,
    durationSeconds: number,
    peakGain: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequencyHz;

    const startTime = ctx.currentTime + startOffsetSeconds;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSeconds);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationSeconds + 0.02);
  }
}
