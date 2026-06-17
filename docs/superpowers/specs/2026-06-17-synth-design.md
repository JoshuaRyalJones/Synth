# Synth — Design & Build Contract

Date: 2026-06-17
Status: Approved, in build

## Goal

Turn the current single-button proof-of-concept into a **playable, polyphonic, full mini-DAW-style subtractive synth** running entirely in the browser (Web Audio API), with React for UI.

## Decisions (locked)

- **Input:** on-screen piano (mouse + touch). ~2 octaves. No computer-keyboard / MIDI / sequencer for now.
- **Polyphony:** yes. 8 voices, last-note priority, steal oldest voice when exhausted.
- **Per-voice signal chain:** dual oscillator (+ detune/octave/mix) → resonant low-pass filter (with its own ADSR envelope) → amp gain (ADSR).
- **Global:** one LFO (routable to pitch or filter cutoff) → master delay → master reverb → master volume → destination.
- **Presets:** factory presets shipped in code + user save/load to `localStorage`. No backend.
- **Architecture (Approach A):** vanilla-TS audio engine owns all Web Audio nodes; React only renders controls and pushes parameter changes via a Zustand store. Keep audio logic out of React lifecycle.

## Architecture overview

```
React UI (components/)  --params-->  Zustand store (state/)  --setParams-->  SynthEngine (audio/)
   piano onNoteOn/off  ------------------------------------ noteOn/noteOff -->  Voice pool -> master FX
```

- React never touches AudioNodes directly. It calls store actions.
- The store owns the single `SynthEngine` instance and forwards param changes + note events to it.
- The engine is fully usable/testable without React.

## File structure

```
src/
  audio/
    audioContext.ts   (exists) singleton AudioContext + resume
    types.ts          SynthParams + sub-types (THE CONTRACT)
    voice.ts          (rewrite) one polyphonic voice: dual osc -> filter(env) -> amp(ADSR)
    lfo.ts            global LFO node, connect/disconnect to a target AudioParam
    effects.ts        master FX chain: delay + reverb + master gain
    synthEngine.ts    voice pool, noteOn/noteOff, setParams, owns lfo + effects
  state/
    synthStore.ts     Zustand store: params, activeNotes, preset actions, owns engine
  presets/
    presets.ts        factory presets + localStorage load/save helpers
  components/
    Slider.tsx        labeled range-input control (value/min/max/step/onChange/unit)
    Keyboard.tsx      on-screen piano (mouse+touch), ~2 octaves
    OscillatorPanel.tsx
    EnvelopePanel.tsx (amp ADSR)
    FilterPanel.tsx
    LfoPanel.tsx
    FxPanel.tsx
    MasterPanel.tsx   (master volume)
    PresetBar.tsx     factory dropdown + save/load user presets
  App.tsx             (rewrite) layout assembling panels + keyboard
  index.css           (exists) tailwind; add minimal synth styling as needed
```

## THE CONTRACT — `src/audio/types.ts`

All layers import these. Do not change field names without updating all consumers.

```ts
export type Waveform = 'sine' | 'sawtooth' | 'square' | 'triangle'

export interface ADSR {
  attack: number   // seconds, >= 0
  decay: number    // seconds, >= 0
  sustain: number  // level 0..1
  release: number  // seconds, >= 0
}

export interface FilterParams {
  cutoff: number     // Hz, 20..20000
  resonance: number  // Q, 0..30
  envAmount: number  // 0..1 how much the filter envelope opens the cutoff
  attack: number     // filter envelope, seconds
  decay: number
  sustain: number    // 0..1
  release: number
}

export interface LfoParams {
  waveform: Waveform
  rate: number       // Hz, 0.01..20
  depth: number      // 0..1
  target: 'off' | 'pitch' | 'filter'
}

export interface FxParams {
  delayTime: number     // seconds, 0..1
  delayFeedback: number // 0..0.95
  delayMix: number      // 0..1 wet
  reverbMix: number     // 0..1 wet
}

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

export const DEFAULT_PARAMS: SynthParams // engine agent provides a sensible default
```

## Engine public API — `src/audio/synthEngine.ts`

```ts
export class SynthEngine {
  constructor(ctx: AudioContext, destination: AudioNode)
  noteOn(midiNote: number, velocity: number): void   // velocity 0..1
  noteOff(midiNote: number): void
  setParams(params: SynthParams): void                // apply to live voices + store for new voices
  dispose(): void
}
```

- Pitch from MIDI note: `freq = 440 * 2 ** ((midiNote - 69) / 12)`.
- `noteOn` on an already-sounding note retriggers it.
- LFO is global: connect its output to each active voice's target AudioParam (osc detune for 'pitch', filter frequency for 'filter'); reconnect on target change.

## Store API — `src/state/synthStore.ts` (Zustand)

```ts
interface SynthState {
  params: SynthParams
  activeNotes: number[]              // midi notes currently held (for keyboard highlight)
  presetNames: string[]              // factory + user preset names
  currentPreset: string | null
  // actions
  setParams(patch: DeepPartial<SynthParams>): void  // merge + engine.setParams
  noteOn(midi: number): void         // resumeAudio, engine.noteOn, add to activeNotes
  noteOff(midi: number): void        // engine.noteOff, remove from activeNotes
  loadPreset(name: string): void
  saveUserPreset(name: string): void
  deleteUserPreset(name: string): void
}
```

- Engine instance created lazily on first user gesture (first noteOn) to satisfy autoplay policy; use `resumeAudio()` from `audioContext.ts`.
- Provide convenience: panels may call `setParams({ filter: { cutoff: 800 } })` style partial merges.

## Component contracts

- `Slider`: `{ label: string; value: number; min: number; max: number; step: number; onChange:(v:number)=>void; unit?: string }` — styled range input, shows label + value.
- `Keyboard`: `{ onNoteOn:(midi:number)=>void; onNoteOff:(midi:number)=>void; activeNotes:number[]; startOctave?:number; octaves?:number }` — white/black keys, mouse down/up/leave + touch, highlights active notes.
- Panels read `params` + call `setParams` from the store. Use `Slider` for continuous params, `<select>` for waveform/target.
- `PresetBar`: dropdown of preset names (factory + user) → `loadPreset`; text field + Save → `saveUserPreset`; delete for user presets.

## Presets — `src/presets/presets.ts`

- Export 4–6 factory presets (e.g. "Init", "Fat Bass", "Soft Pad", "Pluck", "Lead", "Wobble") as `Record<string, SynthParams>`.
- `loadUserPresets(): Record<string, SynthParams>` and `saveUserPreset(name, params)` / `deleteUserPreset(name)` backed by `localStorage` key `synth.userPresets`.

## Verification (each agent must do before returning)

- Run `npm run build` (which runs `tsc -b && vite build`). It MUST pass with no type errors.
- Run `npm run lint` and fix any new errors introduced.
- Report exactly which files were created/changed and the final SynthParams/engine signatures actually implemented.

## Out of scope (YAGNI)

Computer-keyboard input, MIDI, sequencer, recording/export of audio, multiple LFOs, more than 2 oscillators, automation. Can be added later.
