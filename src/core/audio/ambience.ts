/**
 * Optional, procedural ambient sound. No audio files: every bed is synthesised
 * with WebAudio, so it costs a few KB and nothing downloads. Nothing plays until
 * the visitor turns sound on (a user gesture); the film is complete without it.
 *
 * Beds are mixed per scene (see MIX) and cross-faded as scenes become active.
 */
type Bed = 'water' | 'birds' | 'chenda' | 'rain' | 'hall'
const BEDS: Bed[] = ['water', 'birds', 'chenda', 'rain', 'hall']

const MIX: Record<string, Partial<Record<Bed, number>>> = {
  backwater: { water: 0.8 },
  paddy: { water: 0.2, birds: 0.9 },
  padippura: { birds: 0.5 },
  pookalam: { birds: 0.25, chenda: 0.7 },
  nadumuttam: { rain: 0.8 },
  'sadhya-row': { hall: 0.8 },
  'your-leaf': { hall: 0.3 },
}

class Ambience {
  enabled = false
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private gains = new Map<Bed, GainNode>()
  private scene = 'backwater'
  private listeners = new Set<(on: boolean) => void>()

  subscribe(fn: (on: boolean) => void) {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  /** Must be called from a click/tap. */
  async enable() {
    if (!this.ctx) this.build()
    await this.ctx!.resume()
    this.enabled = true
    this.master!.gain.setTargetAtTime(0.9, this.ctx!.currentTime, 0.6)
    this.apply()
    this.listeners.forEach((fn) => fn(true))
  }

  disable() {
    this.enabled = false
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25)
      window.setTimeout(() => { if (!this.enabled) void this.ctx?.suspend() }, 1200)
    }
    this.listeners.forEach((fn) => fn(false))
  }

  setScene(id: string) {
    this.scene = id
    this.apply()
  }

  private apply() {
    if (!this.ctx || !this.enabled) return
    const mix = MIX[this.scene] ?? {}
    for (const bed of BEDS) this.gains.get(bed)?.gain.setTargetAtTime(mix[bed] ?? 0, this.ctx.currentTime, 0.8)
  }

  private build() {
    const ctx = (this.ctx = new AudioContext())
    this.master = new GainNode(ctx, { gain: 0 })
    this.master.connect(ctx.destination)
    for (const bed of BEDS) {
      const g = new GainNode(ctx, { gain: 0 })
      g.connect(this.master)
      this.gains.set(bed, g)
    }
    const noise = this.noiseBuffer(4)

    // Water: brown-ish noise, low-passed, with a slow lapping swell.
    const lap = new GainNode(ctx, { gain: 0.35 })
    const lfo = new OscillatorNode(ctx, { frequency: 0.18 })
    lfo.connect(new GainNode(ctx, { gain: 0.2 })).connect(lap.gain)
    this.loop(noise).connect(new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 420 })).connect(lap).connect(this.gains.get('water')!)
    lfo.start()

    // Rain: a soft high hiss plus irregular drips from the eaves.
    this.loop(noise).connect(new BiquadFilterNode(ctx, { type: 'highpass', frequency: 3500 })).connect(new GainNode(ctx, { gain: 0.05 })).connect(this.gains.get('rain')!)
    this.every(180, 700, () => this.ping(this.gains.get('rain')!, 900 + Math.random() * 900, 0.18, 0.12))

    // Hall: a warm murmur (band-passed noise, breathing) and the odd clink of a ladle on brass.
    const breathe = new GainNode(ctx, { gain: 0.25 })
    const lfo2 = new OscillatorNode(ctx, { frequency: 0.31 })
    lfo2.connect(new GainNode(ctx, { gain: 0.12 })).connect(breathe.gain)
    this.loop(noise).connect(new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 520, Q: 0.8 })).connect(breathe).connect(this.gains.get('hall')!)
    lfo2.start()
    this.every(1400, 4200, () => {
      const f = 2100 + Math.random() * 500
      this.ping(this.gains.get('hall')!, f, 0.08, 0.9)
      this.ping(this.gains.get('hall')!, f * 1.52, 0.04, 0.7)
    })

    // Birds at dawn: short upward chirps in twos and threes.
    this.every(900, 3600, () => {
      const n = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < n; i++) this.chirp(this.gains.get('birds')!, ctx.currentTime + i * 0.13)
    })

    // Chenda, far away: ta-ta-TAM on a slow cycle, low-passed by distance.
    const far = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 1300 })
    far.connect(this.gains.get('chenda')!)
    this.every(2600, 2600, () => {
      const t = ctx.currentTime
      this.drum(far, t, 0.35)
      this.drum(far, t + 0.22, 0.35)
      this.drum(far, t + 0.44, 0.7)
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void ctx.suspend()
      else if (this.enabled) void ctx.resume()
    })
  }

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx!
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
    const data = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04
      data[i] = last * 3.2
    }
    return buf
  }

  private loop(buffer: AudioBuffer) {
    const src = new AudioBufferSourceNode(this.ctx!, { buffer, loop: true })
    src.start(0, Math.random() * buffer.duration)
    return src
  }

  /** Random-interval scheduler; only fires while sound is on and running. */
  private every(min: number, max: number, fn: () => void) {
    const tick = () => {
      if (this.enabled && this.ctx?.state === 'running') fn()
      window.setTimeout(tick, min + Math.random() * (max - min))
    }
    tick()
  }

  private ping(out: AudioNode, freq: number, level: number, decay: number) {
    const ctx = this.ctx!, t = ctx.currentTime
    const osc = new OscillatorNode(ctx, { frequency: freq })
    const g = new GainNode(ctx, { gain: 0 })
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + decay + 0.05)
  }

  private chirp(out: AudioNode, t: number) {
    const ctx = this.ctx!
    const osc = new OscillatorNode(ctx)
    const base = 2600 + Math.random() * 1400
    osc.frequency.setValueAtTime(base, t)
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.08)
    const g = new GainNode(ctx, { gain: 0 })
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.06, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.12)
  }

  private drum(out: AudioNode, t: number, level: number) {
    const ctx = this.ctx!
    const body = new OscillatorNode(ctx)
    body.frequency.setValueAtTime(170, t)
    body.frequency.exponentialRampToValueAtTime(80, t + 0.18)
    const g = new GainNode(ctx, { gain: 0 })
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level * 0.5, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    body.connect(g).connect(out)
    body.start(t)
    body.stop(t + 0.35)
    // Stick on skin: a short band-passed noise crack.
    const crack = new AudioBufferSourceNode(ctx, { buffer: this.noiseBuffer(0.1) })
    const cg = new GainNode(ctx, { gain: level * 0.4 })
    cg.gain.setValueAtTime(level * 0.4, t)
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    crack.connect(new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 1800, Q: 1.2 })).connect(cg).connect(out)
    crack.start(t)
  }
}

export const ambience = new Ambience()
