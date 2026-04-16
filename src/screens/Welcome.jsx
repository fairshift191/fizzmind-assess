import { useState } from 'react'
import { motion } from 'framer-motion'
import { CAMPS, TRACKS } from '../assessment/dimensions.js'

function Welcome({ onStart }) {
  const [studentName, setStudentName] = useState('')
  const [email, setEmail] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hovered, setHovered] = useState(false)

  const envKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  const effectiveKey = apiKey || envKey

  const formReady = studentName.trim() && email.trim()
  const voiceReady = formReady && effectiveKey

  function handleStart() {
    if (!voiceReady) return
    onStart({
      studentName: studentName.trim(),
      email: email.trim(),
      preferredLocation,
      apiKey: effectiveKey,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.page}
    >
      {/* Ambient glows */}
      <div style={styles.glowGold} />
      <div style={styles.glowBlue} />
      <div style={styles.glowCenter} />

      <div style={styles.scroll}>
        {/* ── Hero ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={styles.hero}
        >
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Summer 2026
          </div>
          <h1 style={styles.title}>
            fizzmind
          </h1>
          <p style={styles.tagline}>Where Curiosity Meets Adventure</p>
          <p style={styles.subtitle}>
            6 countries &middot; 20 students per cohort &middot; Ages 8–16
          </p>
        </motion.div>

        {/* ── Location ribbon ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          style={styles.ribbon}
        >
          {CAMPS.map((c) => (
            <span key={c.id} style={styles.ribbonItem}>{c.emoji} {c.name}</span>
          ))}
        </motion.div>

        {/* ── Compact form ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={styles.formCard}
        >
          <div style={styles.formInner}>
            <div style={styles.formField}>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Your name"
                style={styles.input}
                autoFocus
              />
            </div>
            <div style={styles.formField}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                style={styles.input}
              />
            </div>
            <div style={styles.formField}>
              <select
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                style={styles.select}
              >
                <option value="">Preferred location (optional)</option>
                {CAMPS.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.emoji} {camp.name} &middot; {camp.duration}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!envKey && (
            <div style={styles.apiKeyRow}>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Gemini API Key (for voice assessment)"
                style={styles.input}
              />
            </div>
          )}
        </motion.div>

        {/* ── CTA ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={styles.ctaWrap}
        >
          <button
            onClick={handleStart}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={!voiceReady}
            style={{
              ...styles.ctaBtn,
              opacity: voiceReady ? 1 : 0.4,
              cursor: voiceReady ? 'pointer' : 'not-allowed',
              transform: hovered && voiceReady ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hovered && voiceReady
                ? '0 8px 32px rgba(var(--brand-primary-rgb), 0.35)'
                : '0 4px 16px rgba(var(--brand-primary-rgb), 0.15)',
            }}
          >
            🎙️ Start Conversation with Scout →
          </button>
          <p style={styles.ctaHint}>
            ~15 min · AI voice conversation · Mic required
          </p>
        </motion.div>

        {/* ── Tracks ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          style={styles.trackRow}
        >
          {TRACKS.map((t) => (
            <span key={t.id} style={{ ...styles.trackPill, borderColor: `${t.color}25`, color: t.color }}>
              {t.emoji} {t.name}
            </span>
          ))}
        </motion.div>

        {/* ── Stats footer ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.05 }}
          style={styles.stats}
        >
          {[
            { num: '9', label: 'Countries' },
            { num: '20', label: 'Per Cohort' },
            { num: '5', label: 'Tracks' },
            { num: '100%', label: 'Scholarships' },
          ].map((s, i) => (
            <div key={s.label} style={styles.statGroup}>
              {i > 0 && <div style={styles.statDot} />}
              <span style={styles.statNum}>{s.num}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

const styles = {
  page: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--surface-base)',
  },
  glowGold: {
    position: 'absolute',
    top: '-12%',
    left: '25%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(ellipse, rgba(var(--brand-primary-rgb), 0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  glowBlue: {
    position: 'absolute',
    top: '35%',
    right: '-5%',
    width: '35%',
    height: '40%',
    background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  glowCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '35%',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 55%)',
    pointerEvents: 'none',
  },
  scroll: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'clamp(24px, 3.5vh, 48px) clamp(20px, 4vw, 64px) 48px',
    position: 'relative',
    zIndex: 1,
  },

  // Hero
  hero: { textAlign: 'center', maxWidth: '680px', marginBottom: 'clamp(16px, 2vh, 28px)' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--brand-primary)',
    background: 'rgba(var(--brand-primary-rgb), 0.06)',
    border: '1px solid rgba(var(--brand-primary-rgb), 0.15)',
    borderRadius: 'var(--radius-full)',
    padding: '6px 16px',
    marginBottom: '20px',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--brand-primary)',
    animation: 'pulse 2s ease infinite',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(40px, 6vw, 72px)',
    fontWeight: '700',
    letterSpacing: '-0.04em',
    lineHeight: 1,
    color: 'var(--text-primary)',
    margin: '0 0 6px',
    textTransform: 'lowercase',
  },
  tagline: {
    fontSize: 'clamp(15px, 1.6vw, 20px)',
    color: 'var(--brand-primary)',
    fontWeight: '400',
    letterSpacing: '0.04em',
    margin: '0 0 8px',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 'clamp(13px, 1.2vw, 15px)',
    color: 'var(--text-secondary)',
    fontWeight: '400',
    letterSpacing: '0.02em',
    margin: 0,
  },

  // Ribbon
  ribbon: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 'clamp(16px, 2vh, 28px)',
  },
  ribbonItem: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
    border: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
  },

  // Form
  formCard: {
    width: '100%',
    maxWidth: '720px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '18px 22px',
    marginBottom: 'clamp(20px, 2.5vh, 32px)',
  },
  formInner: { display: 'flex', gap: '10px' },
  formField: { flex: 1, minWidth: 0 },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '400',
    color: 'var(--text-primary)',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '400',
    color: 'var(--text-primary)',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    outline: 'none',
  },
  apiKeyRow: { marginTop: '10px' },

  // CTA
  ctaWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: 'clamp(24px, 3vh, 36px)',
  },
  ctaBtn: {
    padding: '16px 40px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.01em',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--brand-primary)',
    color: '#06060B',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  ctaHint: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    margin: 0,
  },

  // Tracks
  trackRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 'clamp(18px, 2vh, 28px)',
  },
  trackPill: {
    fontSize: '11px',
    fontWeight: '500',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
    border: '1px solid',
    whiteSpace: 'nowrap',
  },

  // Stats
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
  },
  statGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statDot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: 'var(--surface-glass-border)',
    margin: '0 clamp(10px, 1.5vw, 20px)',
  },
  statNum: {
    fontSize: 'clamp(16px, 1.8vw, 22px)',
    fontWeight: '700',
    fontFamily: "'Space Grotesk', sans-serif",
    color: 'var(--brand-primary)',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap',
  },
}

export default Welcome
