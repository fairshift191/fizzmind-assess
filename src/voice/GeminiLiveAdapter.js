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

/**
 * ⚠ 30 Sept: 'gemini-3.1-flash-live-preview' spoke its first sentence and then
 * failed as soon as the student answered, with "1011 Internal error
 * encountered" (or no reply at all), in three runs out of three. The page then
 * retried with growing pauses of up to 16 s, restarting the conversation each
 * time: the "lag after the first sentence" and the dropped call. Measured on
 * the same key, prompt and tools, 'gemini-3.8-live' started speaking in about
 * 1.1 s, answered 2.5 s after the student stopped, with no gaps, every time.
 */
const LIVE_MODEL = 'gemini-3.8-live'

const GEMINI_WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

const LANG_TO_BCP47 = {
  en: 'en-US', ar: 'ar-SA', hi: 'hi-IN', fr: 'fr-FR', es: 'es-ES',
  de: 'de-DE', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', pt: 'pt-BR',
  it: 'it-IT', ru: 'ru-RU', tr: 'tr-TR', nl: 'nl-NL', ta: 'ta-IN',
  te: 'te-IN', th: 'th-TH', vi: 'vi-VN', ms: 'ms-MY', bn: 'bn-BD',
}

/**
 * ⚠ TAKING TURNS, for every call on this adapter.
 *
 * Ganan, 28 Sept: Nova "spoke continuously without waiting for him to speak".
 * Two causes, both fixed here rather than in thirty call scripts:
 *  1. Every call's opening trigger carried the WHOLE plan for the call, and the
 *     model read "say all of this" as its first turn. The trigger now says the
 *     plan is for the whole call and only the opening is said now.
 *  2. The microphone re-opened when the SERVER finished the turn, while
 *     seconds of Nova's voice were still queued in the speakers. Nova heard
 *     herself, took it for the student, and carried on. The mic now stays shut
 *     until the speakers have actually finished (see _releaseAfterPlayback).
 */
const TURN_TAKING = `

═══════════════════════════════════════
⚠⚠ HOW YOU TAKE TURNS. THIS OVERRIDES EVERYTHING ABOVE IT.
═══════════════════════════════════════
- This is a conversation, not a speech. Say ONE or TWO short sentences, then STOP and let the other person speak.
- End almost every turn with ONE question, and then wait for the answer. Never ask two questions in one turn.
- NEVER cover two parts of your plan in one turn. One point, one question, wait.
- The plan above is for the WHOLE call. Work through it one small step at a time, in reply to what they say.
- If they are quiet, WAIT. Do not fill the silence with more. If it goes on a long time, ask once, gently, whether they are still there.
- If they start talking, you have finished. Listen to all of it before you reply.
- ⚠ NEVER say, read out or spell out JSON, code, curly brackets, field names or the notes you keep about the call. Everything you say is heard by a person. Your end-of-call notes go ONLY through the completion tool, called silently, and ONLY when the call is really over.`

const OPENING_ONLY = `

(The instructions above are your plan for the WHOLE call, to be covered one small step at a time. Right now say ONLY your opening: greet them in one or two short sentences and ask ONE question. Then stop and wait for their answer.)`

/**
 * Down to 16 kHz by averaging. Good enough for speech, and it cannot fail the
 * way asking the browser for a 16 kHz AudioContext does.
 */
function to16k(input, rate) {
  if (rate === 16000) return input
  const ratio = rate / 16000
  const out = new Float32Array(Math.floor(input.length / ratio))
  for (let i = 0; i < out.length; i++) {
    const from = Math.round(i * ratio)
    const to = Math.min(input.length, Math.round((i + 1) * ratio))
    let sum = 0
    for (let j = from; j < to; j++) sum += input[j]
    out[i] = to > from ? sum / (to - from) : 0
  }
  return out
}

/**
 * ⚠ Nova cannot speak unless something reaches her. If the student's audio
 * never arrives, she waits in silence forever and the student hears a dead
 * line. On 30 Sept Ganan heard one sentence and then nothing. So after a long
 * silence on the student's turn, the app tells her, and she says so out loud.
 */
const DEAD_MIC_CUE = '(System note, not from the student: no sound at all is reaching you from their microphone. In one short sentence, tell them you cannot hear them, and ask them to check the microphone is allowed for this page and not muted. Then wait.)'
const QUIET_CUE = '(System note, not from the student: they have not answered for a while. In one short sentence, check gently whether they can hear you. Then wait.)'

export class GeminiLiveAdapter {
  constructor() {
    this.ws = null
    this.apiKey = null
    this.model = LIVE_MODEL
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
    this._releaseTimer = null

    // Is the student's microphone actually reaching Nova? Measured, not assumed.
    this._micState = 'starting'   // starting | live | unavailable
    this._micRate = null
    this._micStartedAt = 0
    this._soundAt = 0             // last time the mic carried any sound at all
    this._voiceAt = 0             // last time it carried something speech-loud
    this._micPeak = 0
    this._micSent = 0
    this._turnEndedAt = 0         // when the floor passed to the student
    this._nudged = false
    this._nudges = 0
    this._novaTurns = 0
    this._closes = []
    this._micProblem = null
    // ⚠ 1 Oct: a call "disconnected" with the line still up and four turns in
    // three minutes, and nothing said who had gone quiet. The last 40 events,
    // in seconds from the start, answer that next time.
    this._t0 = Date.now()
    this._events = []
    this._watchTimer = null

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
    this.model = model || LIVE_MODEL
    this.systemPrompt = (systemPrompt || '') + TURN_TAKING
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
      this._closes.push(`${ev.code}${ev.reason ? ' ' + ev.reason : ''}`)
      this._ev(`line closed ${ev.code}`)
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
    clearInterval(this._watchTimer)
    clearTimeout(this._releaseTimer)
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
    this._onMicProblem = null
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
        text: this._greetingMessage + OPENING_ONLY,
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
      if (!this._watchTimer) this._watchTimer = setInterval(() => this._watch(), 1000)
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
          clearTimeout(this._releaseTimer)
          this._turnEndedAt = 0
          if (!this._isSpeakingAI) this._ev('Nova speaks')
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
        this._novaTurns++
        this._onTextResponse?.({ type: 'done', text: '' })
        this._releaseAfterPlayback()
      }

