import type { SynthParams } from './types.ts'

// Smoothing time constant used for setTargetAtTime calls. Small enough to feel
// instant, large enough to avoid clicks when params change under a live voice.
const SMOOTH_TIME = 0.015

// Filter cutoff is clamped into this audible/safe range for the BiquadFilter.
const MIN_CUTOFF = 20
const MAX_CUTOFF = 20000

/** Convert a MIDI note number to frequency in Hz (A4 = MIDI 69 = 440Hz). */
export function midiToFreq(midiNote: number): number {
  return 440 * 2 ** ((midiNote - 69) / 12)
}

/**
 * One polyphonic voice: dual oscillator -> resonant low-pass filter (with its
 * own ADSR envelope) -> amp gain (ADSR, scaled by velocity).
 *
 * Signal chain:
 *   osc1 ----\
 *             >-- (summed, oscMix-weighted) --> filter --> ampGain --> destination
 *   osc2 ----/
 *
 * The filter's `frequency` AudioParam and a dedicated `detuneModGain` node are
 * exposed so the engine's global LFO can be patched into either one
 * (LfoParams.target === 'filter' | 'pitch').
 */
export class Voice {
  readonly midiNote: number

  private ctx: AudioContext
  private osc1: OscillatorNode
  private osc2: OscillatorNode
  // Each oscillator gets its own gain so we can crossfade between them using oscMix.
  private osc1Gain: GainNode
  private osc2Gain: GainNode
  private filter: BiquadFilterNode
  private ampGain: GainNode

  // A silent-by-default gain node whose output is summed into osc1/osc2's
  // detune AudioParam via connect(audioParam). The LFO connects here for
  // 'pitch' modulation; we never set its gain value, only connect/disconnect.
  private pitchModGain: GainNode

  private params: SynthParams
  private velocity: number
  private releasing = false
  private stopTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(
    ctx: AudioContext,
    destination: AudioNode,
    midiNote: number,
    velocity: number,
    params: SynthParams,
  ) {
    this.ctx = ctx
    this.midiNote = midiNote
    this.velocity = velocity
    this.params = params

    const now = ctx.currentTime
    const freq = midiToFreq(midiNote)

    // --- Oscillators -----------------------------------------------------
    this.osc1 = new OscillatorNode(ctx, { type: params.osc1Waveform, frequency: freq })
    this.osc2 = new OscillatorNode(ctx, {
      type: params.osc2Waveform,
      frequency: midiToFreq(midiNote + params.osc2Octave * 12),
      detune: params.oscDetune,
    })

    this.osc1Gain = new GainNode(ctx, { gain: 1 - params.oscMix })
    this.osc2Gain = new GainNode(ctx, { gain: params.oscMix })

    this.pitchModGain = new GainNode(ctx, { gain: 0 })
    // The LFO (when targeting 'pitch') connects into pitchModGain, whose output
    // feeds both oscillators' detune params so pitch vibrato stays in tune.
    this.pitchModGain.connect(this.osc1.detune)
    this.pitchModGain.connect(this.osc2.detune)

    // --- Filter (with its own ADSR envelope on cutoff) --------------------
    this.filter = new BiquadFilterNode(ctx, {
      type: 'lowpass',
      frequency: clamp(params.filter.cutoff, MIN_CUTOFF, MAX_CUTOFF),
      Q: params.filter.resonance,
    })

    // --- Amp gain (ADSR, scaled by velocity) ------------------------------
    this.ampGain = new GainNode(ctx, { gain: 0 })

    // --- Wire the graph ----------------------------------------------------
    this.osc1.connect(this.osc1Gain).connect(this.filter)
    this.osc2.connect(this.osc2Gain).connect(this.filter)
    this.filter.connect(this.ampGain)
    this.ampGain.connect(destination)

    this.osc1.start(now)
    this.osc2.start(now)

    this.triggerEnvelopes(now)
  }

  /** Filter cutoff AudioParam — the global LFO connects here when target === 'filter'. */
  get filterFrequencyParam(): AudioParam {
    return this.filter.frequency
  }

  /** Pitch modulation input — the global LFO connects here when target === 'pitch'. */
  get pitchModParam(): AudioParam {
    return this.pitchModGain.gain
  }

