import Slider from './Slider.tsx'
import { useSynthStore } from '../state/synthStore.ts'

/** Master output volume — the final gain stage before the speakers. */
export default function MasterPanel() {
  const masterVolume = useSynthStore((s) => s.params.masterVolume)
  const setParams = useSynthStore((s) => s.setParams)

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-200">Master</h2>
      <Slider
        label="Volume"
        value={masterVolume}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setParams({ masterVolume: v })}
      />
    </div>
  )
}
