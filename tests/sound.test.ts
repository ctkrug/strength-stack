import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SoundEngine } from "../src/sound";

class FakeGainParam {
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeGainNode {
  gain = new FakeGainParam();
  connect = vi.fn();
}

class FakeOscillatorNode {
  type = "";
  frequency = { value: 0 };
  start = vi.fn();
  stop = vi.fn();
  connect = vi.fn((dest: unknown) => dest);
}

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => new FakeOscillatorNode());
  createGain = vi.fn(() => new FakeGainNode());
}

describe("SoundEngine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    vi.restoreAllMocks();
  });

  it("defaults to unmuted when nothing is stored", () => {
    expect(new SoundEngine().isMuted()).toBe(false);
  });

  it("persists mute state to localStorage across instances", () => {
    new SoundEngine().setMuted(true);
    expect(new SoundEngine().isMuted()).toBe(true);
  });

  it("toggleMuted flips and returns the new state", () => {
    const engine = new SoundEngine();
    expect(engine.toggleMuted()).toBe(true);
    expect(engine.toggleMuted()).toBe(false);
  });

  it("does not throw when playing sounds without WebAudio support", () => {
    const engine = new SoundEngine();
    expect(() => {
      engine.playPlace();
      engine.playRescale();
      engine.playCelebrate();
    }).not.toThrow();
  });

  function installFakeAudioContext(instance: FakeAudioContext) {
    const ctor = vi.fn(function (this: unknown) {
      return instance;
    });
    (window as unknown as { AudioContext: unknown }).AudioContext = ctor;
    return ctor;
  }

  it("does not create any audio nodes while muted", () => {
    const instance = new FakeAudioContext();
    const ctor = installFakeAudioContext(instance);

    const engine = new SoundEngine();
    engine.setMuted(true);
    engine.playPlace();

    expect(ctor).not.toHaveBeenCalled();
  });

  it("creates one oscillator for a place blip", () => {
    const instance = new FakeAudioContext();
    installFakeAudioContext(instance);

    new SoundEngine().playPlace();

    expect(instance.createOscillator).toHaveBeenCalledTimes(1);
  });

  it("creates two oscillators for the rescale sweep and three for celebrate", () => {
    const rescaleCtx = new FakeAudioContext();
    installFakeAudioContext(rescaleCtx);
    new SoundEngine().playRescale();
    expect(rescaleCtx.createOscillator).toHaveBeenCalledTimes(2);

    const celebrateCtx = new FakeAudioContext();
    installFakeAudioContext(celebrateCtx);
    new SoundEngine().playCelebrate();
    expect(celebrateCtx.createOscillator).toHaveBeenCalledTimes(3);
  });

  it("throttles rapid repeat calls of the same sound", () => {
    const instance = new FakeAudioContext();
    installFakeAudioContext(instance);

    const engine = new SoundEngine();
    engine.playPlace();
    engine.playPlace();

    expect(instance.createOscillator).toHaveBeenCalledTimes(1);
  });

  it("reuses a single AudioContext across multiple sounds", () => {
    const instance = new FakeAudioContext();
    const ctor = installFakeAudioContext(instance);

    const engine = new SoundEngine();
    engine.playPlace();
    engine.playCelebrate();

    expect(ctor).toHaveBeenCalledTimes(1);
  });
});
