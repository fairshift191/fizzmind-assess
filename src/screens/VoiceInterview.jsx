import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GeminiLiveAdapter } from '../voice/GeminiLiveAdapter.js'
import { BlobRenderer } from '../renderer/BlobRenderer.js'
import { buildInterviewPrompt, INTERVIEW_TOOL_DECLARATIONS } from '../assessment/interview-prompt.js'
import SubtitleBar from '../ui/SubtitleBar.jsx'

/**
 * Voice #2 — Top 50 Interview
 * Scout congratulates the student, asks about their Challenge project plan,
 * hobbies, and explains scholarships. Shorter than Voice #1 (~10 min).
 */
export default function VoiceInterview({ config, onComplete }) {
  const rendererContainerRef = useRef(null)
  const rendererRef = useRef(null)
  const voiceAdapterRef = useRef(null)

  const [subtitleText, setSubtitleText] = useState('')
  const [visitorText, setVisitorText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const [interviewResult, setInterviewResult] = useState(null)
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    setTimeout(() => {
      const adapter = voiceAdapterRef.current
      const renderer = rendererRef.current
      if (adapter) { adapter.disconnect(); voiceAdapterRef.current = null }
      if (renderer) { renderer.destroy(); rendererRef.current = null }

      onComplete({
        studentName: config.studentName,
        email: config.email,
        ...interviewResult,
      })
    }, 2500)
  }, [config, interviewResult, onComplete])

  useEffect(() => {
    if (!rendererContainerRef.current) return
    let destroyed = false

    if (voiceAdapterRef.current) { try { voiceAdapterRef.current.disconnect() } catch {} ; voiceAdapterRef.current = null }
    if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} ; rendererRef.current = null }

    async function init() {
      try {
        const renderer = new BlobRenderer()
        if (destroyed) return
        renderer.mount(rendererContainerRef.current)
        renderer.setTheme({ primary: '#C9963A' })
        rendererRef.current = renderer

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
            setTimeout(() => setSubtitleText(''), 2000)
          } else if (type === 'visitor') {
            setVisitorText(text)
            setTimeout(() => setVisitorText(''), 3000)
          } else if (type === 'visitor_interim') {
            setVisitorText(text)
          }
        })

        adapter.onSpeakingChange((s) => { setIsSpeaking(s); renderer.setSpeaking(s) })
        adapter.onListeningChange((l) => { setIsListening(l); renderer.setListening(l) })

        adapter.onToolCall(({ tool, args }) => {
          console.log('[VoiceInterview] Tool call:', tool, args)
          if (tool === 'complete_interview') {
            setInterviewResult({
              projectPlan: args.project_plan,
              personNote: args.person_note,
              adminNote: args.admin_note,
            })
          }
        })

        const systemPrompt = buildInterviewPrompt({
          studentName: config.studentName,
          track: config.track,
          campName: config.campName,
        })

        const greetingMessage = `The student ${config.studentName} has joined for their top-50 interview. Greet them warmly by name, congratulate them on reaching the top 50 out of all applicants, and begin the conversation as directed in the system prompt.`

        await adapter.connect({
          apiKey: config.apiKey,
          systemPrompt,
          tools: INTERVIEW_TOOL_DECLARATIONS,
          voiceName: 'Charon',
          language: 'en',
          greetingMessage,
        })

        if (destroyed) return
        setReady(true)
      } catch (err) {
        console.error('[VoiceInterview] Init failed:', err)
        if (!destroyed) setError(err.message)
      }
    }

    init()

    return () => {
      destroyed = true
      if (voiceAdapterRef.current) { try { voiceAdapterRef.current.disconnect() } catch {} ; voiceAdapterRef.current = null }
      if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} ; rendererRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (interviewResult && !completedRef.current) handleComplete()
  }, [interviewResult, handleComplete])

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
      projectPlan: interviewResult?.projectPlan ?? null,
      personNote: interviewResult?.personNote ?? 'Interview ended early.',
      adminNote: interviewResult?.adminNote ?? 'Ended early by student.',
    })
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <h2 style={styles.errorTitle}>Connection Failed</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={handleEndEarly} style={styles.errorButton}>Go Back</button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={styles.container}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} style={styles.nameTag}>
        {config.studentName} · Top 50 Interview
      </motion.div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={handleEndEarly} style={styles.endButton}>
        End Interview
      </motion.button>

      <div ref={rendererContainerRef} style={styles.rendererContainer} />

      {!ready && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Connecting to Scout...</div>
          <div style={styles.loadingHint}>Please allow microphone access when prompted</div>
        </motion.div>
      )}

      <SubtitleBar text={subtitleText} secondaryText={visitorText ? `You: ${visitorText}` : null} visible={!!(subtitleText || visitorText)} position="bottom" />

      <div style={styles.statusBar}>
        {isSpeaking && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={styles.statusPill}>
            Scout is speaking...
          </motion.div>
        )}
        {isListening && !isSpeaking && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ ...styles.statusPill, background: 'rgba(var(--brand-secondary-rgb), 0.15)', color: 'var(--brand-secondary)' }}>
            Listening...
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const styles = {
  container: { width: '100%', height: '100%', position: 'relative', background: 'var(--surface-base)', overflow: 'hidden' },
  nameTag: { position: 'absolute', top: 'clamp(16px, 2vh, 32px)', left: 'clamp(20px, 2.5vw, 40px)', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', zIndex: 30, letterSpacing: '0.02em' },
  endButton: { position: 'absolute', top: 'clamp(16px, 2vh, 32px)', right: 'clamp(20px, 2.5vw, 40px)', fontSize: '12px', fontWeight: '500', color: 'var(--text-tertiary)', background: 'var(--surface-glass)', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-full)', padding: '8px 16px', cursor: 'pointer', zIndex: 30, transition: 'all 0.2s ease' },
  rendererContainer: { position: 'absolute', inset: 0, zIndex: 1 },
  loadingOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: 'rgba(6, 6, 11, 0.8)' },
  loadingText: { fontSize: '18px', fontWeight: '400', color: 'var(--text-primary)', marginBottom: '8px' },
  loadingHint: { fontSize: '13px', color: 'var(--text-tertiary)' },
  statusBar: { position: 'absolute', top: 'clamp(16px, 2vh, 32px)', left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: '8px' },
  statusPill: { fontSize: '12px', fontWeight: '500', color: 'var(--brand-primary)', background: 'rgba(var(--brand-primary-rgb), 0.12)', borderRadius: 'var(--radius-full)', padding: '6px 14px', letterSpacing: '0.02em' },
  errorContainer: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-base)' },
  errorCard: { textAlign: 'center', padding: '40px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-glass)', border: '1px solid var(--surface-glass-border)', maxWidth: '400px' },
  errorIcon: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  errorTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px' },
  errorText: { fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 },
  errorButton: { padding: '10px 24px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', background: 'var(--surface-elevated)', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
}
