import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GeminiLiveAdapter } from '../voice/GeminiLiveAdapter.js'
import { BlobRenderer } from '../renderer/BlobRenderer.js'
import SubtitleBar from '../ui/SubtitleBar.jsx'

const QUIZ_INTRO_PROMPT = `You are Scout, a warm and friendly camp counselor at Fizzmind. You're talking to a kid who's about to take a Python assessment test — 30 multiple choice questions in 10 minutes.

Your job RIGHT NOW is to have a SHORT, warm chat before they start:

1. Greet them by name! Be excited to meet them.
2. Have a tiny bit of small talk — ask ONE fun question like "So, are you into coding? What got you interested?" or "Have you played around with Python before?"
3. React to whatever they say — be genuinely interested, but keep it brief (1-2 exchanges max)
4. Then smoothly transition to the test: "Alright, so here's what's coming up — 30 Python questions, you've got 10 minutes. You can skip around and come back to any question you want."
5. Reassure them: "This isn't a pass or fail thing — it just helps us figure out which group you'd fit best in at camp. So don't stress about it!"
6. Ask: "Got any questions before you jump in?"
7. When they're ready, wish them luck: "Go crush it! Just hit that Start Test button when you're ready."

IMPORTANT RULES:
- Speak SLOWLY and clearly — you're talking to a kid
- Keep each response to 1-2 SHORT sentences, then wait
- Be warm, playful, and casual — like a cool older sibling
- The whole chat should be 1-3 minutes max — don't drag it out
- If they seem nervous, be extra encouraging
- If they say they don't know Python at all, tell them that's totally fine — some questions are really easy and they should just give it a try
- Do NOT lecture about Python — just be friendly and move them toward starting the test`

function QuizIntro({ config, onStart, onBack }) {
  const rendererContainerRef = useRef(null)
  const rendererRef = useRef(null)
  const adapterRef = useRef(null)

  const [subtitleText, setSubtitleText] = useState('')
  const [visitorText, setVisitorText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ready, setReady] = useState(false)

  // Init voice + renderer
  useEffect(() => {
    if (!rendererContainerRef.current) return
    if (!config.apiKey) {
      setReady(true)
      return
    }

    let destroyed = false

    async function init() {
      try {
        const renderer = new BlobRenderer()
        if (destroyed) return
        renderer.mount(rendererContainerRef.current)
        renderer.setTheme({ primary: '#3B82F6' })
        rendererRef.current = renderer

        const adapter = new GeminiLiveAdapter()
        if (destroyed) return
        adapterRef.current = adapter

        let turnBuffer = ''

        adapter.onTextResponse(({ type, text }) => {
          if (type === 'delta') {
            turnBuffer += text
            setSubtitleText(turnBuffer)
          } else if (type === 'done') {
            setSubtitleText(turnBuffer)
            turnBuffer = ''
            setTimeout(() => setSubtitleText(''), 3000)
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
          renderer.setListening(listening)
        })

        await adapter.connect({
          apiKey: config.apiKey,
          systemPrompt: QUIZ_INTRO_PROMPT,
          tools: [],
          voiceName: 'Charon',
          language: 'en',
          greetingMessage: `A student named ${config.studentName} is about to take the Python assessment test. Greet them warmly by name and briefly explain what the test is — 30 questions, 10 minutes, no pressure.`,
        })

        if (destroyed) return
        setReady(true)
      } catch (err) {
        console.error('[QuizIntro] Voice init failed:', err)
        if (!destroyed) setReady(true) // fallback to static UI
      }
    }

    init()

    return () => {
      destroyed = true
      if (adapterRef.current) { try { adapterRef.current.disconnect() } catch {} }
      if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart() {
    if (adapterRef.current) { try { adapterRef.current.disconnect() } catch {} }
    if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} }
    onStart()
  }

  function handleBack() {
    if (adapterRef.current) { try { adapterRef.current.disconnect() } catch {} }
    if (rendererRef.current) { try { rendererRef.current.destroy() } catch {} }
    onBack()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* AI Orb background */}
      <div ref={rendererContainerRef} style={styles.rendererBg} />

      <div style={styles.content}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={styles.card}
        >
          <h1 style={styles.title}>Assessment Test</h1>
          <p style={styles.subtitle}>
            {config.studentName}, here's what to expect
          </p>

          <div style={styles.instructions}>
            <div style={styles.item}>
              <span style={styles.itemIcon}>&#x23F1;&#xFE0F;</span>
              <div>
                <div style={styles.itemTitle}>10 Minutes</div>
                <div style={styles.itemText}>Timer starts when you begin. Auto-submits when time's up.</div>
              </div>
            </div>

            <div style={styles.item}>
              <span style={styles.itemIcon}>&#x1F4DD;</span>
              <div>
                <div style={styles.itemTitle}>30 Questions</div>
                <div style={styles.itemText}>Multiple choice covering Python basics — variables, loops, functions, lists.</div>
              </div>
            </div>

            <div style={styles.item}>
              <span style={styles.itemIcon}>&#x2194;&#xFE0F;</span>
              <div>
                <div style={styles.itemTitle}>Navigate Freely</div>
                <div style={styles.itemText}>Skip questions and come back. Use the number buttons to jump around.</div>
              </div>
            </div>

            <div style={styles.item}>
              <span style={styles.itemIcon}>&#x1F4A1;</span>
              <div>
                <div style={styles.itemTitle}>No Pressure</div>
                <div style={styles.itemText}>Not pass/fail. Helps us place you in the right group at Fizzmind.</div>
              </div>
            </div>
          </div>

          {config.apiKey && (
            <div style={styles.voiceNote}>
              &#x1F3A4; Scout is here to answer any questions before you start
            </div>
          )}

          <div style={styles.actions}>
            <button onClick={handleBack} style={styles.backBtn}>Back</button>
            <button onClick={handleStart} style={styles.startBtn}>Start Test &rarr;</button>
          </div>
        </motion.div>
      </div>

      {/* Subtitle bar for voice */}
      <SubtitleBar
        text={subtitleText}
        secondaryText={visitorText ? `You: ${visitorText}` : null}
        visible={!!(subtitleText || visitorText)}
        position="bottom"
      />
    </motion.div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--surface-base)',
  },
  rendererBg: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
  },
  card: {
    maxWidth: '520px',
    width: '100%',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(10, 10, 15, 0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    padding: 'clamp(28px, 4vw, 44px)',
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(24px, 3vw, 32px)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '300',
    margin: '0 0 24px',
  },
  instructions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
    marginBottom: '20px',
  },
  item: {
    display: 'flex',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  itemIcon: {
    fontSize: '18px',
    flexShrink: 0,
    marginTop: '1px',
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  itemText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  voiceNote: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    marginBottom: '20px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  backBtn: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 28px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  startBtn: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#06060B',
    background: '#3B82F6',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 32px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}

export default QuizIntro
