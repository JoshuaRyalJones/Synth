import { DEFAULT_PARAMS, type SynthParams } from '../audio/types.ts'

const USER_PRESETS_KEY = 'synth.userPresets'

/**
 * Factory presets shipped with the app. Each is a full SynthParams object so
 * loading one is just "replace the whole params tree" — no merging needed.
 */
export const factoryPresets: Record<string, SynthParams> = {
  Init: DEFAULT_PARAMS,

  'Fat Bass': {
    osc1Waveform: 'square',
    osc2Waveform: 'sawtooth',
    osc2Octave: -1,
    oscDetune: 6,
    oscMix: 0.4,
    amp: { attack: 0.005, decay: 0.15, sustain: 0.6, release: 0.15 },
    filter: { cutoff: 350, resonance: 4, envAmount: 0.5, attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.15 },
    lfo: { waveform: 'sine', rate: 4, depth: 0, target: 'off' },
    fx: { delayTime: 0.2, delayFeedback: 0.1, delayMix: 0.05, reverbMix: 0.05 },
    masterVolume: 0.85,
  },

  'Soft Pad': {
    osc1Waveform: 'triangle',
    osc2Waveform: 'sine',
    osc2Octave: 0,
    oscDetune: 12,
    oscMix: 0.5,
    amp: { attack: 1.2, decay: 0.8, sustain: 0.8, release: 1.8 },
    filter: { cutoff: 1200, resonance: 1, envAmount: 0.3, attack: 1.0, decay: 1.0, sustain: 0.7, release: 1.5 },
    lfo: { waveform: 'sine', rate: 0.3, depth: 0.1, target: 'pitch' },
    fx: { delayTime: 0.4, delayFeedback: 0.3, delayMix: 0.25, reverbMix: 0.6 },
    masterVolume: 0.7,
  },

  Pluck: {
    osc1Waveform: 'sawtooth',
    osc2Waveform: 'square',
    osc2Octave: 1,
    oscDetune: 4,
    oscMix: 0.3,
    amp: { attack: 0.002, decay: 0.18, sustain: 0.05, release: 0.1 },
    filter: { cutoff: 1800, resonance: 3, envAmount: 0.6, attack: 0.002, decay: 0.15, sustain: 0.1, release: 0.1 },
    lfo: { waveform: 'sine', rate: 5, depth: 0, target: 'off' },
    fx: { delayTime: 0.18, delayFeedback: 0.2, delayMix: 0.2, reverbMix: 0.15 },
    masterVolume: 0.8,
  },

  Lead: {
    osc1Waveform: 'sawtooth',
    osc2Waveform: 'sawtooth',
    osc2Octave: 0,
    oscDetune: 18,
    oscMix: 0.5,
    amp: { attack: 0.02, decay: 0.1, sustain: 0.85, release: 0.25 },
    filter: { cutoff: 3500, resonance: 5, envAmount: 0.3, attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.2 },
    lfo: { waveform: 'sine', rate: 5.5, depth: 0.05, target: 'pitch' },
    fx: { delayTime: 0.22, delayFeedback: 0.25, delayMix: 0.2, reverbMix: 0.2 },
    masterVolume: 0.8,
  },

  Wobble: {
    osc1Waveform: 'square',
    osc2Waveform: 'sawtooth',
    osc2Octave: 0,
    oscDetune: 10,
    oscMix: 0.5,
    amp: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.3 },
    filter: { cutoff: 600, resonance: 8, envAmount: 0.4, attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
    lfo: { waveform: 'sine', rate: 3, depth: 0.8, target: 'filter' },
    fx: { delayTime: 0.3, delayFeedback: 0.3, delayMix: 0.15, reverbMix: 0.15 },
    masterVolume: 0.8,
  },
}

/** Read user-saved presets from localStorage. Returns {} on any parse/storage error. */
export function loadUserPresets(): Record<string, SynthParams> {
  try {
    const raw = localStorage.getItem(USER_PRESETS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, SynthParams>
    }
    return {}
  } catch {
    return {}
  }
}

/** Save (or overwrite) a single named user preset in localStorage. */
export function saveUserPreset(name: string, params: SynthParams): void {
  try {
    const all = loadUserPresets()
    all[name] = params
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable (e.g. private browsing quota) — fail silently.
  }
}

/** Remove a single named user preset from localStorage. */
export function deleteUserPreset(name: string): void {
  try {
    const all = loadUserPresets()
    delete all[name]
    localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}
