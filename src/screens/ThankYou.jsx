import { motion } from 'framer-motion'

export default function ThankYou({ studentName, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        background: '#0A0B0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,150,58,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: '520px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Check icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(201,150,58,0.12)',
            border: '2px solid rgba(201,150,58,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C9963A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: '#C9963A',
          marginBottom: '16px',
          letterSpacing: '-0.02em',
        }}>
          Thank you, {studentName}!
        </h1>

        <p style={{
          fontSize: '16px',
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '12px',
        }}>
          Scout loved talking to you. Your assessment has been recorded and our team will personally review your conversation.
        </p>

        <p style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.45)',
          marginBottom: '40px',
        }}>
          If you're a good fit, we'll reach out with the next step — a fun challenge tailored to your interests. Keep an eye on your email!
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://fizzmind.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '99px',
              background: '#C9963A', color: '#0A0B0F',
              fontSize: '14px', fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            Back to Fizzmind
          </a>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                padding: '12px 28px', borderRadius: '99px',
                background: 'transparent', color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '14px', fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              New Assessment
            </button>
          )}
        </div>

        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.25)',
          marginTop: '48px',
        }}>
          fizzmind — Where Curiosity Meets Adventure
        </p>
      </motion.div>
    </motion.div>
  )
}
