import type { LfoParams } from './types.ts'

const SMOOTH_TIME = 0.02

/**
 * A single global low-frequency oscillator. It runs continuously (started once,
 * never stopped) and its output gain represents `depth`. The engine connects
 * this Lfo's output to whichever voice AudioParam matches `target`
 * ('pitch' detune or 'filter' cutoff) and reconnects whenever the target changes.
 */
export class Lfo {
  private ctx: AudioContext
  private osc: OscillatorNode
  private depthGain: GainNode
  private connectedParams = new Set<AudioParam>()

  constructor(ctx: AudioContext, params: LfoParams) {
    this.ctx = ctx
    this.osc = new OscillatorNode(ctx, { type: params.waveform, frequency: params.rate })
    this.depthGain = new GainNode(ctx, { gain: params.target === 'off' ? 0 : params.depth })
    this.osc.connect(this.depthGain)
    this.osc.start()
  }

  /** Connect this LFO's modulation output into a target AudioParam (e.g. a voice's filter frequency or pitch mod gain). */
  connect(targetParam: AudioParam) {
    this.depthGain.connect(targetParam)
    this.connectedParams.add(targetParam)
  }

  /** Disconnect this LFO from a specific previously-connected target, or from everything if omitted. */
  disconnect(targetParam?: AudioParam) {
    if (targetParam) {
      try {
        this.depthGain.disconnect(targetParam)
      } catch {
        // wasn't connected; ignore
      }
      this.connectedParams.delete(targetParam)
      return
    }
    this.depthGain.disconnect()
    this.connectedParams.clear()
  }

  /** Apply updated LFO params (smoothed rate/depth, instant waveform change). */
  setParams(params: LfoParams) {
    const now = this.ctx.currentTime
    this.osc.type = params.waveform
    this.osc.frequency.setTargetAtTime(params.rate, now, SMOOTH_TIME)
    const effectiveDepth = params.target === 'off' ? 0 : params.depth
    this.depthGain.gain.setTargetAtTime(effectiveDepth, now, SMOOTH_TIME)
  }

  /** Stop the oscillator and disconnect everything (used on engine dispose). */
  dispose() {
    this.disconnect()
    try {
      this.osc.stop()
    } catch {
      // already stopped
    }
    this.osc.disconnect()
  }
}
