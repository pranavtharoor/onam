/**
 * Optional ambient sound. Nothing here plays until the visitor explicitly turns
 * sound on (a user gesture), and the experience must be complete without it.
 *
 * Usage (when sound is introduced):
 *   await sound.enable()            // inside a click handler
 *   sound.play('chenda-roll', { volume: 0.4 })
 *   ScrollTrigger onEnter → sound.play(...); sound.fade('rain', 0, 1.2)
 */
type Cue = { buffer: AudioBuffer; gain?: GainNode; source?: AudioBufferSourceNode }

class SoundDirector {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private cues = new Map<string, Cue>()
  private sources = new Map<string, string>()
  enabled = false

  /** Declare cues up front; audio files live in public/media/audio/. Nothing is fetched yet. */
  register(name: string, url: string) {
    this.sources.set(name, url)
  }

  /** Must be called from a user gesture. Loads registered cues lazily. */
  async enable() {
    this.ctx ??= new AudioContext()
    await this.ctx.resume()
    this.master ??= this.ctx.createGain()
    this.master.connect(this.ctx.destination)
    this.enabled = true
    await Promise.all([...this.sources].map(([name, url]) => this.load(name, url)))
  }

  disable() {
    this.enabled = false
    this.cues.forEach((cue) => cue.source?.stop())
    void this.ctx?.suspend()
  }

  play(name: string, { volume = 1, loop = false } = {}) {
    const cue = this.cues.get(name)
    if (!this.enabled || !this.ctx || !this.master || !cue) return
    cue.source?.stop()
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    const source = this.ctx.createBufferSource()
    source.buffer = cue.buffer
    source.loop = loop
    source.connect(gain).connect(this.master)
    source.start()
    cue.source = source
    cue.gain = gain
  }

  fade(name: string, to: number, seconds = 1) {
    const cue = this.cues.get(name)
    if (!this.ctx || !cue?.gain) return
    cue.gain.gain.linearRampToValueAtTime(to, this.ctx.currentTime + seconds)
  }

  private async load(name: string, url: string) {
    if (this.cues.has(name) || !this.ctx) return
    const data = await fetch(url).then((r) => r.arrayBuffer())
    this.cues.set(name, { buffer: await this.ctx.decodeAudioData(data) })
  }
}

export const sound = new SoundDirector()
