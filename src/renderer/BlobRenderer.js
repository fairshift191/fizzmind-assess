/**
 * BlobRenderer — Premium minimalist AI presence
 *
 * A luminous, breathing orb with concentric rings that reacts
 * to audio amplitude. Inspired by high-end voice assistants.
 *
 * Visual language:
 *   idle      — slow breathing glow, faint outer ring rotation
 *   speaking  — amplitude-reactive ring expansion + core pulse
 *   listening — subtle ring contraction, inner core brightens
 */

export class BlobRenderer {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.animFrame = null
    this.analyser = null
    this.audioContext = null
    this.mode = 'idle'
    this.brandColor = '#D4A853'
    this.time = 0
    this.amplitude = 0
    this.targetAmplitude = 0
    this._mounted = false
    this._pcmQueue = []

    // Layout
    this.orbRadius = 0
    this.cx = 0
    this.cy = 0
    this._isCorner = false
  }

  mount(container) {
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
    container.appendChild(this.canvas)
    this._mounted = true

    this._setupAudio()
    this._resize()
    window.addEventListener('resize', this._onResize = () => this._resize())
    this._loop()
  }

  feedAudio(pcmData) {
    this._pcmQueue.push(pcmData)
    this._processPcmQueue()
  }

  resize(mode) {
    if (!this.canvas) return
    if (mode === 'hidden') {
      this.canvas.style.display = 'none'
    } else {
      this.canvas.style.display = 'block'
      this._isCorner = mode === 'small'
      this._updateLayout()
    }
  }

  setTheme({ primary }) {
    if (primary) this.brandColor = primary
  }

  getStatus() {
    return this._mounted ? 'connected' : 'failed'
  }

  destroy() {
    this._mounted = false
    cancelAnimationFrame(this.animFrame)
    window.removeEventListener('resize', this._onResize)
    if (this.audioContext) this.audioContext.close().catch(() => {})
    if (this.canvas) this.canvas.remove()
  }

  setSpeaking(speaking) {
    this.mode = speaking ? 'speaking' : 'idle'
  }

  setListening(listening) {
    if (listening) this.mode = 'listening'
    else if (this.mode === 'listening') this.mode = 'idle'
  }

  // ─── Audio ────────────────────────────────────────────────────────────────

  _setupAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      })
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.82
      const silentGain = this.audioContext.createGain()
      silentGain.gain.value = 0
      this.analyser.connect(silentGain)
      silentGain.connect(this.audioContext.destination)
    } catch {}
  }

  _processPcmQueue() {
    if (!this.audioContext || !this.analyser) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {})
    }

    while (this._pcmQueue.length > 0) {
      const pcm = this._pcmQueue.shift()
      try {
        const int16 = new Int16Array(pcm)
        const float32 = new Float32Array(int16.length)
        for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768

        const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000)
        audioBuffer.copyToChannel(float32, 0)
        const source = this.audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(this.analyser)
        source.start()
      } catch {}
    }
  }

  _getAmplitude() {
    if (!this.analyser) return 0
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    const sum = data.reduce((a, b) => a + b, 0)
    return sum / (data.length * 255)
  }

  // ─── Layout ───────────────────────────────────────────────────────────────

  _resize() {
    if (!this.canvas) return
    const { width, height } = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.ctx = this.canvas.getContext('2d')
    this.ctx.scale(dpr, dpr)
    this._updateLayout()
  }

  _updateLayout() {
    const dpr = window.devicePixelRatio || 1
    const w = this.canvas.width / dpr
    const h = this.canvas.height / dpr

    if (this._isCorner) {
      this.orbRadius = Math.min(w, h) * 0.1
      this.cx = w - this.orbRadius - 40
      this.cy = h - this.orbRadius - 40
    } else {
      this.orbRadius = Math.min(w, h) * 0.14
      this.cx = w / 2
      this.cy = h / 2
    }
  }

  // ─── Render loop ──────────────────────────────────────────────────────────

  _loop() {
    if (!this._mounted) return
    this.animFrame = requestAnimationFrame(() => this._loop())
    this.time += 0.016

    this.targetAmplitude = this._getAmplitude()
    this.amplitude += (this.targetAmplitude - this.amplitude) * 0.12

    this._draw()
  }

  _draw() {
    const dpr = window.devicePixelRatio || 1
    const w = this.canvas.width / dpr
    const h = this.canvas.height / dpr
    const ctx = this.ctx
    if (!ctx) return

    ctx.clearRect(0, 0, w, h)

    const amp = this.amplitude
    const t = this.time
    const r = this.orbRadius
    const cx = this.cx
    const cy = this.cy

    const { r: cr, g: cg, b: cb } = this._hexToRgb(this.brandColor)
    const isSpeaking = this.mode === 'speaking'
    const isListening = this.mode === 'listening'

    const breathRate = isSpeaking ? 1.8 : 0.5
    const breath = Math.sin(t * breathRate) * 0.5 + 0.5

    // ── 1. Ambient glow ─────────────────────────────────────────────────
    const ambientR = r * (3.5 + amp * 2)
    const ambientOpacity = 0.04 + amp * 0.06 + breath * 0.02
    const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, ambientR)
    ambient.addColorStop(0, `rgba(${cr},${cg},${cb},${ambientOpacity})`)
    ambient.addColorStop(0.4, `rgba(${cr},${cg},${cb},${ambientOpacity * 0.3})`)
    ambient.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    ctx.fillStyle = ambient
    ctx.fillRect(0, 0, w, h)

    // ── 2. Outer rings ──────────────────────────────────────────────────
    const ringCount = isSpeaking ? 4 : 3
    for (let i = 0; i < ringCount; i++) {
      const ringExpand = isSpeaking ? amp * 0.6 : 0
      const ringR = r * (1.6 + i * 0.45 + ringExpand * (i + 1) * 0.2 + breath * 0.08)
      const ringOpacity = (0.06 - i * 0.012) * (1 + amp * 1.5)
      const rotation = t * (0.15 + i * 0.05) * (i % 2 === 0 ? 1 : -1)

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotation)

      ctx.beginPath()
      ctx.arc(0, 0, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${ringOpacity})`
      ctx.lineWidth = 1
      ctx.setLineDash([ringR * 0.12, ringR * 0.08])
      ctx.lineDashOffset = t * 20 * (i % 2 === 0 ? 1 : -1)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.restore()
    }

    // ── 3. Listening pulse ring ─────────────────────────────────────────
    if (isListening) {
      const pulsePhase = (t * 2) % (Math.PI * 2)
      const pulseR = r * (1.3 + Math.sin(pulsePhase) * 0.15)
      const pulseOpacity = 0.15 + Math.sin(pulsePhase) * 0.1
      ctx.beginPath()
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${pulseOpacity})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // ── 4. Core orb ─────────────────────────────────────────────────────
    const coreScale = 1 + breath * 0.06 + amp * 0.15
    const coreR = r * coreScale

    const coreGrad = ctx.createRadialGradient(
      cx - coreR * 0.15, cy - coreR * 0.15, 0,
      cx, cy, coreR
    )
    const centerBrightness = isSpeaking ? 0.95 : isListening ? 0.8 : 0.65
    const edgeBrightness = isSpeaking ? 0.5 : 0.25
    coreGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${centerBrightness})`)
    coreGrad.addColorStop(0.7, `rgba(${cr},${cg},${cb},${edgeBrightness})`)
    coreGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0.05)`)

    ctx.beginPath()
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
    ctx.fillStyle = coreGrad
    ctx.fill()

    // ── 5. Inner highlight ──────────────────────────────────────────────
    const hlGrad = ctx.createRadialGradient(
      cx - coreR * 0.3, cy - coreR * 0.35, 0,
      cx - coreR * 0.1, cy - coreR * 0.15, coreR * 0.6
    )
    const hlOpacity = 0.15 + amp * 0.1
    hlGrad.addColorStop(0, `rgba(255,255,255,${hlOpacity})`)
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
    ctx.fillStyle = hlGrad
    ctx.fill()

    // ── 6. Core edge ────────────────────────────────────────────────────
    ctx.beginPath()
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.15 + amp * 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()

    // ── 7. Speaking: amplitude bars (radial) ────────────────────────────
    if (isSpeaking && amp > 0.02) {
      const barCount = 32
      const data = this.analyser ? new Uint8Array(this.analyser.frequencyBinCount) : null
      if (data) this.analyser.getByteFrequencyData(data)

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2
        const freq = data ? data[Math.floor(i * data.length / barCount)] / 255 : amp
        const barLen = r * (0.3 + freq * 0.7) * amp * 2
        const innerR = coreR + r * 0.12
        const outerR = innerR + barLen

        const x1 = cx + Math.cos(angle) * innerR
        const y1 = cy + Math.sin(angle) * innerR
        const x2 = cx + Math.cos(angle) * outerR
        const y2 = cy + Math.sin(angle) * outerR

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.15 + freq * 0.25})`
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 212, g: 168, b: 83 }
  }
}

export default BlobRenderer
