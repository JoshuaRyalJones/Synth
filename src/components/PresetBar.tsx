import { useState } from 'react'
import { useSynthStore } from '../state/synthStore.ts'
import { factoryPresets } from '../presets/presets.ts'

/**
 * Top bar: pick a factory or saved preset from the dropdown, or type a name
 * and click Save to store the current params as a new user preset.
 */
export default function PresetBar() {
  const presetNames = useSynthStore((s) => s.presetNames)
  const currentPreset = useSynthStore((s) => s.currentPreset)
  const loadPreset = useSynthStore((s) => s.loadPreset)
  const saveUserPreset = useSynthStore((s) => s.saveUserPreset)
  const deleteUserPreset = useSynthStore((s) => s.deleteUserPreset)

  // Local (non-store) state for the "save as" text field — it only matters
  // while the user is typing, so it doesn't belong in global synth state.
  const [newName, setNewName] = useState('')

  const isUserPreset = currentPreset !== null && !(currentPreset in factoryPresets)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-800 p-3">
      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <span>Preset</span>
        <select
          value={currentPreset ?? ''}
          onChange={(e) => loadPreset(e.target.value)}
          className="rounded bg-neutral-700 px-2 py-1 text-neutral-100"
        >
          <option value="" disabled>
            Select a preset
          </option>
          {presetNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      {isUserPreset && (
        <button
          onClick={() => deleteUserPreset(currentPreset)}
          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
        >
          Delete
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New preset name"
          className="rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-100 placeholder:text-neutral-500"
        />
        <button
          onClick={() => {
            const name = newName.trim()
            if (!name) return
            saveUserPreset(name)
            setNewName('')
          }}
          className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500"
        >
          Save
        </button>
      </div>
    </div>
  )
}
