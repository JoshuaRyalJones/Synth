import type { FxParams } from './types.ts'

const SMOOTH_TIME = 0.02

/** How long (seconds) the generated reverb impulse response tail is. */
const IMPULSE_DURATION = 2
/** Exponential decay curve applied to the noise to make it sound like a room, not static. */
const IMPULSE_DECAY = 3

/**
 * Build a synthetic reverb impulse response: exponentially-decaying white
 * noise in both channels. This avoids needing to ship/load an audio file —
 * ConvolverNode just needs *some* buffer that sounds like a decaying space.
 */
function buildImpulseResponse(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * IMPULSE_DURATION)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)

  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      const t = i / length
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, IMPULSE_DECAY)
    }
  }

  return impulse
}

/**
 * Master FX chain shared by all voices:
 *
 *   input --+----------------------------------------> dry ----\
 *           |                                                    >--> masterGain --> destination
 *           +--> delay(+feedback) --> delayWet ---------------->/
 *           |                                                    /
 *           +--> convolver(reverb) --> reverbWet --------------->
 *
 * `input` is exposed so the engine can connect each voice's output here.
 */
export class Effects {
  /** Connect voice outputs (or anything else) to this node. */
  readonly input: GainNode

  private ctx: AudioContext
  private dryGain: GainNode

  private delay: DelayNode
  private delayFeedback: GainNode
  private delayWet: GainNode

  private convolver: ConvolverNode
  private reverbWet: GainNode

  private masterGain: GainNode

  constructor(ctx: AudioContext, destination: AudioNode, fx: FxParams, masterVolume: number) {
    this.ctx = ctx

    this.input = new GainNode(ctx)
    this.dryGain = new GainNode(ctx, { gain: 1 })

    this.delay = new DelayNode(ctx, { delayTime: fx.delayTime, maxDelayTime: 1 })
    this.delayFeedback = new GainNode(ctx, { gain: fx.delayFeedback })
    this.delayWet = new GainNode(ctx, { gain: fx.delayMix })

    this.convolver = new ConvolverNode(ctx, { buffer: buildImpulseResponse(ctx) })
    this.reverbWet = new GainNode(ctx, { gain: fx.reverbMix })

    this.masterGain = new GainNode(ctx, { gain: masterVolume })

    // Dry path.
    this.input.connect(this.dryGain).connect(this.masterGain)

    // Delay path (with feedback loop).
    this.input.connect(this.delay)
    this.delay.connect(this.delayFeedback)
    this.delayFeedback.connect(this.delay)
    this.delay.connect(this.delayWet)
    this.delayWet.connect(this.masterGain)

    // Reverb path.
    this.input.connect(this.convolver)
    this.convolver.connect(this.reverbWet)
    this.reverbWet.connect(this.masterGain)

    this.masterGain.connect(destination)
  }

  /** Apply updated fx params, smoothed to avoid clicks. */
  setParams(fx: FxParams) {
    const now = this.ctx.currentTime
    this.delay.delayTime.setTargetAtTime(fx.delayTime, now, SMOOTH_TIME)
    this.delayFeedback.gain.setTargetAtTime(fx.delayFeedback, now, SMOOTH_TIME)
    this.delayWet.gain.setTargetAtTime(fx.delayMix, now, SMOOTH_TIME)
    this.reverbWet.gain.setTargetAtTime(fx.reverbMix, now, SMOOTH_TIME)
  }

  /** Set master output volume, smoothed to avoid clicks. */
  setMasterVolume(volume: number) {
    this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, SMOOTH_TIME)
  }

  /** Disconnect everything (used on engine dispose). */
  dispose() {
    this.input.disconnect()
    this.dryGain.disconnect()
    this.delay.disconnect()
    this.delayFeedback.disconnect()
    this.delayWet.disconnect()
    this.convolver.disconnect()
    this.reverbWet.disconnect()
    this.masterGain.disconnect()
  }
}
