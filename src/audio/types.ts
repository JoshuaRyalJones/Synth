// THE CONTRACT.
// All other layers (state store, presets, React UI) import these types and
// DEFAULT_PARAMS. Field names must stay exactly as written here.

/** Oscillator waveform shapes supported by the native Web Audio OscillatorNode. */
export type Waveform = 'sine' | 'sawtooth' | 'square' | 'triangle'

/** A classic Attack/Decay/Sustain/Release envelope. */
export interface ADSR {
  attack: number   // seconds, >= 0
  decay: number    // seconds, >= 0
  sustain: number  // level 0..1
  release: number  // seconds, >= 0
}

/** Resonant low-pass filter with its own envelope that "opens" the cutoff over time. */
export interface FilterParams {
  cutoff: number     // Hz, 20..20000 (the filter's resting/base frequency)
  resonance: number  // Q, 0..30
  envAmount: number  // 0..1 how much the filter envelope opens the cutoff
  attack: number     // filter envelope, seconds
  decay: number
  sustain: number    // 0..1
  release: number
}

/** A single global low-frequency oscillator that can modulate pitch or filter cutoff. */
export interface LfoParams {
  waveform: Waveform
  rate: number       // Hz, 0.01..20
  depth: number      // 0..1
  target: 'off' | 'pitch' | 'filter'
}

/** Master delay + reverb send/mix settings. */
export interface FxParams {
  delayTime: number     // seconds, 0..1
  delayFeedback: number // 0..0.95
  delayMix: number      // 0..1 wet
  reverbMix: number     // 0..1 wet
}

/** The full set of parameters that fully describes the synth's sound. */
export interface SynthParams {
  osc1Waveform: Waveform
  osc2Waveform: Waveform
  osc2Octave: number    // integer octave offset for osc2, -2..2
  oscDetune: number     // cents applied to osc2, -50..50
  oscMix: number        // 0..1 (0 = only osc1, 1 = only osc2)
  amp: ADSR
  filter: FilterParams
  lfo: LfoParams
  fx: FxParams
  masterVolume: number  // 0..1
}

/**
 * Sensible musical starting point: two sawtooth oscillators blended evenly,
 * a gentle amp envelope, a filter that opens moderately with velocity/envelope,
 * LFO off, light fx, and headroom-friendly master volume.
 */
export const DEFAULT_PARAMS: SynthParams = {
  osc1Waveform: 'sawtooth',
  osc2Waveform: 'sawtooth',
  osc2Octave: 0,
  oscDetune: 8,
  oscMix: 0.5,
  amp: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
  },
  filter: {
    cutoff: 2000,
    resonance: 2,
    envAmount: 0.4,
    attack: 0.01,
    decay: 0.25,
    sustain: 0.5,
    release: 0.3,
  },
  lfo: {
    waveform: 'sine',
    rate: 4,
    depth: 0,
    target: 'off',
  },
  fx: {
    delayTime: 0.25,
    delayFeedback: 0.25,
    delayMix: 0.15,
    reverbMix: 0.2,
  },
  masterVolume: 0.8,
}
