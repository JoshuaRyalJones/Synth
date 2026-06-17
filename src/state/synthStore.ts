import { create } from 'zustand'
import { SynthEngine } from '../audio/synthEngine.ts'
import { getAudioContext, resumeAudio } from '../audio/audioContext.ts'
import { DEFAULT_PARAMS, type SynthParams } from '../audio/types.ts'
import { factoryPresets } from '../presets/presets.ts'
import {
  loadUserPresets,
  saveUserPreset as saveUserPresetToStorage,
  deleteUserPreset as deleteUserPresetFromStorage,
} from '../presets/presets.ts'

// A "DeepPartial" lets callers pass e.g. { filter: { cutoff: 800 } } without
// having to supply every other field of `filter`. Only goes 2 levels deep,
// which is all SynthParams needs (top-level fields, or one nested object).
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K]
}

/**
 * The SynthEngine is plain Web Audio — it does NOT belong in React state.
 * We keep a single module-level instance here (outside the store/React tree)
 * and create it lazily on the first noteOn, because browsers require a user
 * gesture before audio can play (autoplay policy).
 */
let engine: SynthEngine | null = null

function getOrCreateEngine(currentParams: SynthParams): SynthEngine {
  if (!engine) {
    const ctx = getAudioContext()
    engine = new SynthEngine(ctx, ctx.destination)
    // Push whatever params the store currently holds into the freshly-made engine.
    engine.setParams(currentParams)
  }
  return engine
}

/** Shallow-merge a DeepPartial<SynthParams> patch into a full SynthParams object. */
function mergeParams(base: SynthParams, patch: DeepPartial<SynthParams>): SynthParams {
  const result: SynthParams = { ...base }
  for (const key in patch) {
    const k = key as keyof SynthParams
    const value = patch[k]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Nested object field (amp, filter, lfo, fx) — merge one level deeper.
      result[k] = { ...(base[k] as object), ...(value as object) } as never
    } else if (value !== undefined) {
      result[k] = value as never
    }
  }
  return result
}

interface SynthState {
  params: SynthParams
  activeNotes: number[]
  presetNames: string[]
  currentPreset: string | null

  setParams: (patch: DeepPartial<SynthParams>) => void
  noteOn: (midi: number) => void
  noteOff: (midi: number) => void
  loadPreset: (name: string) => void
  saveUserPreset: (name: string) => void
  deleteUserPreset: (name: string) => void
}

function allPresetNames(): string[] {
  return [...Object.keys(factoryPresets), ...Object.keys(loadUserPresets())]
}

export const useSynthStore = create<SynthState>((set, get) => ({
  params: DEFAULT_PARAMS,
  activeNotes: [],
  presetNames: allPresetNames(),
  currentPreset: null,

  setParams: (patch) => {
    const next = mergeParams(get().params, patch)
    set({ params: next })
    // If the engine hasn't been created yet (no note played), there's nothing
    // live to update — it will pick up `params` from the store on creation.
    engine?.setParams(next)
  },

  noteOn: (midi) => {
    // Must run on a user gesture; resumeAudio() is a no-op if already running.
    resumeAudio()
    const eng = getOrCreateEngine(get().params)
    eng.noteOn(midi, 0.8)
    set((state) =>
      state.activeNotes.includes(midi) ? state : { activeNotes: [...state.activeNotes, midi] },
    )
  },

  noteOff: (midi) => {
    engine?.noteOff(midi)
    set((state) => ({ activeNotes: state.activeNotes.filter((n) => n !== midi) }))
  },

  loadPreset: (name) => {
    const preset = factoryPresets[name] ?? loadUserPresets()[name]
    if (!preset) return
    set({ params: preset, currentPreset: name })
    engine?.setParams(preset)
  },

  saveUserPreset: (name) => {
    saveUserPresetToStorage(name, get().params)
    set({ presetNames: allPresetNames(), currentPreset: name })
  },

  deleteUserPreset: (name) => {
    deleteUserPresetFromStorage(name)
    set((state) => ({
      presetNames: allPresetNames(),
      currentPreset: state.currentPreset === name ? null : state.currentPreset,
    }))
  },
}))
