import Slider from './Slider.tsx'
import { useSynthStore } from '../state/synthStore.ts'
import type { LfoParams, Waveform } from '../audio/types.ts'

const WAVEFORMS: Waveform[] = ['sine', 'sawtooth', 'square', 'triangle']
const TARGETS: LfoParams['target'][] = ['off', 'pitch', 'filter']

/** The single global LFO — can modulate pitch (vibrato) or filter cutoff (wobble). */
export default function LfoPanel() {
  const lfo = useSynthStore((s) => s.params.lfo)
  const setParams = useSynthStore((s) => s.setParams)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-200">LFO</h2>

      <label className="flex flex-col gap-1 text-xs text-neutral-300">
        <span>Waveform</span>
        <select
          value={lfo.waveform}
          onChange={(e) => setParams({ lfo: { waveform: e.target.value as Waveform } })}
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
        <span>Target</span>
        <select
          value={lfo.target}
          onChange={(e) => setParams({ lfo: { target: e.target.value as LfoParams['target'] } })}
          className="rounded bg-neutral-700 px-2 py-1 text-neutral-100"
        >
          {TARGETS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <Slider
        label="Rate"
        value={lfo.rate}
        min={0.01}
        max={20}
        step={0.01}
        unit="Hz"
        onChange={(v) => setParams({ lfo: { rate: v } })}
      />
      <Slider
        label="Depth"
        value={lfo.depth}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ lfo: { depth: v } })}
      />
    </div>
  )
}
