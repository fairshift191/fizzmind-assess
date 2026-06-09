/**
 * GeminiLiveAdapter — Gemini Flash Live 3.1 voice adapter.
 *
 * Adapted from the Fairshift kiosk voice engine.
 * Stripped: backend API calls, recording, session tracking.
 *
 * Architecture:
 *   Browser <── WebSocket ──> Gemini Live (90+ languages, voice-to-voice)
 *     ├── Audio output → speakers (WebAudio scheduled playback)
 *     ├── Text output → subtitles + transcripts
 *     ├── Tool calls → assessment state updates
 *     └── Web Speech API → parallel visitor STT
 */

const GEMINI_WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

const LANG_TO_BCP47 = {
  en: 'en-US', ar: 'ar-SA', hi: 'hi-IN', fr: 'fr-FR', es: 'es-ES',
  de: 'de-DE', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', pt: 'pt-BR',
  it: 'it-IT', ru: 'ru-RU', tr: 'tr-TR', nl: 'nl-NL', ta: 'ta-IN',
  te: 'te-IN', th: 'th-TH', vi: 'vi-VN', ms: 'ms-MY', bn: 'bn-BD',
}

export class GeminiLiveAdapter {
  constructor() {
    this.ws = null
    this.apiKey = null
    this.model = 'gemini-3.1-flash-live-preview'
    this.systemPrompt = ''

    // Callbacks
    this._onTextResponse = null
    this._onToolCall = null
    this._onSpeakingChange = null
    this._onListeningChange = null
    this._onConnectionState = null

    // Reconnect state
    this._voiceName = null
    this._reconnectAttempt = 0
    this._reconnectTimer = null
    this._maxReconnectAttempts = 5
    this._userInitiatedClose = false

    // Audio
    this._audioContext = null
    this._micStream = null
    this._micProcessor = null
    this._outputAudioCtx = null
    this._masterGain = null
    this._nextPlayTime = 0
    this._outputSampleRate = 24000

    // STT
    this._recognition = null
    this._isSpeakingAI = false

    // State
    this._setupReady = false
    this._greetingQueued = false
    this._greetingTriggered = false
    this._destroyed = false
    this._language = 'en'
    this._greetingMessage = null
  }

  // ─── Connection ───────────────────────────────────────────────────────

  async connect({ apiKey, model, voiceName, systemPrompt, language, tools, greetingMessage }) {
    this.apiKey = apiKey
    this.model = model || 'gemini-3.1-flash-live-preview'
    this.systemPrompt = systemPrompt || ''
    this._language = language || 'en'
    this._tools = tools || []
    this._greetingMessage = greetingMessage || 'A visitor has just approached. Greet them warmly and ask how you can help.'
    this._voiceName = voiceName || 'Puck'

    if (!this.apiKey) {
      console.error('[GeminiLive] No API key, voice disabled')
      return
    }

    // Guard against double-connect (React StrictMode mounts twice in dev)
    if (this.ws) {
      console.warn('[GeminiLive] Already connected, ignoring duplicate connect()')
      return
    }

    // Create output AudioContext NOW while user gesture context is still active.
    this._outputAudioCtx = new AudioContext({ sampleRate: this._outputSampleRate })
    this._outputAudioCtx.resume()
    this._nextPlayTime = 0

    // Master gain. AI audio flows through this to speakers.
    this._masterGain = this._outputAudioCtx.createGain()
    this._masterGain.gain.value = 1
    this._masterGain.connect(this._outputAudioCtx.destination)

    this._openWebSocket({ isReconnect: false })

    // Start microphone
    await this._startMic()

    // Start Web Speech for visitor transcription
    this._startWebSpeech()
  }

