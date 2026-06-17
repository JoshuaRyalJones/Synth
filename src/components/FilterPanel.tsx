import Slider from './Slider.tsx'
import { useSynthStore } from '../state/synthStore.ts'

/** The resonant low-pass filter and its own ADSR envelope (which "opens" the cutoff over time). */
export default function FilterPanel() {
  const filter = useSynthStore((s) => s.params.filter)
  const setParams = useSynthStore((s) => s.setParams)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-200">Filter</h2>
      <Slider
        label="Cutoff"
        value={filter.cutoff}
        min={20}
        max={20000}
        step={1}
        unit="Hz"
        onChange={(v) => setParams({ filter: { cutoff: v } })}
      />
      <Slider
        label="Resonance"
        value={filter.resonance}
        min={0}
        max={30}
        step={0.1}
        onChange={(v) => setParams({ filter: { resonance: v } })}
      />
      <Slider
        label="Env Amount"
        value={filter.envAmount}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ filter: { envAmount: v } })}
      />
      <Slider
        label="Attack"
        value={filter.attack}
        min={0}
        max={2}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ filter: { attack: v } })}
      />
      <Slider
        label="Decay"
        value={filter.decay}
        min={0}
        max={2}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ filter: { decay: v } })}
      />
      <Slider
        label="Sustain"
        value={filter.sustain}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ filter: { sustain: v } })}
      />
      <Slider
        label="Release"
        value={filter.release}
        min={0}
        max={3}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ filter: { release: v } })}
      />
    </div>
  )
}
