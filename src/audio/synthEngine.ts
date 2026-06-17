import { Voice } from './voice.ts'
import { Lfo } from './lfo.ts'
import { Effects } from './effects.ts'
import { DEFAULT_PARAMS, type SynthParams } from './types.ts'

/** Max number of voices that can sound at once. The 9th simultaneous note steals the oldest. */
const MAX_VOICES = 8

/**
 * Owns the whole audio graph for the synth: an 8-voice pool, one global LFO,
 * and the master FX chain. This class has no React dependency — it can be
 * constructed and driven directly (e.g. from tests or the Zustand store).
 *
 *   voice 1 --\
 *   voice 2 ---+--> effects.input --> ... --> destination
 *   ...       /
 *   voice N --/
 *
 * The LFO is patched into whichever AudioParam matches `params.lfo.target`
 * on every currently active voice, and is re-patched into new voices as they
 * are created.
 */
export class SynthEngine {
  private ctx: AudioContext
  private params: SynthParams = DEFAULT_PARAMS

  private effects: Effects
  private lfo: Lfo

  // Order matters here: it's a simple insertion-ordered queue used for
  // last-note-priority voice stealing (oldest entry = first inserted).
  private voices = new Map<number, Voice>()

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx
    this.effects = new Effects(ctx, destination, this.params.fx, this.params.masterVolume)
    this.lfo = new Lfo(ctx, this.params.lfo)
  }

  /** Start (or retrigger) a note. velocity is 0..1. */
  noteOn(midiNote: number, velocity: number) {
    const existing = this.voices.get(midiNote)
    if (existing) {
      // Re-triggering an already-sounding note: just restart its envelopes.
      existing.retrigger(velocity)
      return
    }

    if (this.voices.size >= MAX_VOICES) {
      this.stealOldestVoice()
    }

    const voice = new Voice(this.ctx, this.effects.input, midiNote, velocity, this.params)
    this.voices.set(midiNote, voice)
    this.connectLfoToVoice(voice)
  }

  /** Release a held note (begins its release envelope; voice cleans itself up). */
  noteOff(midiNote: number) {
    const voice = this.voices.get(midiNote)
    if (!voice) return
    voice.release()
    this.voices.delete(midiNote)
  }

  /**
   * Apply new params to every live voice, the LFO, and the effects chain, and
   * store them so subsequently-created voices pick them up too. Reconnects
   * the LFO if its target changed.
   */
  setParams(params: SynthParams) {
    const targetChanged = params.lfo.target !== this.params.lfo.target
    this.params = params

    for (const voice of this.voices.values()) {
      voice.updateParams(params)
    }

    this.lfo.setParams(params.lfo)
    this.effects.setParams(params.fx)
    this.effects.setMasterVolume(params.masterVolume)

    if (targetChanged) {
      this.lfo.disconnect()
      for (const voice of this.voices.values()) {
        this.connectLfoToVoice(voice)
      }
    }
  }

  /** Stop everything and release all Web Audio resources owned by this engine. */
  dispose() {
    for (const voice of this.voices.values()) {
      voice.stop()
    }
    this.voices.clear()
    this.lfo.dispose()
    this.effects.dispose()
  }

  /** Patch the global LFO into whichever param this voice exposes for the current target. */
  private connectLfoToVoice(voice: Voice) {
    if (this.params.lfo.target === 'filter') {
      this.lfo.connect(voice.filterFrequencyParam)
    } else if (this.params.lfo.target === 'pitch') {
      this.lfo.connect(voice.pitchModParam)
    }
    // target === 'off' -> intentionally leave disconnected.
  }

  /** Voice-stealing: forcibly stop the oldest held note to make room for a new one. */
  private stealOldestVoice() {
    const oldestEntry = this.voices.entries().next()
    if (oldestEntry.done) return
    const [oldestNote, oldestVoice] = oldestEntry.value
    oldestVoice.stop()
    this.voices.delete(oldestNote)
  }
}