  _openWebSocket({ isReconnect }) {
    if (this._destroyed) return
    if (isReconnect) {
      // On reconnect we are re-establishing setup. Block mic and greeting until setupComplete arrives.
      this._setupReady = false
      console.log(`[GeminiLive] Reconnecting (attempt ${this._reconnectAttempt}/${this._maxReconnectAttempts}), model:`, this.model)
      this._onConnectionState?.({ state: 'reconnecting', attempt: this._reconnectAttempt, max: this._maxReconnectAttempts })
    } else {
      console.log('[GeminiLive] Connecting, model:', this.model)
      this._onConnectionState?.({ state: 'connecting' })
    }

    const url = `${GEMINI_WS_BASE}?key=${this.apiKey}`
    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      if (this.ws !== ws || this._destroyed) return
      console.log('[GeminiLive] WebSocket opened, sending setup')
      const setupMsg = {
        setup: {
          model: `models/${this.model}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: this._voiceName } },
            },
          },
          systemInstruction: {
            parts: [{ text: this.systemPrompt }],
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
              endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
              prefixPaddingMs: 200,
              silenceDurationMs: 1500,
            },
          },
        },
      }
      if (this._tools.length > 0) {
        setupMsg.setup.tools = [{ functionDeclarations: this._tools }]
      }
      ws.send(JSON.stringify(setupMsg))
    }

    ws.onmessage = (event) => {
      // Any successful message confirms the connection is healthy. Reset the reconnect counter.
      if (this._reconnectAttempt > 0) {
        console.log('[GeminiLive] Connection recovered')
        this._reconnectAttempt = 0
        this._onConnectionState?.({ state: 'connected' })
      }
      this._handleMessage(event)
    }

    ws.onerror = (err) => {
      console.error('[GeminiLive] WebSocket error:', err)
    }

    ws.onclose = (ev) => {
      console.warn('[GeminiLive] WebSocket closed, code:', ev.code, 'reason:', ev.reason)
      if (this.ws !== ws) return // a newer ws replaced this one, ignore
      this.ws = null

      if (this._destroyed || this._userInitiatedClose) {
        this._onConnectionState?.({ state: 'closed' })
        return
      }

      // Unexpected close mid-conversation. Try to reconnect.
      if (this._reconnectAttempt >= this._maxReconnectAttempts) {
        console.error('[GeminiLive] Max reconnect attempts reached, giving up')
        this._onConnectionState?.({ state: 'failed' })
        return
      }

      this._reconnectAttempt += 1
      const delayMs = Math.min(1000 * Math.pow(2, this._reconnectAttempt - 1), 16000)
      console.log(`[GeminiLive] Scheduling reconnect in ${delayMs}ms (attempt ${this._reconnectAttempt}/${this._maxReconnectAttempts})`)
      this._onConnectionState?.({ state: 'reconnect_pending', attempt: this._reconnectAttempt, max: this._maxReconnectAttempts, delayMs })

      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = setTimeout(() => {
        if (this._destroyed) return
        this._openWebSocket({ isReconnect: true })
      }, delayMs)
    }
  }

  disconnect() {
    this._destroyed = true
    this._userInitiatedClose = true
    clearTimeout(this._reconnectTimer)
    this._reconnectTimer = null
    if (this.ws) {
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      try { this.ws.close() } catch {}
      this.ws = null
    }
    try { this._recognition?.stop() } catch {}
    this._recognition = null
    this._micStream?.getTracks().forEach(t => t.stop())
    try { this._audioContext?.close() } catch {}
    try { this._outputAudioCtx?.close() } catch {}
    this._onTextResponse = null
    this._onSpeakingChange = null
    this._onListeningChange = null
    this._onToolCall = null
    this._onConnectionState = null
  }

  // ─── Greeting ─────────────────────────────────────────────────────────

  triggerGreeting() {
    if (this._greetingTriggered) return
    this._greetingTriggered = true

    if (this._setupReady) {
      this._sendGreetingTrigger()
    } else {
      this._greetingQueued = true
    }
  }

  _sendGreetingTrigger() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    console.log('[GeminiLive] triggerGreeting — sending')
    this.ws.send(JSON.stringify({
      realtimeInput: {
        text: this._greetingMessage,
      },
    }))
  }

  // ─── Handle incoming messages ─────────────────────────────────────────

  _handleMessage(event) {
    if (this._destroyed) return

    let msg
    try {
      if (typeof event.data === 'string') {
        msg = JSON.parse(event.data)
      } else if (event.data instanceof Blob) {
        event.data.text().then(text => {
          try {
            const parsed = JSON.parse(text)
            this._handleParsedMessage(parsed)
          } catch (e) { console.warn('[GeminiLive] blob parse failed', e) }
        })
        return
      } else {
        return
      }
    } catch { return }

    this._handleParsedMessage(msg)
  }

  _handleParsedMessage(msg) {

    // Setup complete
    if (msg.setupComplete) {
      console.log('[GeminiLive] setupComplete')
      this._setupReady = true
      this._onConnectionState?.({ state: 'connected' })
      if (!this._greetingTriggered) {
        this._greetingTriggered = true
        this._sendGreetingTrigger()
      }
      return
    }

    // Server content (audio + text)
    if (msg.serverContent) {
      const parts = msg.serverContent.modelTurn?.parts || []
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) {
          this._isSpeakingAI = true
          this._onSpeakingChange?.(true)
          this._playAudioChunk(part.inlineData.data)
        }

        if (part.text) {
          this._onTextResponse?.({ type: 'delta', text: part.text })
        }
      }

      // Output transcription (what Gemini said, as text)
      if (msg.serverContent.outputTranscription?.text) {
        this._onTextResponse?.({ type: 'delta', text: msg.serverContent.outputTranscription.text })
      }

      // Turn complete
      if (msg.serverContent.turnComplete) {
        this._isSpeakingAI = false
        this._onSpeakingChange?.(false)
        this._onTextResponse?.({ type: 'done', text: '' })
        setTimeout(() => this._resetPlaybackClock(), 500)
      }

      // Interrupted
      if (msg.serverContent.interrupted) {
        this._resetPlaybackClock()
        this._isSpeakingAI = false
        this._onSpeakingChange?.(false)
      }
    }

    // Tool calls
    if (msg.toolCall) {
      this._handleToolCalls(msg.toolCall.functionCalls || [])
    }
  }

  // All tools ACK immediately — no backend round-trip needed
  _handleToolCalls(functionCalls) {
    for (const call of functionCalls) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          toolResponse: {
            functionResponses: [{
              id: call.id, name: call.name, response: { output: { ok: true } },
            }],
          },
        }))
      }
      this._onToolCall?.({ tool: call.name, args: call.args || {} })
    }
  }

  // ─── Microphone ───────────────────────────────────────────────────────

  async _startMic() {
    try {
      this._micStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      this._audioContext = new AudioContext({ sampleRate: 16000 })
      const source = this._audioContext.createMediaStreamSource(this._micStream)
      this._micProcessor = this._audioContext.createScriptProcessor(2048, 1, 1)

      this._micProcessor.onaudioprocess = (e) => {
        const outBuf = e.outputBuffer.getChannelData(0)
        outBuf.fill(0)

        if (this._destroyed) return
        if (!this._setupReady) return
        if (this._isSpeakingAI) return
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
        try {
          const pcm = e.inputBuffer.getChannelData(0)
          const int16 = new Int16Array(pcm.length)
          for (let i = 0; i < pcm.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, pcm[i] * 32768))
          }
          const bytes = new Uint8Array(int16.buffer)
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
          }
          const base64 = btoa(binary)
          this.ws.send(JSON.stringify({
            realtimeInput: {
              audio: { mimeType: 'audio/pcm;rate=16000', data: base64 },
            },
          }))
        } catch (err) {
          console.warn('[GeminiLive] mic send failed:', err.message)
        }
      }

      source.connect(this._micProcessor)
      const silentGain = this._audioContext.createGain()
      silentGain.gain.value = 0
      this._micProcessor.connect(silentGain)
      silentGain.connect(this._audioContext.destination)
    } catch (err) {
      console.warn('[GeminiLive] Mic unavailable:', err.message)
    }
  }

  // ─── Audio playback ───────────────────────────────────────────────────

  _playAudioChunk(base64Data) {
    if (this._destroyed) return
    if (!this._outputAudioCtx || this._outputAudioCtx.state === 'closed') return

    const raw = atob(base64Data)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    const int16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768

    const buffer = this._outputAudioCtx.createBuffer(1, float32.length, this._outputSampleRate)
    buffer.getChannelData(0).set(float32)

    const source = this._outputAudioCtx.createBufferSource()
    source.buffer = buffer

    const now = this._outputAudioCtx.currentTime
    if (this._nextPlayTime < now) this._nextPlayTime = now + 0.02

    source.connect(this._masterGain)
    source.start(this._nextPlayTime)
    this._nextPlayTime += buffer.duration
  }

  _resetPlaybackClock() {
    this._nextPlayTime = 0
  }

  // ─── Web Speech (visitor transcription) ───────────────────────────────

  _startWebSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = LANG_TO_BCP47[this._language] || 'en-US'

    rec.onstart = () => this._onListeningChange?.(true)
    rec.onend = () => {
      this._onListeningChange?.(false)
      if (!this._destroyed) setTimeout(() => this._restartWebSpeech(), 300)
    }
    rec.onresult = (e) => {
      if (this._isSpeakingAI) return
      const result = e.results[e.results.length - 1]
      const text = result[0].transcript.trim()
      if (!text) return

      if (result.isFinal) {
        this._onTextResponse?.({ type: 'visitor', text })
      } else {
        this._onTextResponse?.({ type: 'visitor_interim', text })
      }
    }
    rec.onerror = () => {}

    this._recognition = rec
    this._restartWebSpeech()
  }

  _restartWebSpeech() {
    if (this._destroyed || !this._recognition) return
    try { this._recognition.start() } catch {}
  }

  // ─── Callbacks ────────────────────────────────────────────────────────

  onTextResponse(cb) { this._onTextResponse = cb }
  onSpeakingChange(cb) { this._onSpeakingChange = cb }
  onListeningChange(cb) { this._onListeningChange = cb }
  onToolCall(cb) { this._onToolCall = cb }
  onConnectionState(cb) { this._onConnectionState = cb }
}

export default GeminiLiveAdapter
