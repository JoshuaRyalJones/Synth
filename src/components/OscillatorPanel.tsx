import Slider from './Slider.tsx'
import { useSynthStore } from '../state/synthStore.ts'
import type { Waveform } from '../audio/types.ts'

const WAVEFORMS: Waveform[] = ['sine', 'sawtooth', 'square', 'triangle']

/** Controls for both oscillators: waveform shapes, osc2's octave/detune, and the osc1/osc2 mix. */
export default function OscillatorPanel() {
  // Selecting only the slice of state this component needs keeps re-renders
  // scoped to when these specific params change.
  const osc1Waveform = useSynthStore((s) => s.params.osc1Waveform)
  const osc2Waveform = useSynthStore((s) => s.params.osc2Waveform)
  const osc2Octave = useSynthStore((s) => s.params.osc2Octave)
  const oscDetune = useSynthStore((s) => s.params.oscDetune)
  const oscMix = useSynthStore((s) => s.params.oscMix)
  const setParams = useSynthStore((s) => s.setParams)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-200">Oscillators</h2>

      <label className="flex flex-col gap-1 text-xs text-neutral-300">
        <span>Osc 1 Waveform</span>
        <select
          value={osc1Waveform}
          onChange={(e) => setParams({ osc1Waveform: e.target.value as Waveform })}
          className="rounded bg-neutral-700 px-2 py-1 text-neutral-100"
        >
          {WAVEFORMS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-neutral-300">
        <span>Osc 2 Waveform</span>
        <select
          value={osc2Waveform}
          onChange={(e) => setParams({ osc2Waveform: e.target.value as Waveform })}
          className="rounded bg-neutral-700 px-2 py-1 text-neutral-100"
        >
          {WAVEFORMS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>

      <Slider
        label="Osc 2 Octave"
        value={osc2Octave}
        min={-2}
        max={2}
        step={1}
        onChange={(v) => setParams({ osc2Octave: v })}
      />
      <Slider
        label="Osc 2 Detune"
        value={oscDetune}
        min={-50}
        max={50}
        step={1}
        unit="c"
        onChange={(v) => setParams({ oscDetune: v })}
      />
      <Slider
        label="Osc Mix"
        value={oscMix}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ oscMix: v })}
      />
    </div>
  )
}
