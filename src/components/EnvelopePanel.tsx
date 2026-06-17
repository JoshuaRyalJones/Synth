import Slider from './Slider.tsx'
import { useSynthStore } from '../state/synthStore.ts'

/** The amp (volume) ADSR envelope — shapes how loud a note is over time. */
export default function EnvelopePanel() {
  const amp = useSynthStore((s) => s.params.amp)
  const setParams = useSynthStore((s) => s.setParams)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-200">Amp Envelope</h2>
      <Slider
        label="Attack"
        value={amp.attack}
        min={0}
        max={2}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ amp: { attack: v } })}
      />
      <Slider
        label="Decay"
        value={amp.decay}
        min={0}
        max={2}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ amp: { decay: v } })}
      />
      <Slider
        label="Sustain"
        value={amp.sustain}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ amp: { sustain: v } })}
      />
      <Slider
        label="Release"
        value={amp.release}
        min={0}
        max={3}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ amp: { release: v } })}
      />
    </div>
  )
}
