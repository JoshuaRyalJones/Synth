# Synth

A playable, polyphonic subtractive synthesizer that runs entirely in the browser. Built with the Web Audio API, React 19, TypeScript, Vite, Tailwind, and Zustand.

Play it with the on-screen piano, shape the sound with the control panels, and save your own patches.

## Features

- **On-screen piano** — 2 octaves, mouse and touch. First click unlocks audio.
- **Polyphonic** — up to 8 notes at once (last-note priority, steals the oldest voice when full).
- **Per-voice signal chain** — dual oscillator (waveform, octave, detune, mix) → resonant low-pass filter with its own ADSR envelope → amp ADSR.
- **Global modulation & FX** — one LFO routable to pitch or filter cutoff, plus a master delay and reverb.
- **Presets** — 6 built-in factory patches (Init, Fat Bass, Soft Pad, Pluck, Lead, Wobble) and save/load your own to the browser (localStorage).

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173), **click a key** to start audio, then play. Load the **Wobble** preset to hear the LFO modulating the filter.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## How it works

The audio code and the React code are deliberately separated:

- **Audio engine** (`src/audio/`) — plain TypeScript, no React. It owns every Web Audio node, so React re-renders never disturb a playing note.
  - `types.ts` — the `SynthParams` contract shared by every layer, plus `DEFAULT_PARAMS`
  - `voice.ts` — a single polyphonic voice (dual osc → filter+envelope → amp)
  - `lfo.ts` — the global low-frequency oscillator
  - `effects.ts` — master delay + reverb + volume
  - `synthEngine.ts` — the voice pool and public API (`noteOn`, `noteOff`, `setParams`)
  - `audioContext.ts` — the shared `AudioContext`
- **State** (`src/state/synthStore.ts`) — a Zustand store that owns the engine instance and forwards every knob change and note event to it.
- **UI** (`src/components/`, `src/App.tsx`) — the control surface: the `Keyboard`, a reusable `Slider`, and one panel per section (Oscillator, Envelope, Filter, LFO, FX, Master, plus the preset bar).
- **Presets** (`src/presets/presets.ts`) — factory patches and the localStorage save/load helpers.

If it helps to think in synth terms: the React components are the **front panel**, the Zustand store is the **patch memory / brain**, and the engine classes are the **circuitry** behind the panel.

The full design contract lives in [`docs/superpowers/specs/2026-06-17-synth-design.md`](docs/superpowers/specs/2026-06-17-synth-design.md).

## Not included (yet)

Computer-keyboard and MIDI input, a step sequencer, audio recording/export, and more than two oscillators. The architecture leaves room for all of these.
