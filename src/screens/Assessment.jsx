import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GeminiLiveAdapter } from '../voice/GeminiLiveAdapter.js'
import { BlobRenderer } from '../renderer/BlobRenderer.js'
import { buildSystemPrompt, TOOL_DECLARATIONS } from '../assessment/prompt.js'
import SubtitleBar from '../ui/SubtitleBar.jsx'
import AssessmentProgress from '../ui/AssessmentProgress.jsx'

function Assessment({ config, onComplete }) {
  const rendererContainerRef = useRef(null)
  const rendererRef = useRef(null)
  const voiceAdapterRef = useRef(null)

  const [subtitleText, setSubtitleText] = useState('')
  const [visitorText, setVisitorText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  // Assessment state — populated by Gemini tool calls
  const [assessmentState, setAssessmentState] = useState({})
  const [recommendedCamp, setRecommendedCamp] = useState(null)
  const [recommendedTrack, setRecommendedTrack] = useState(null)
  const [assessmentSummary, setAssessmentSummary] = useState(null)

  // Ref to track completion to avoid double-fire
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    // Grace period — let final audio play out
    setTimeout(() => {
      const adapter = voiceAdapterRef.current
      const renderer = rendererRef.current
      if (adapter) { adapter.disconnect(); voiceAdapterRef.current = null }
      if (renderer) { renderer.destroy(); rendererRef.current = null }

      onComplete({
        studentName: config.studentName,
        email: config.email,
        assessmentState,
        recommendedCamp,
        recommendedTrack,
        summary: assessmentSummary,
      })
    }, 3000)
  }, [config, assessmentState, recommendedCamp, recommendedTrack, assessmentSummary, onComplete])

  // ─── Init voice + renderer ──────────────────────────────────────────

  useEffect(() => {
    if (!rendererContainerRef.current) return
    let destroyed = false

    // Cleanup any lingering instances
    if (voiceAdapterRef.current) {
      try { voiceAdapterRef.current.disconnect() } catch {}
      voiceAdapterRef.current = null
    }
    if (rendererRef.current) {
      try { rendererRef.current.destroy() } catch {}
      rendererRef.current = null
    }

    async function init() {
      try {
        // Create renderer
        const renderer = new BlobRenderer()
        if (destroyed) return
        renderer.mount(rendererContainerRef.current)
        renderer.setTheme({ primary: '#D4A853' })
        rendererRef.current = renderer

        // Create voice adapter
        const adapter = new GeminiLiveAdapter()
        if (destroyed) return
        voiceAdapterRef.current = adapter

        let turnBuffer = ''

        adapter.onTextResponse(({ type, text }) => {
          if (type === 'delta') {
            turnBuffer += text
            setSubtitleText(turnBuffer)
          } else if (type === 'done') {
            setSubtitleText(turnBuffer)
            turnBuffer = ''
            // Clear subtitle after a delay
            setTimeout(() => setSubtitleText(''), 2000)
          } else if (type === 'visitor') {
            setVisitorText(text)
            setTimeout(() => setVisitorText(''), 3000)
          } else if (type === 'visitor_interim') {
            setVisitorText(text)
          }
        })

        adapter.onSpeakingChange((speaking) => {
          setIsSpeaking(speaking)
          renderer.setSpeaking(speaking)
        })

        adapter.onListeningChange((listening) => {
          setIsListening(listening)
          renderer.setListening(listening)
        })

        adapter.onToolCall(({ tool, args }) => {
          console.log('[Assessment] Tool call:', tool, args)

          if (tool === 'update_assessment') {
            setAssessmentState(prev => ({
              ...prev,
              [args.dimension]: { score: args.score, notes: args.notes },
            }))
          } else if (tool === 'recommend_camp') {
            setRecommendedCamp({ campId: args.camp_id, reasoning: args.reasoning })
          } else if (tool === 'recommend_track') {
            setRecommendedTrack({ trackId: args.track_id, reasoning: args.reasoning })
          } else if (tool === 'complete_assessment') {
            setAssessmentSummary(args.summary)
          }
        })

        // Build system prompt
        const systemPrompt = buildSystemPrompt({
          studentName: config.studentName,
          preferredLocation: config.preferredLocation,
        })

        const greetingMessage = `A student named ${config.studentName} has joined for their summer camp assessment. Greet them warmly by name and begin getting to know them with a fun icebreaker question.`

        // Connect
        await adapter.connect({
          apiKey: config.apiKey,
          systemPrompt,
          tools: TOOL_DECLARATIONS,
          voiceName: 'Charon',
          language: 'en',
          greetingMessage,
        })

        if (destroyed) return
        setReady(true)
      } catch (err) {
        console.error('[Assessment] Init failed:', err)
        if (!destroyed) setError(err.message)
      }
    }

    init()

    return () => {
      destroyed = true
      if (voiceAdapterRef.current) {
        try { voiceAdapterRef.current.disconnect() } catch {}
        voiceAdapterRef.current = null
      }
      if (rendererRef.current) {
        try { rendererRef.current.destroy() } catch {}
        rendererRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Watch for complete_assessment tool call ──────────────────────────

  useEffect(() => {
    if (assessmentSummary && !completedRef.current) {
      handleComplete()
    }
  }, [assessmentSummary, handleComplete])

  // ─── Manual end ───────────────────────────────────────────────────────

  function handleEndEarly() {
    if (completedRef.current) return
    completedRef.current = true

    const adapter = voiceAdapterRef.current
    const renderer = rendererRef.current
    if (adapter) { adapter.disconnect(); voiceAdapterRef.current = null }
    if (renderer) { renderer.destroy(); rendererRef.current = null }

    onComplete({
      studentName: config.studentName,
      email: config.email,
      assessmentState,
      recommendedCamp,
      recommendedTrack,
      summary: assessmentSummary || 'Assessment ended early by user.',
    })
  }

  // ─── Error state ──────────────────────────────────────────────────────

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={styles.errorContainer}
      >
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.errorTitle}>Connection Failed</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={handleEndEarly} style={styles.errorButton}>
            Go Back
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.container}
    >
      {/* Student name */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={styles.nameTag}
      >
        {config.studentName}
      </motion.div>

      {/* End button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={handleEndEarly}
        style={styles.endButton}
      >
        End Assessment
      </motion.button>

      {/* Renderer container (orb) */}
      <div ref={rendererContainerRef} style={styles.rendererContainer} />

      {/* Loading state */}
      {!ready && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={styles.loadingOverlay}
        >
          <div style={styles.loadingText}>Connecting to Scout...</div>
          <div style={styles.loadingHint}>Please allow microphone access when prompted</div>
        </motion.div>
      )}

      {/* Assessment progress sidebar */}
      <AssessmentProgress assessmentState={assessmentState} />

      {/* AI subtitle */}
      <SubtitleBar
        text={subtitleText}
        secondaryText={visitorText ? `You: ${visitorText}` : null}
        visible={!!(subtitleText || visitorText)}
        position="bottom"
      />

      {/* Status indicators */}
      <div style={styles.statusBar}>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={styles.statusPill}
          >
            Scout is speaking...
          </motion.div>
        )}
        {isListening && !isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ ...styles.statusPill, background: 'rgba(var(--brand-secondary-rgb), 0.15)', color: 'var(--brand-secondary)' }}
          >
            Listening...
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'var(--surface-base)',
    overflow: 'hidden',
  },
  nameTag: {
    position: 'absolute',
    top: 'clamp(16px, 2vh, 32px)',
    left: 'clamp(20px, 2.5vw, 40px)',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    zIndex: 30,
    letterSpacing: '0.02em',
  },
  endButton: {
    position: 'absolute',
    top: 'clamp(16px, 2vh, 32px)',
    right: 'clamp(20px, 2.5vw, 40px)',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
    borderRadius: 'var(--radius-full)',
    padding: '8px 16px',
    cursor: 'pointer',
    zIndex: 30,
    transition: 'all 0.2s ease',
  },
  rendererContainer: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    background: 'rgba(6, 6, 11, 0.8)',
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '400',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  loadingHint: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  statusBar: {
    position: 'absolute',
    top: 'clamp(16px, 2vh, 32px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    display: 'flex',
    gap: '8px',
  },
  statusPill: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--brand-primary)',
    background: 'rgba(var(--brand-primary-rgb), 0.12)',
    borderRadius: 'var(--radius-full)',
    padding: '6px 14px',
    letterSpacing: '0.02em',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--surface-base)',
  },
  errorCard: {
    textAlign: 'center',
    padding: '40px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
    maxWidth: '400px',
  },
  errorIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 8px',
  },
  errorText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  errorButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    background: 'var(--surface-elevated)',
    border: '1px solid var(--surface-glass-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
  },
}

export default Assessment