      // Interrupted
      if (msg.serverContent.interrupted) {
        clearTimeout(this._releaseTimer)
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
      // ⚠ Capture at the DEVICE's rate and convert to 16 kHz here. Asking the
      // browser for a 16 kHz AudioContext is refused outright by Firefox and
      // known to give silence on Safari, which is every browser on an iPhone
      // or iPad, and the failure was swallowed: the call went on with a mic
      // that sent nothing.
      this._micStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      this._audioContext = new AudioContext()
      try { await this._audioContext.resume() } catch {}
      const rate = this._audioContext.sampleRate
      this._micRate = rate
      const source = this._audioContext.createMediaStreamSource(this._micStream)
      this._micProcessor = this._audioContext.createScriptProcessor(4096, 1, 1)
      this._micState = 'live'
      this._micStartedAt = Date.now()

      this._micProcessor.onaudioprocess = (e) => {
        const outBuf = e.outputBuffer.getChannelData(0)
        outBuf.fill(0)

        if (this._destroyed) return
        const input = e.inputBuffer.getChannelData(0)
        let peak = 0
        for (let i = 0; i < input.length; i++) {
          const v = input[i] < 0 ? -input[i] : input[i]
          if (v > peak) peak = v
        }
        const now = Date.now()
        if (peak > this._micPeak) this._micPeak = peak
        if (peak > 0.0005) this._soundAt = now
        if (peak > 0.02) {
          if (now - this._voiceAt > 1500 && !this._isSpeakingAI) this._ev('student speaks')
          this._voiceAt = now
        }

        if (!this._setupReady) return
        if (this._isSpeakingAI) return
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
        try {
          const pcm = to16k(input, rate)
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
          this._micSent++
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
      this._micState = 'unavailable'
      this._micError = err.name || err.message
      this._setMicProblem('unavailable')
    }
  }

  _ev(e) {
    this._events.push(`${Math.round((Date.now() - this._t0) / 1000)}s ${e}`)
    if (this._events.length > 40) this._events.shift()
  }

  _setMicProblem(p) {
    if (p === this._micProblem) return
    this._micProblem = p
    this._onMicProblem?.(p)
  }

  /**
   * Once a second, on the student's turn: is their microphone reaching Nova,
   * and has the line gone quiet for too long?
   */
  _watch() {
    if (this._destroyed || !this._setupReady || this._isSpeakingAI) return
    const now = Date.now()
    const dead = this._micState === 'unavailable'
      || (this._micState === 'live' && now - Math.max(this._soundAt, this._micStartedAt) > 6000)
    this._setMicProblem(this._micState === 'unavailable' ? 'unavailable' : dead ? 'silent' : null)

    if (this._turnEndedAt && !this._nudged && this._nudges < 3
        && now - this._turnEndedAt > 12000 && now - this._voiceAt > 4000
        && this.ws?.readyState === WebSocket.OPEN) {
      this._nudged = true
      this._nudges++
      this._ev(dead ? 'cue: no sound from the mic' : 'cue: student quiet')
      this.ws.send(JSON.stringify({ realtimeInput: { text: dead ? DEAD_MIC_CUE : QUIET_CUE } }))
    }
  }

  /** What happened on this call, for the record. */
  diagnostics() {
    return {
      mic: this._micState, micError: this._micError ?? null, micRate: this._micRate,
      micPeak: Math.round(this._micPeak * 1000) / 1000, micChunksSent: this._micSent,
      novaTurns: this._novaTurns, nudges: this._nudges,
      closes: this._closes.slice(-5), reconnects: this._reconnectAttempt,
      timeline: this._events.slice(),
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

  /**
   * Hand the floor back only when the speakers have gone quiet.
   *
   * ⚠ The server says a turn is complete as soon as it has SENT the audio,
   * which is often several seconds before that audio has finished PLAYING.
   * Opening the mic at that moment let Nova's own voice back in through the
   * speakers; the model heard it as the student and kept talking. So: wait for
   * the queued audio to finish, plus a short tail for the room to go quiet.
   */
  _releaseAfterPlayback() {
    clearTimeout(this._releaseTimer)
    const ctx = this._outputAudioCtx
    const left = ctx && ctx.state !== 'closed'
      ? Math.max(0, this._nextPlayTime - ctx.currentTime) : 0
    this._releaseTimer = setTimeout(() => {
      if (this._destroyed) return
      this._ev('student\'s turn')
      this._turnEndedAt = Date.now()
      this._nudged = false
      this._isSpeakingAI = false
      this._onSpeakingChange?.(false)
      this._resetPlaybackClock()
    }, left * 1000 + 400)
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
  onMicProblem(cb) { this._onMicProblem = cb }
}

export default GeminiLiveAdapter