  /** Schedule the attack/decay ramps for both the filter envelope and the amp envelope. */
  private triggerEnvelopes(startTime: number) {
    const { amp, filter } = this.params

    // Amp envelope: 0 -> velocity (attack) -> velocity*sustain (decay).
    const peak = Math.max(this.velocity, 0.0001)
    this.ampGain.gain.cancelScheduledValues(startTime)
    this.ampGain.gain.setValueAtTime(0, startTime)
    this.ampGain.gain.linearRampToValueAtTime(peak, startTime + Math.max(amp.attack, 0.001))
    this.ampGain.gain.linearRampToValueAtTime(
      peak * amp.sustain,
      startTime + Math.max(amp.attack, 0.001) + Math.max(amp.decay, 0.001),
    )

    // Filter envelope: base cutoff -> base + envAmount*range (attack) -> sustain level (decay).
    const base = clamp(filter.cutoff, MIN_CUTOFF, MAX_CUTOFF)
    const peakCutoff = clamp(base + filter.envAmount * (MAX_CUTOFF - base), MIN_CUTOFF, MAX_CUTOFF)
    const sustainCutoff = clamp(
      base + filter.envAmount * filter.sustain * (MAX_CUTOFF - base),
      MIN_CUTOFF,
      MAX_CUTOFF,
    )
    this.filter.frequency.cancelScheduledValues(startTime)
    this.filter.frequency.setValueAtTime(base, startTime)
    this.filter.frequency.linearRampToValueAtTime(peakCutoff, startTime + Math.max(filter.attack, 0.001))
    this.filter.frequency.linearRampToValueAtTime(
      sustainCutoff,
      startTime + Math.max(filter.attack, 0.001) + Math.max(filter.decay, 0.001),
    )
  }

  /** Re-trigger this voice's envelopes in place (used when noteOn hits an already-sounding note). */
  retrigger(velocity: number) {
    this.velocity = velocity
    this.releasing = false
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout)
      this.stopTimeout = null
    }
    this.triggerEnvelopes(this.ctx.currentTime)
  }

  /** Apply a live parameter update to this already-sounding voice (smoothed, no clicks). */
  updateParams(params: SynthParams) {
    this.params = params
    const now = this.ctx.currentTime

    this.osc1.type = params.osc1Waveform
    this.osc2.type = params.osc2Waveform
    this.osc2.frequency.setTargetAtTime(midiToFreq(this.midiNote + params.osc2Octave * 12), now, SMOOTH_TIME)
    this.osc2.detune.setTargetAtTime(params.oscDetune, now, SMOOTH_TIME)

    this.osc1Gain.gain.setTargetAtTime(1 - params.oscMix, now, SMOOTH_TIME)
    this.osc2Gain.gain.setTargetAtTime(params.oscMix, now, SMOOTH_TIME)

    this.filter.Q.setTargetAtTime(params.filter.resonance, now, SMOOTH_TIME)
    // Note: we intentionally do not re-trigger the filter/amp envelopes here —
    // base cutoff/ADSR timings take effect on the next noteOn/retrigger.
  }

  /** Begin the release phase (amp + filter envelopes ramp to 0 / base, then the voice stops itself). */
  release() {
    if (this.releasing) return
    this.releasing = true

    const now = this.ctx.currentTime
    const { amp, filter } = this.params

    this.ampGain.gain.cancelScheduledValues(now)
    this.ampGain.gain.setValueAtTime(this.ampGain.gain.value, now)
    this.ampGain.gain.linearRampToValueAtTime(0, now + Math.max(amp.release, 0.001))

    this.filter.frequency.cancelScheduledValues(now)
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now)
    this.filter.frequency.linearRampToValueAtTime(
      clamp(filter.cutoff, MIN_CUTOFF, MAX_CUTOFF),
      now + Math.max(filter.release, 0.001),
    )

    const stopAt = now + Math.max(amp.release, filter.release, 0.001) + 0.05
    this.osc1.stop(stopAt)
    this.osc2.stop(stopAt)

    this.stopTimeout = setTimeout(() => this.stop(), (stopAt - now) * 1000)
  }

  /** Whether this voice has begun releasing (used by the engine's voice-stealing logic). */
  get isReleasing(): boolean {
    return this.releasing
  }

  /** Immediately stop and disconnect all nodes belonging to this voice. */
  stop() {
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout)
      this.stopTimeout = null
    }
    try {
      this.osc1.stop()
    } catch {
      // already stopped
    }
    try {
      this.osc2.stop()
    } catch {
      // already stopped
    }
    this.osc1.disconnect()
    this.osc2.disconnect()
    this.osc1Gain.disconnect()
    this.osc2Gain.disconnect()
    this.pitchModGain.disconnect()
    this.filter.disconnect()
    this.ampGain.disconnect()
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
