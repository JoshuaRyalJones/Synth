import type { TouchEvent } from 'react'

interface KeyboardProps {
  onNoteOn: (midi: number) => void
  onNoteOff: (midi: number) => void
  activeNotes: number[]
  startOctave?: number
  octaves?: number
}

// Semitone offsets (from C) for the white keys, in order, within one octave.
const WHITE_KEY_OFFSETS = [0, 2, 4, 5, 7, 9, 11]
// Black keys: which white-key index they sit after, and their semitone offset.
const BLACK_KEYS: { afterWhiteIndex: number; offset: number }[] = [
  { afterWhiteIndex: 0, offset: 1 }, // C#
  { afterWhiteIndex: 1, offset: 3 }, // D#
  { afterWhiteIndex: 3, offset: 6 }, // F#
  { afterWhiteIndex: 4, offset: 8 }, // G#
  { afterWhiteIndex: 5, offset: 10 }, // A#
]

/** MIDI note number for octave `octave` (where octave 4 starts at C4 = MIDI 60) and semitone offset. */
function midiFor(octave: number, semitoneOffset: number): number {
  return (octave + 1) * 12 + semitoneOffset
}

/**
 * On-screen piano. Mouse and touch both work: pressing a key calls
 * onNoteOn, releasing (or sliding off) calls onNoteOff.
 *
 * Layout approach: white keys are laid out in a flex row, each taking equal
 * width. Black keys are absolutely positioned on top, offset by fractions of
 * a white-key width so they sit between the correct pair of white keys.
 */
export default function Keyboard({
  onNoteOn,
  onNoteOff,
  activeNotes,
  startOctave = 4,
  octaves = 2,
}: KeyboardProps) {
  const whiteKeys: { midi: number }[] = []
  for (let o = 0; o < octaves; o++) {
    for (const offset of WHITE_KEY_OFFSETS) {
      whiteKeys.push({ midi: midiFor(startOctave + o, offset) })
    }
  }

  const blackKeys: { midi: number; leftWhiteIndex: number }[] = []
  for (let o = 0; o < octaves; o++) {
    for (const bk of BLACK_KEYS) {
      blackKeys.push({
        midi: midiFor(startOctave + o, bk.offset),
        leftWhiteIndex: o * WHITE_KEY_OFFSETS.length + bk.afterWhiteIndex,
      })
    }
  }

  const whiteKeyWidthPct = 100 / whiteKeys.length

  // Shared handlers for both mouse and touch — they just need a midi note.
  const pressHandlers = (midi: number) => ({
    onMouseDown: () => onNoteOn(midi),
    onMouseUp: () => onNoteOff(midi),
    onMouseLeave: () => onNoteOff(midi),
    // Touch devices don't fire mouse events; handle them explicitly so the
    // piano works on tablets/phones too.
    onTouchStart: (e: TouchEvent) => {
      e.preventDefault()
      onNoteOn(midi)
    },
    onTouchEnd: (e: TouchEvent) => {
      e.preventDefault()
      onNoteOff(midi)
    },
  })

  return (
    <div className="relative h-32 w-full select-none">
      {/* White keys */}
      <div className="flex h-full w-full">
        {whiteKeys.map(({ midi }) => (
          <div
            key={midi}
            {...pressHandlers(midi)}
            style={{ width: `${whiteKeyWidthPct}%` }}
            className={`h-full border border-neutral-700 rounded-b-md ${
              activeNotes.includes(midi) ? 'bg-emerald-400' : 'bg-neutral-100'
            }`}
          />
        ))}
      </div>

      {/* Black keys, absolutely positioned over the white keys */}
      <div className="absolute top-0 left-0 h-[60%] w-full">
        {blackKeys.map(({ midi, leftWhiteIndex }) => (
          <div
            key={midi}
            {...pressHandlers(midi)}
            style={{
              position: 'absolute',
              left: `calc(${(leftWhiteIndex + 1) * whiteKeyWidthPct}% - ${whiteKeyWidthPct * 0.3}%)`,
              width: `${whiteKeyWidthPct * 0.6}%`,
            }}
            className={`h-full rounded-b-md ${
              activeNotes.includes(midi) ? 'bg-emerald-600' : 'bg-neutral-900'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
