import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { selectQuestions } from '../assessment/questions.js'

const TOTAL_TIME = 10 * 60 // 10 minutes in seconds
const QUESTION_COUNT = 30

function PythonQuiz({ config, onComplete }) {
  const [questions] = useState(() => selectQuestions(QUESTION_COUNT))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)

  const finishQuiz = useCallback(() => {
    if (finished) return
    setFinished(true)
    clearInterval(timerRef.current)

    let correct = 0
    let attempted = 0
    const breakdown = questions.map(q => {
      const selected = answers[q.id]
      const isCorrect = selected === q.correct
      if (selected !== undefined) attempted++
      if (isCorrect) correct++
      return { ...q, selected, isCorrect }
    })

    onComplete({
      score: correct,
      total: questions.length,
      attempted,
      percentage: Math.round((correct / questions.length) * 100),
      timeUsed: TOTAL_TIME - timeLeft,
      breakdown,
    })
  }, [finished, questions, answers, timeLeft, onComplete])

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !finished) finishQuiz()
  }, [timeLeft, finished, finishQuiz])

  const current = questions[currentIndex]
  const selectedAnswer = answers[current.id]
  const answeredCount = Object.keys(answers).length

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const isLowTime = timeLeft <= 60
  const isCriticalTime = timeLeft <= 30

  function selectOption(optionIndex) {
    if (finished) return
    setAnswers(prev => ({ ...prev, [current.id]: optionIndex }))
  }

  function goNext() {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1)
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  function goToQuestion(idx) {
    setCurrentIndex(idx)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={styles.container}
    >
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.badge}>Assessment Test</span>
          <span style={styles.studentName}>{config.studentName}</span>
        </div>

        <div style={{
          ...styles.timer,
          color: isCriticalTime ? '#EF4444' : isLowTime ? '#F59E0B' : 'var(--brand-primary)',
          background: isCriticalTime ? 'rgba(239, 68, 68, 0.12)' : isLowTime ? 'rgba(245, 158, 11, 0.12)' : 'rgba(var(--brand-primary-rgb), 0.12)',
          animation: isCriticalTime ? 'pulse 1s ease infinite' : 'none',
        }}>
          {timeStr}
        </div>

        <div style={styles.headerRight}>
          <span style={styles.progress}>{answeredCount}/{questions.length} answered</span>
          <button
            onClick={finishQuiz}
            style={{
              ...styles.submitButton,
              opacity: answeredCount === 0 ? 0.4 : 1,
            }}
            disabled={answeredCount === 0}
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.content}>
        {/* Question navigation dots */}
        <div style={styles.navDots}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(i)}
              style={{
                ...styles.dot,
                background: i === currentIndex
                  ? 'var(--brand-primary)'
                  : answers[q.id] !== undefined
                    ? 'rgba(var(--brand-primary-rgb), 0.4)'
                    : 'var(--surface-glass)',
                borderColor: i === currentIndex
                  ? 'var(--brand-primary)'
                  : 'var(--surface-glass-border)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={styles.questionCard}
          >
            <div style={styles.questionMeta}>
              <span style={styles.questionNumber}>Question {currentIndex + 1} of {questions.length}</span>
              <span style={styles.topicBadge}>{current.topic}</span>
            </div>

            <pre style={styles.questionText}>{current.question}</pre>

            <div style={styles.options}>
              {current.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  style={{
                    ...styles.option,
                    borderColor: selectedAnswer === i
                      ? 'rgba(var(--brand-primary-rgb), 0.5)'
                      : 'var(--surface-glass-border)',
                    background: selectedAnswer === i
                      ? 'rgba(var(--brand-primary-rgb), 0.1)'
                      : 'var(--surface-glass)',
                  }}
                >
                  <span style={{
                    ...styles.optionLetter,
                    background: selectedAnswer === i
                      ? 'var(--brand-primary)'
                      : 'var(--surface-elevated)',
                    color: selectedAnswer === i
                      ? '#06060B'
                      : 'var(--text-tertiary)',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{
                    ...styles.optionText,
                    color: selectedAnswer === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Nav buttons — fixed at bottom, outside scroll area */}
      <div style={styles.navButtons}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            ...styles.navBtn,
            opacity: currentIndex === 0 ? 0.3 : 1,
          }}
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button onClick={goNext} style={styles.navBtn}>
            Next
          </button>
        ) : (
          <button
            onClick={finishQuiz}
            style={{
              ...styles.navBtn,
              background: 'var(--brand-primary)',
              color: '#06060B',
              fontWeight: '600',
            }}
          >
            Finish Test
          </button>
        )}
      </div>
    </motion.div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface-base)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px clamp(20px, 3vw, 40px)',
    borderBottom: '1px solid var(--surface-glass-border)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--brand-primary)',
    background: 'rgba(var(--brand-primary-rgb), 0.1)',
    border: '1px solid rgba(var(--brand-primary-rgb), 0.2)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
  },
  studentName: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  timer: {
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: 'var(--radius-md)',
    padding: '8px 20px',
    letterSpacing: '0.05em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  progress: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  submitButton: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#06060B',
    background: 'var(--brand-primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'clamp(12px, 1.5vh, 20px) clamp(20px, 3vw, 40px)',
    overflow: 'auto',
    minHeight: 0,
  },
  navDots: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    justifyContent: 'center',
    marginBottom: 'clamp(16px, 2vh, 28px)',
    maxWidth: '600px',
  },
  dot: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid var(--surface-glass-border)',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  questionCard: {
    width: '100%',
    maxWidth: '680px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
    backdropFilter: 'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
    padding: 'clamp(20px, 2.5vw, 32px)',
    display: 'flex',
    flexDirection: 'column',
  },
  questionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  questionNumber: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
  },
  topicBadge: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    background: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-full)',
    padding: '3px 10px',
  },
  questionText: {
    fontSize: 'clamp(15px, 1.6vw, 18px)',
    fontWeight: '400',
    fontFamily: "'Space Grotesk', 'Courier New', monospace",
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    margin: '0 0 24px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '16px 20px',
    border: '1px solid var(--surface-glass-border)',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--surface-glass-border)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
  },
  optionLetter: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  optionText: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: 1.4,
    fontFamily: "'Space Grotesk', monospace",
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    padding: '14px clamp(20px, 3vw, 40px)',
    borderTop: '1px solid var(--surface-glass-border)',
    flexShrink: 0,
  },
  navBtn: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    background: 'var(--surface-glass)',
    border: '1px solid var(--surface-glass-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 28px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}

export default PythonQuiz
