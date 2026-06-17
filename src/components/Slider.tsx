interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
}

/**
 * A labeled range input. This is a "controlled" input: its displayed value
 * always comes from the `value` prop (owned by the Zustand store), and every
 * drag calls `onChange` so the parent can push the new value back into state.
 */
export default function Slider({ label, value, min, max, step, onChange, unit }: SliderProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-neutral-300">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="text-neutral-400 tabular-nums">
          {formatValue(value, step)}
          {unit ?? ''}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        // Range input values are always strings — must convert back to number.
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-emerald-500"
      />
    </label>
  )
}

// Show whole numbers without decimals, fractional steps with a couple of digits.
function formatValue(value: number, step: number): string {
  return step < 1 ? value.toFixed(2) : String(Math.round(value))
}
