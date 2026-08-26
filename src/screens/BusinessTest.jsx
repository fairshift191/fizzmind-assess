import { useState, useEffect, useMemo } from 'react'
import { C, W, K, tint } from '../theme'
import { motion } from 'framer-motion'
import { BUSINESS_QUESTIONS } from '../assessment/business-questions.js'

const TOTAL = 15
const TIME_LIMIT = 15 * 60 // 15 minutes in seconds

function shuffleAndPick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export default function BusinessTest({ studentName, onComplete }) {
  const questions = useMemo(() => shuffleAndPick(BUSINESS_QUESTIONS, TOTAL), [])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [started] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function select(idx) {
    setAnswers(prev => ({ ...prev, [current]: idx }))
  }

  function handleSubmit() {
    let correct = 0
    let attempted = 0
    const breakdown = questions.map((q, i) => {
      const selected = answers[i] ?? null
      const isCorrect = selected === q.correct
      if (selected !== null) { attempted++; if (isCorrect) correct++ }
      return { questionId: q.id, selected, correct: q.correct, isCorrect }
    })

    onComplete({
      score: correct,
      total: TOTAL,
      percentage: Math.round((correct / TOTAL) * 100),
      timeUsed: Math.round((Date.now() - started) / 1000),
      attempted,
      breakdown,
    })
  }

  const q = questions[current]
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: '100vh',
        background: C.ground,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: `${C.ground}`, borderBottom: `1px solid ${C.panelHi}`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '13px', color: W[45] }}>
          <span style={{ fontWeight: 600, color: C.warning }}>Business Challenge</span>
          <span style={{ margin: '0 8px' }}>·</span>
          {studentName}
        </div>

        <div style={{
          fontSize: '18px', fontWeight: 700, fontFamily: "'Fira Code', monospace",
          color: timeLeft <= 30 ? C.danger : timeLeft <= 60 ? C.warning : C.text,
        }}>
          {mm}:{ss}
        </div>

        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length === 0}
          style={{
            padding: '8px 20px', borderRadius: '8px',
            background: Object.keys(answers).length > 0 ? C.warning : C.mute,
            color: Object.keys(answers).length > 0 ? C.ground : C.muteText,
            fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          Submit ({Object.keys(answers).length}/{TOTAL})
        </button>
      </div>

      {/* Question dots */}
      <div style={{
        display: 'flex', gap: '4px', justifyContent: 'center',
        padding: '16px 20px', flexWrap: 'wrap',
      }}>
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: '28px', height: '28px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer',
              background: i === current ? C.warning
                : answers[i] !== undefined ? tint(C.warning, 20)
                : C.panel,
              color: i === current ? C.ground
                : answers[i] !== undefined ? C.warning
                : W[25],
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: '700px', width: '100%', margin: '0 auto',
        padding: '20px 24px 120px',
      }}>
        <div style={{ fontSize: '12px', color: W[25], marginBottom: '12px' }}>
          Question {current + 1} of {TOTAL}
        </div>

        <p style={{
          fontSize: '17px', lineHeight: 1.7, color: C.text,
          fontWeight: 500, marginBottom: '28px',
        }}>
          {q.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {q.options.map((opt, i) => {
            const isSelected = answers[current] === i
            return (
              <button
                key={i}
                onClick={() => select(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px', borderRadius: '12px',
                  background: isSelected ? tint(C.warning, 10) : C.panel,
                  border: `1.5px solid ${isSelected ? C.warning : C.line}`,
                  color: C.text, fontSize: '14px', lineHeight: 1.5,
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  background: isSelected ? C.warning : W[4],
                  color: isSelected ? C.ground : W[35],
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: `${C.ground}`, borderTop: `1px solid ${C.panelHi}`,
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          style={{
            padding: '10px 24px', borderRadius: '8px',
            background: C.panel, border: `1px solid ${C.line}`,
            color: current === 0 ? C.mute : C.text,
            fontSize: '13px', fontWeight: 500, cursor: current === 0 ? 'default' : 'pointer',
          }}
        >
          Previous
        </button>
        {current < TOTAL - 1 ? (
          <button
            onClick={() => setCurrent(Math.min(TOTAL - 1, current + 1))}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: C.warning, color: C.ground,
              fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: C.success, color: 'white',
              fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            Finish Test
          </button>
        )}
      </div>
    </motion.div>
  )
}
