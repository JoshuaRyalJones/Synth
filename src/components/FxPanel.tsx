import Slider from './Slider.tsx'
import { useSynthStore } from '../state/synthStore.ts'

/** Master delay + reverb send controls. */
export default function FxPanel() {
  const fx = useSynthStore((s) => s.params.fx)
  const setParams = useSynthStore((s) => s.setParams)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-200">FX</h2>
      <Slider
        label="Delay Time"
        value={fx.delayTime}
        min={0}
        max={1}
        step={0.01}
        unit="s"
        onChange={(v) => setParams({ fx: { delayTime: v } })}
      />
      <Slider
        label="Delay Feedback"
        value={fx.delayFeedback}
        min={0}
        max={0.95}
        step={0.01}
        onChange={(v) => setParams({ fx: { delayFeedback: v } })}
      />
      <Slider
        label="Delay Mix"
        value={fx.delayMix}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ fx: { delayMix: v } })}
      />
      <Slider
        label="Reverb Mix"
        value={fx.reverbMix}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ fx: { reverbMix: v } })}
      />
    </div>
  )
}
