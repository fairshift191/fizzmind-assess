import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { verifyInvite, markInviteUsed } from '../lib/invites.js'
import { saveTestResults, saveInterviewResults } from '../lib/supabase.js'
import PythonQuiz from './PythonQuiz.jsx'
import ArtsTest from './ArtsTest.jsx'
import BusinessTest from './BusinessTest.jsx'
import VoiceInterview from './VoiceInterview.jsx'
import Results from './Results.jsx'
import ThankYou from './ThankYou.jsx'

// Maps track slug → human label + description
const TRACK_INFO = {
  stem: {
    label: 'STEM & AI',
    icon: '🤖',
    desc: 'A Python coding challenge — 30 questions, 10 minutes. Navigate freely, no pressure.',
    color: '#3B82F6',
  },
  arts: {
    label: 'Creative Arts',
    icon: '🎨',
    desc: 'A creative prompt — upload your work (image, video, audio) and write a short description.',
    color: '#EC4899',
  },
  business: {
    label: 'Business & Entrepreneurship',
    icon: '💡',
    desc: '15 case study questions — strategic thinking scenarios, 15 minutes.',
    color: '#F59E0B',
  },
}

export default function InviteTest({ inviteCode, onReset }) {
  const [phase, setPhase] = useState('verifying') // verifying | welcome | test | interview | interview-done | results | error
  const [invite, setInvite] = useState(null)
  const [student, setStudent] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [testResults, setTestResults] = useState(null)

  // Verify invite on mount
  useEffect(() => {
    async function verify() {
      const result = await verifyInvite(inviteCode)
      if (!result.valid) {
        setErrorMsg(result.reason)
        setPhase('error')
      } else {
        setInvite(result.invite)
        setStudent(result.student)
        setPhase('welcome')
      }
    }
    verify()
  }, [inviteCode])

  async function handleTestComplete(results) {
    // Save results + mark invite used
    const track = invite.track
    const studentName = `${student.first_name} ${student.last_name}`.trim()

    await saveTestResults({
      studentId: student.id,
      email: student.email,
      studentName,
      track,
      results,
    })

    await markInviteUsed(inviteCode)

    setTestResults({
      ...results,
      studentName,
      email: student.email,
      track,
    })
    setPhase('results')
  }

  async function handleInterviewComplete(res) {
    await saveInterviewResults({
      studentId: student.id,
      applicationId: invite.application_id ?? null,
      projectPlan: res.projectPlan,
      personNote: res.personNote,
      adminNote: res.adminNote,
    })
    await markInviteUsed(inviteCode)
    setPhase('interview-done')
  }

  const config = student
    ? {
        studentName: `${student.first_name} ${student.last_name}`.trim(),
        email: student.email,
      }
    : null

  const isInterview = invite?.type === 'voice_interview'
  const trackInfo = invite && !isInterview ? TRACK_INFO[invite.track] : null
  const interviewInfo = {
    label: 'Top 50 Interview',
    icon: '🎙️',
    desc: 'A short conversation with Scout — congratulations on reaching the top 50! You\'ll chat about your Challenge project and we\'ll explain scholarships.',
    color: '#C9963A',
  }

  return (
    <AnimatePresence mode="wait">
      {/* ── Verifying ──────────────────────────── */}
      {phase === 'verifying' && (
        <motion.div
          key="verifying"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.center}
        >
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Verifying your invite…</p>
        </motion.div>
      )}

      {/* ── Error ──────────────────────────────── */}
      {phase === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={styles.center}
        >
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Invite Invalid</h2>
          <p style={styles.errorMsg}>{errorMsg}</p>
          <p style={styles.errorHint}>
            Make sure you're using the exact link that was sent to you. If you think this is a mistake, contact{' '}
            <a href="mailto:hello@fizzmind.com" style={{ color: '#C9963A' }}>hello@fizzmind.com</a>.
          </p>
          <a href="https://fizzmind.com" style={styles.backBtn}>← Back to Fizzmind</a>
        </motion.div>
      )}

      {/* ── Welcome / Intro (TRACK TEST) ────────────────────── */}
      {phase === 'welcome' && trackInfo && student && !isInterview && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.page}
        >
          {/* Ambient glow */}
          <div style={{ ...styles.glow, background: `radial-gradient(circle, ${trackInfo.color}15 0%, transparent 70%)` }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={styles.card}
          >
            {/* Badge */}
            <div style={{ ...styles.badge, borderColor: `${trackInfo.color}30`, color: trackInfo.color, background: `${trackInfo.color}10` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: trackInfo.color, display: 'inline-block' }} />
              Track Challenge
            </div>

            <div style={styles.iconLarge}>{trackInfo.icon}</div>

            <h1 style={styles.title}>
              Hi, {student.first_name}! 👋
            </h1>
            <p style={styles.subtitle}>
              You've been invited to complete the{' '}
              <strong style={{ color: trackInfo.color }}>{trackInfo.label}</strong> challenge.
            </p>

            <div style={{ ...styles.infoBox, borderColor: `${trackInfo.color}20`, background: `${trackInfo.color}08` }}>
              <p style={styles.infoText}>{trackInfo.desc}</p>
            </div>

            <div style={styles.rules}>
              {invite.track === 'stem' && (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />30 Python questions · 10 minutes</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Navigate freely — go back and change answers</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />No penalty for guessing</div>
                </>
              )}
              {invite.track === 'arts' && (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />You'll get a creative prompt</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Upload any work: image, video, audio, or document</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Write a short description (max 500 words)</div>
                </>
              )}
              {invite.track === 'business' && (
                <>
                  <div style={styles.rule}><span style={styles.ruleDot} />15 case study scenarios · 15 minutes</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />No single right answer — we want your thinking</div>
                  <div style={styles.rule}><span style={styles.ruleDot} />Navigate back and change answers freely</div>
                </>
              )}
            </div>

            <button
              onClick={() => setPhase('test')}
              style={{ ...styles.startBtn, background: trackInfo.color, color: invite.track === 'stem' ? '#fff' : '#06060B' }}
            >
              Start Challenge →
            </button>

            <p style={styles.footerNote}>
              fizzmind — Summer 2026 · {student.email}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* ── Welcome (INTERVIEW) ────────────────── */}
      {phase === 'welcome' && isInterview && student && (
        <motion.div
          key="welcome-interview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.page}
        >
          <div style={{ ...styles.glow, background: `radial-gradient(circle, ${interviewInfo.color}15 0%, transparent 70%)` }} />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={styles.card}
          >
            <div style={{ ...styles.badge, borderColor: `${interviewInfo.color}30`, color: interviewInfo.color, background: `${interviewInfo.color}10` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: interviewInfo.color, display: 'inline-block' }} />
              You're in the top 50
            </div>
            <div style={styles.iconLarge}>{interviewInfo.icon}</div>
            <h1 style={styles.title}>Congratulations, {student.first_name}!</h1>
            <p style={styles.subtitle}>
              Your application made it to the <strong style={{ color: interviewInfo.color }}>top 50</strong>. Before the Challenge brief goes out, Scout wants to have a quick chat.
            </p>
            <div style={{ ...styles.infoBox, borderColor: `${interviewInfo.color}20`, background: `${interviewInfo.color}08` }}>
              <p style={styles.infoText}>{interviewInfo.desc}</p>
            </div>
            <div style={styles.rules}>
              <div style={styles.rule}><span style={styles.ruleDot} />About 10 minutes, voice only</div>
              <div style={styles.rule}><span style={styles.ruleDot} />Scout will ask about your Challenge project idea</div>
              <div style={styles.rule}><span style={styles.ruleDot} />We'll also explain how scholarships work</div>
              <div style={styles.rule}><span style={styles.ruleDot} />Speak freely — no wrong answers</div>
            </div>
            <button
              onClick={() => setPhase('interview')}
              style={{ ...styles.startBtn, background: interviewInfo.color, color: '#0D0F12' }}
            >
              Start Interview →
            </button>
            <p style={styles.footerNote}>fizzmind — Summer 2026 · {student.email}</p>
          </motion.div>
        </motion.div>
      )}

      {/* ── Interview (Voice #2) ───────────────── */}
      {phase === 'interview' && invite && config && (
        <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <VoiceInterview
            config={{
              ...config,
              track: invite.track,
              apiKey: import.meta.env.VITE_GEMINI_API_KEY,
            }}
            onComplete={handleInterviewComplete}
          />
        </motion.div>
      )}

      {/* ── Interview Done ─────────────────────── */}
      {phase === 'interview-done' && student && (
        <ThankYou
          studentName={`${student.first_name} ${student.last_name}`.trim()}
          customMessage="Thanks for the chat! Keep an eye on your email — your Challenge brief will arrive soon with all the details. You'll have about a week to work on it."
          onReset={onReset}
        />
      )}

      {/* ── Test ───────────────────────────────── */}
      {phase === 'test' && invite && !isInterview && (
        <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {invite.track === 'stem' && (
            <PythonQuiz config={config} onComplete={handleTestComplete} />
          )}
          {invite.track === 'arts' && (
            <ArtsTest config={config} onComplete={handleTestComplete} />
          )}
          {invite.track === 'business' && (
            <BusinessTest config={config} onComplete={handleTestComplete} />
          )}
        </motion.div>
      )}

      {/* ── Results ────────────────────────────── */}
      {phase === 'results' && testResults && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Results results={testResults} onReset={onReset} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles = {
  page: {
    width: '100%',
    minHeight: '100vh',
    background: '#06060B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '700px',
    height: '500px',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: '540px',
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '48px 40px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    backdropFilter: 'blur(20px)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    border: '1px solid',
    borderRadius: '99px',
    padding: '5px 14px',
    marginBottom: '24px',
  },
  iconLarge: {
    fontSize: '56px',
    marginBottom: '20px',
    lineHeight: 1,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 10px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
  infoBox: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  infoText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.6,
    margin: 0,
  },
  rules: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '32px',
    textAlign: 'left',
  },
  rule: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
  },
  ruleDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  startBtn: {
    width: '100%',
    padding: '14px 32px',
    borderRadius: '99px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'all 0.2s',
    marginBottom: '24px',
  },
  footerNote: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.2)',
    margin: 0,
  },
  center: {
    width: '100%',
    minHeight: '100vh',
    background: '#06060B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(201,150,58,0.15)',
    borderTop: '3px solid #C9963A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
  },
  errorIcon: { fontSize: '48px', marginBottom: '16px' },
  errorTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 12px',
  },
  errorMsg: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 12px',
  },
  errorHint: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.35)',
    maxWidth: '400px',
    lineHeight: 1.6,
    margin: '0 0 32px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    borderRadius: '99px',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
  },
}
