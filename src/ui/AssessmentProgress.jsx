import { motion, AnimatePresence } from 'framer-motion'
import { DIMENSIONS } from '../assessment/dimensions.js'

/**
 * AssessmentProgress — minimal sidebar showing conversation progress
 * No scores or notes shown to the student — just which topics have been covered
 */
function AssessmentProgress({ assessmentState }) {
  const assessed = Object.keys(assessmentState).length
  const total = DIMENSIONS.length

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
      style={styles.container}
    >
      <div style={styles.header}>
        <span style={styles.headerLabel}>Progress</span>
        <span style={styles.headerCount}>{assessed}/{total}</span>
      </div>

      <div style={styles.progressBar}>
        <motion.div
          style={styles.progressFill}
          initial={{ width: 0 }}
          animate={{ width: `${(assessed / total) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div style={styles.dimensions}>
        <AnimatePresence>
          {DIMENSIONS.map((dim) => {
            const isAssessed = !!assessmentState[dim.id]

            return (
              <motion.div
                key={dim.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  ...styles.dimension,
                  borderColor: isAssessed
                    ? 'rgba(var(--brand-primary-rgb), 0.3)'
                    : 'var(--surface-glass-border)',
                  background: isAssessed
                    ? 'rgba(var(--brand-primary-rgb), 0.08)'
                    : 'var(--surface-glass)',
                }}
              >
                <span style={styles.dimIcon}>{dim.icon}</span>
                <span style={{
                  ...styles.dimName,
                  color: isAssessed ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>
                  {dim.name}
                </span>
                {isAssessed && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={styles.checkmark}
                  >
                    &#x2713;
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const styles = {
  container: {
    position: 'absolute',
    right: 'clamp(16px, 2vw, 32px)',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 'clamp(180px, 15vw, 240px)',
    maxHeight: '80vh',
    overflowY: 'auto',
    background: 'rgba(10, 10, 15, 0.8)',
    backdropFilter: 'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--surface-glass-border)',
    padding: 'var(--space-lg)',
    zIndex: 40,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-md)',
  },
  headerLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-secondary)',
  },
  headerCount: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--brand-primary)',
  },
  progressBar: {
    width: '100%',
    height: '3px',
    background: 'var(--surface-elevated)',
    borderRadius: '2px',
    marginBottom: 'var(--space-lg)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--brand-primary)',
    borderRadius: '2px',
  },
  dimensions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dimension: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-glass-border)',
    padding: '8px 10px',
    transition: 'all 0.3s ease',
  },
  dimIcon: {
    fontSize: '13px',
    flexShrink: 0,
  },
  dimName: {
    flex: 1,
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
  checkmark: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--brand-primary)',
    flexShrink: 0,
  },
}

export default AssessmentProgress
