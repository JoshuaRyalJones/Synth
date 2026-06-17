import { useSynthStore } from './state/synthStore.ts'
import PresetBar from './components/PresetBar.tsx'
import OscillatorPanel from './components/OscillatorPanel.tsx'
import EnvelopePanel from './components/EnvelopePanel.tsx'
import FilterPanel from './components/FilterPanel.tsx'
import LfoPanel from './components/LfoPanel.tsx'
import FxPanel from './components/FxPanel.tsx'
import MasterPanel from './components/MasterPanel.tsx'
import Keyboard from './components/Keyboard.tsx'

/**
 * Top-level layout: preset bar, a responsive grid of control panels, and the
 * on-screen keyboard pinned at the bottom. All audio state lives in the
 * Zustand store (useSynthStore) — this component just wires the Keyboard's
 * note events to the store's noteOn/noteOff actions.
 */
export default function App() {
  const noteOn = useSynthStore((s) => s.noteOn)
  const noteOff = useSynthStore((s) => s.noteOff)
  const activeNotes = useSynthStore((s) => s.activeNotes)

  return (
    <div className="flex h-full flex-col bg-neutral-900 text-neutral-100">
      <header className="px-6 pt-4">
        <h1 className="text-lg font-bold tracking-tight">Synth</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-4">
          <PresetBar />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OscillatorPanel />
          <EnvelopePanel />
          <FilterPanel />
          <LfoPanel />
          <FxPanel />
          <MasterPanel />
        </div>
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950 px-6 py-4">
        <Keyboard onNoteOn={noteOn} onNoteOff={noteOff} activeNotes={activeNotes} />
      </footer>
    </div>
  )
}
