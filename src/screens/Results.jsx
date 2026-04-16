import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { CAMPS, TRACKS, DIMENSIONS } from '../assessment/dimensions.js'
import { saveAssessmentResults } from '../lib/supabase.js'

function Results({ results, onReset }) {
  const { studentName, email, assessmentState = {}, recommendedCamp, recommendedTrack, summary, quizResults } = results
  const savedRef = useRef(false)

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true
    if (email) {
      saveAssessmentResults({ studentName, email, assessmentState, recommendedCamp, recommendedTrack, summary, quizResults })
    }
  }, [])

  const camp = recommendedCamp ? CAMPS.find(c => c.id === recommendedCamp.campId) : null
  const track = recommendedTrack ? TRACKS.find(t => t.id === recommendedTrack.trackId) : null

  const totalScore = Object.values(assessmentState).reduce((sum, d) => sum + (d.score || 0), 0)
  const maxScore = DIMENSIONS.length * 10
  const overallPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const hasVoiceAssessment = Object.keys(assessmentState).length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={styles.container}
    >
      <div style={styles.bgGlow} />

      <div style={styles.scrollArea}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={styles.header}
        >
          <div style={styles.checkmark}>&#x2713;</div>
          <h1 style={styles.title}>Assessment Complete</h1>
          <p style={styles.subtitle}>{studentName}'s Fizzmind Profile</p>
        </motion.div>

        {/* Summary */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={styles.summaryCard}
          >
            <div style={styles.summaryLabel}>Scout's Summary</div>
            <p style={styles.summaryText}>{summary}</p>
            <div style={styles.overallScore}>
              <span style={styles.overallLabel}>Overall Readiness</span>
              <span style={styles.overallValue}>{overallPercent}%</span>
            </div>
          </motion.div>
        )}

        {/* Recommendations row */}
        <div style={styles.recsRow}>
          {camp && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={styles.recCard}
            >
              <div style={styles.recEmoji}>{camp.emoji}</div>
              <div style={styles.recTag}>Recommended Camp</div>
              <div style={styles.recName}>{camp.name}, {camp.country}</div>
              <div style={styles.recDuration}>{camp.duration}</div>
              <p style={styles.recDesc}>{camp.description}</p>
              {recommendedCamp.reasoning && (
                <p style={styles.recReasoning}>{recommendedCamp.reasoning}</p>
              )}
            </motion.div>
          )}

          {track && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              style={{
                ...styles.recCard,
                borderColor: `${track.color}33`,
              }}
            >
              <div style={styles.recEmoji}>{track.emoji}</div>
              <div style={{ ...styles.recTag, color: track.color }}>Recommended Track</div>
              <div style={styles.recName}>{track.name}</div>
              <p style={styles.recDesc}>{track.description}</p>
              {recommendedTrack.reasoning && (
                <p style={styles.recReasoning}>{recommendedTrack.reasoning}</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Dimension scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={styles.scoresSection}
        >
          <h3 style={styles.scoresTitle}>Assessment Breakdown</h3>
          <div style={styles.scoresGrid}>
            {DIMENSIONS.map((dim, i) => {
              const data = assessmentState[dim.id]
              return (
                <motion.div
                  key={dim.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.9 + i * 0.05 }}
                  style={styles.scoreCard}
                >
                  <div style={styles.scoreHeader}>
                    <span style={styles.scoreIcon}>{dim.icon}</span>
                    <span style={styles.scoreDimName}>{dim.name}</span>
                    <span style={{
                      ...styles.scoreValue,
                      color: data ? getScoreColor(data.score) : 'var(--text-tertiary)',
                    }}>
                      {data ? `${data.score}/10` : '--'}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div style={styles.scoreBarTrack}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: data ? `${(data.score / 10) * 100}%` : '0%' }}
                      transition={{ duration: 0.6, delay: 1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        ...styles.scoreBarFill,
                        background: data ? getScoreColor(data.score) : 'transparent',
                      }}
                    />
                  </div>

                  {data?.notes && (
                    <p style={styles.scoreNotes}>{data.notes}</p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Python Quiz Results */}
        {quizResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: hasVoiceAssessment ? 1.2 : 0.4 }}
            style={styles.quizSection}
          >
            <h3 style={styles.scoresTitle}>&#x1F40D; Python Test Results</h3>
            <div style={styles.quizSummary}>
              <div style={styles.quizStat}>
                <div style={styles.quizStatValue}>{quizResults.score}/{quizResults.total}</div>
                <div style={styles.quizStatLabel}>Correct</div>
              </div>
              <div style={styles.quizStat}>
                <div style={{
                  ...styles.quizStatValue,
                  color: quizResults.percentage >= 70 ? '#10B981' : quizResults.percentage >= 50 ? '#D4A853' : '#F59E0B',
                }}>{quizResults.percentage}%</div>
                <div style={styles.quizStatLabel}>Score</div>
              </div>
              <div style={styles.quizStat}>
                <div style={styles.quizStatValue}>{Math.floor(quizResults.timeUsed / 60)}:{(quizResults.timeUsed % 60).toString().padStart(2, '0')}</div>
                <div style={styles.quizStatLabel}>Time Used</div>
              </div>
              <div style={styles.quizStat}>
                <div style={styles.quizStatValue}>{quizResults.attempted}/{quizResults.total}</div>
                <div style={styles.quizStatLabel}>Attempted</div>
              </div>
            </div>

            {/* Question breakdown */}
            <div style={styles.quizBreakdown}>
              {quizResults.breakdown.map((q, i) => (
                <div key={q.id} style={{
                  ...styles.quizQuestion,
                  borderColor: q.selected === undefined
                    ? 'var(--surface-glass-border)'
                    : q.isCorrect
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)',
                  background: q.selected === undefined
                    ? 'var(--surface-glass)'
                    : q.isCorrect
                      ? 'rgba(16, 185, 129, 0.06)'
                      : 'rgba(239, 68, 68, 0.06)',
                }}>
                  <span style={styles.quizQNum}>Q{i + 1}</span>
                  <span style={styles.quizQTopic}>{q.topic}</span>
                  <span style={{
                    ...styles.quizQResult,
                    color: q.selected === undefined ? 'var(--text-tertiary)' : q.isCorrect ? '#10B981' : '#EF4444',
                  }}>
                    {q.selected === undefined ? 'Skipped' : q.isCorrect ? '\u2713' : '\u2717'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={styles.actions}
        >
          <button onClick={onReset} style={styles.resetButton}>
            Start New Assessment
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

function getScoreColor(score) {
  if (score >= 8) return '#10B981'
  if (score >= 6) return '#D4A853'
  if (score >= 4) return '#F59E0B'
  return '#EF4444'
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'var(--surface-base)',
  },
  bgGlow: {
    position: 'absolute',
    top: '-10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60%',
    height: '40%',
    background: 'radial-gradient(ellipse, rgba(var(--brand-primary-rgb), 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  scrollArea: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    padding: 'clamp(24px, 4vh, 48px) clamp(24px, 5vw, 80px)',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: 'clamp(24px, 3vh, 40px)',
  },
  checkmark: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
    fontSize: '28px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(24px, 3vw, 36px)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 'clamp(14px, 1.5vw, 18px)',
    color: 'var(--text-secondary)',
    fontWeight: '300',
    margin: 0,
  },
  summaryCard: {
    maxWidth: '700px',
    margin: '0 auto clamp(24px, 3vh, 40px)',
    padding: 'clamp(20px, 2.5vw, 32px)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
    backdropFilter: 'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
  },
  summaryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--brand-primary)',
    marginBottom: '10px',
  },
  summaryText: {
    fontSize: 'clamp(15px, 1.4vw, 18px)',
    fontWeight: '300',
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  overallScore: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '14px',
    borderTop: '1px solid var(--surface-glass-border)',
  },
  overallLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  overallValue: {
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: "'Space Grotesk', sans-serif",
    color: 'var(--brand-primary)',
  },
  recsRow: {
    display: 'flex',
    gap: 'clamp(16px, 2vw, 24px)',
    maxWidth: '700px',
    margin: '0 auto clamp(24px, 3vh, 40px)',
    flexWrap: 'wrap',
  },
  recCard: {
    flex: '1 1 300px',
    padding: 'clamp(20px, 2vw, 28px)',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface-glass)',
    border: '1px solid rgba(var(--brand-primary-rgb), 0.2)',
    backdropFilter: 'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
  },
  recEmoji: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  recTag: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--brand-primary)',
    marginBottom: '6px',
  },
  recName: {
    fontSize: 'clamp(18px, 1.6vw, 22px)',
    fontWeight: '600',
    fontFamily: "'Space Grotesk', sans-serif",
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  recDuration: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--brand-primary)',
    marginBottom: '6px',
    letterSpacing: '0.03em',
  },
  recDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: '0 0 8px',
  },
  recReasoning: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    lineHeight: 1.5,
    fontStyle: 'italic',
    margin: 0,
    paddingTop: '8px',
    borderTop: '1px solid var(--surface-glass-border)',
  },
  scoresSection: {
    maxWidth: '700px',
    margin: '0 auto clamp(24px, 3vh, 40px)',
  },
  scoresTitle: {
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    margin: '0 0 16px',
  },
  scoresGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  scoreCard: {
    padding: '14px 18px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
  },
  scoreHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  scoreIcon: {
    fontSize: '16px',
  },
  scoreDimName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  scoreValue: {
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  scoreBarTrack: {
    width: '100%',
    height: '4px',
    background: 'var(--surface-elevated)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '2px',
  },
  scoreNotes: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    lineHeight: 1.4,
    margin: '8px 0 0',
  },
  quizSection: {
    maxWidth: '700px',
    margin: '0 auto clamp(24px, 3vh, 40px)',
  },
  quizSummary: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  quizStat: {
    flex: 1,
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
    textAlign: 'center',
  },
  quizStatValue: {
    fontSize: '22px',
    fontWeight: '700',
    fontFamily: "'Space Grotesk', sans-serif",
    color: 'var(--brand-primary)',
    marginBottom: '4px',
  },
  quizStatLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  quizBreakdown: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '6px',
  },
  quizQuestion: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-glass-border)',
  },
  quizQNum: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    flexShrink: 0,
  },
  quizQTopic: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  quizQResult: {
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  actions: {
    textAlign: 'center',
    paddingBottom: '40px',
  },
  resetButton: {
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#06060B',
    background: 'var(--brand-primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'all 0.2s ease',
  },
}

export default Results
