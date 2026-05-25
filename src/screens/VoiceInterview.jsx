import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GeminiLiveAdapter } from '../voice/GeminiLiveAdapter.js'
import { BlobRenderer } from '../renderer/BlobRenderer.js'
import { buildInterviewPrompt, INTERVIEW_TOOL_DECLARATIONS } from '../assessment/interview-prompt.js'
import { buildCodeInterviewPrompt, CODE_INTERVIEW_TOOL_DECLARATIONS } from '../assessment/code-interview-prompt.js'
import { buildCounsellorPrompt, COUNSELLOR_TOOL_DECLARATIONS } from '../assessment/counsellor-prompt.js'
import { buildCoordinatorPrompt, COORDINATOR_TOOL_DECLARATIONS } from '../assessment/coordinator-prompt.js'
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
  const [connectionState, setConnectionState] = useState(null) // { state, attempt?, max?, delayMs? }

  const [interviewResult, setInterviewResult] = useState(null)
  const completedRef = useRef(false)

  const isPostAdmission = config.inviteVariant === 'post_admission'
  const isPostCounsellor = config.inviteVariant === 'post_counsellor'
  const isCodeInterview = config.interviewType === 'code_interview'
  const characterName = isPostCounsellor
    ? 'Beverly'
    : isPostAdmission
      ? 'Sophie'
      : 'Scout'
  const sessionLabel = isPostCounsellor
    ? 'Wrap-up Call'
    : isPostAdmission
      ? 'Counsellor Session'
      : isCodeInterview
        ? 'Code Interpretation'
        : 'Top 50 Interview'

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
        adapter.onConnectionState((s) => setConnectionState(s))

        adapter.onToolCall(({ tool, args }) => {
          console.log('[VoiceInterview] Tool call:', tool, args)
          if (tool === 'complete_interview') {
            setInterviewResult({
              projectPlan: args.project_plan,
              personNote: args.person_note,
              adminNote: args.admin_note,
            })
          } else if (tool === 'complete_code_interview') {
            setInterviewResult({
              projectPlan: args.bot_summary,
              personNote: `Comprehension: ${args.comprehension}. Experimented: ${args.experimented ? 'yes' : 'no'}.`,
              adminNote: args.admin_note,
            })
          } else if (tool === 'complete_counsellor_session') {
            setInterviewResult({
              projectPlan: `Camp fit: ${args.camp_fit_notes}. Expectations: ${args.expectations}.`,
              personNote: args.person_note,
              adminNote: `Worries/flags: ${args.worries_or_flags}. Staff brief: ${args.staff_brief}.`,
            })
          } else if (tool === 'complete_coordinator_session') {
            setInterviewResult({
              projectPlan: `Counsellor feedback: ${args.counsellor_feedback}`,
              personNote: `Mood: ${args.mood_going_forward}`,
              adminNote: `Questions raised: ${args.questions_raised}`,
            })
          }
        })

        const systemPrompt = isCodeInterview
          ? buildCodeInterviewPrompt({
              studentName: config.studentName,
              studentContext: config.studentContext,
            })
          : isPostCounsellor
            ? buildCoordinatorPrompt({
                studentName: config.studentName,
                studentContext: config.studentContext,
              })
            : isPostAdmission
              ? buildCounsellorPrompt({
                  studentName: config.studentName,
                  studentContext: config.studentContext,
                })
              : buildInterviewPrompt({
                  studentName: config.studentName,
                  track: config.track,
                  campName: config.campName,
                  studentContext: config.studentContext,
                })

        const greetingMessage = isCodeInterview
          ? `The student ${config.studentName} has joined for their final-round code interpretation chat. This is a SHORT call (3-5 minutes total). Greet them warmly by name and begin the conversation as directed in the system prompt. Do NOT announce any selection decision.`
          : isPostCounsellor
            ? `The student ${config.studentName} has joined for their Wild Minds explainer call with Beverly. You are BEVERLY the camp coordinator, NOT Scout, NOT Sophie. Introduce yourself as Beverly. This is a longer call (about 15 to 20 minutes). The core job is to make this student truly understand that Wild Minds Fellowship is NOT a camp, it is fundamentally different (real projects, real coaches building alongside them, leaders being forged, one project goes to the AI summit, the other two continue with their teams). Follow the coordinator system prompt: brief Sophie feedback, then dwell on what Wild Minds actually is, then the geopolitical posture, then the locked dates (1 to 10 June 2026, book flights) and the opt-out (give up the Fellowship place for a flexible-date camp seat, irreversible), then the prep list and warm send-off.`
            : isPostAdmission
              ? `The student ${config.studentName} has joined for their counsellor session with Sophie. You are SOPHIE the counsellor, NOT Scout. Introduce yourself as Sophie. Do NOT say you are Scout. This is a longer call (around 45 minutes). Follow the counsellor system prompt: walk through all ten themes in order (family, friends, groups, normal weekend, hobbies, school, what excites about camp, what worries about camp, new places + people, success), spending around 5 minutes on each. Dig in with follow-ups when answers are short. Do NOT call complete_counsellor_session before covering all ten themes.`
              : `The student ${config.studentName} has joined for their top-50 interview. Greet them warmly by name, congratulate them on reaching the top 50 out of all applicants, and begin the conversation as directed in the system prompt.`

        const tools = isCodeInterview
          ? CODE_INTERVIEW_TOOL_DECLARATIONS
          : isPostCounsellor
            ? COORDINATOR_TOOL_DECLARATIONS
            : isPostAdmission
              ? COUNSELLOR_TOOL_DECLARATIONS
              : INTERVIEW_TOOL_DECLARATIONS

        await adapter.connect({
          apiKey: config.apiKey,
          systemPrompt,
          tools,
          voiceName: 'Zephyr',
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
        {config.studentName} · {sessionLabel}
      </motion.div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={handleEndEarly} style={styles.endButton}>
        {isPostCounsellor ? 'End Call' : isPostAdmission ? 'End Session' : 'End Interview'}
      </motion.button>

      <div ref={rendererContainerRef} style={styles.rendererContainer} />

      {!ready && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.loadingOverlay}>
          <div style={styles.loadingText}>Connecting to {characterName}...</div>
          <div style={styles.loadingHint}>Please allow microphone access when prompted</div>
        </motion.div>
      )}

      <SubtitleBar text={subtitleText} secondaryText={visitorText ? `You: ${visitorText}` : null} visible={!!(subtitleText || visitorText)} position="bottom" />

      <div style={styles.statusBar}>
        {(connectionState?.state === 'reconnect_pending' || connectionState?.state === 'reconnecting') && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ ...styles.statusPill, background: 'rgba(255, 180, 60, 0.15)', color: '#ffb43c' }}>
            Reconnecting{connectionState.attempt ? ` (${connectionState.attempt}/${connectionState.max})` : ''}...
          </motion.div>
        )}
        {connectionState?.state === 'failed' && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ ...styles.statusPill, background: 'rgba(255, 80, 80, 0.18)', color: '#ff5050' }}>
            Connection lost. Please refresh and reopen the invite.
          </motion.div>
        )}
        {connectionState?.state !== 'reconnect_pending' && connectionState?.state !== 'reconnecting' && connectionState?.state !== 'failed' && isSpeaking && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={styles.statusPill}>
            {characterName} is speaking...
          </motion.div>
        )}
        {connectionState?.state !== 'reconnect_pending' && connectionState?.state !== 'reconnecting' && connectionState?.state !== 'failed' && isListening && !isSpeaking && (
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
