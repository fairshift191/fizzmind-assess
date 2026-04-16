import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * SubtitleBar — smooth word-by-word subtitle display
 *
 * Words fade in one by one as they arrive. When the turn ends (text cleared),
 * the whole bar fades out.
 */
function SubtitleBar({ text, secondaryText, visible, position = 'bottom' }) {
  const [wordList, setWordList] = useState([])
  const counterRef = useRef(0)
  const prevTextRef = useRef('')

  useEffect(() => {
    if (!text) {
      setWordList([])
      prevTextRef.current = ''
      return
    }

    const newWords = text.trim().split(/\s+/).filter(Boolean)
    const prevWords = prevTextRef.current.trim().split(/\s+/).filter(Boolean)

    if (text.startsWith(prevTextRef.current) && prevTextRef.current.length > 0) {
      const added = newWords.slice(prevWords.length)
      if (added.length > 0) {
        setWordList(prev => [
          ...prev,
          ...added.map(w => ({ id: counterRef.current++, word: w })),
        ])
      }
    } else {
      setWordList(newWords.map(w => ({ id: counterRef.current++, word: w })))
    }

    prevTextRef.current = text
  }, [text])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        ...styles.bar,
        bottom: position === 'bottom' ? 'clamp(28px, 4vh, 52px)' : 'auto',
        top:    position === 'top'    ? 'clamp(28px, 4vh, 52px)' : 'auto',
      }}
    >
      <div style={styles.primary}>
        {wordList.map(({ id, word }) => (
          <motion.span
            key={id}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ display: 'inline-block', marginRight: '0.28em' }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      {secondaryText && (
        <div style={styles.secondary}>{secondaryText}</div>
      )}
    </motion.div>
  )
}

const styles = {
  bar: {
    position:             'absolute',
    left:                 '50%',
    transform:            'translateX(-50%)',
    maxWidth:             'min(76%, 900px)',
    background:           'var(--surface-glass)',
    backdropFilter:       'blur(var(--blur-glass))',
    WebkitBackdropFilter: 'blur(var(--blur-glass))',
    borderRadius:         'var(--radius-md)',
    padding:              'clamp(12px, 1.6vh, 20px) clamp(20px, 2.5vw, 36px)',
    textAlign:            'center',
    zIndex:                50,
    border:               '1px solid var(--surface-glass-border)',
    boxShadow:            'var(--shadow-subtle)',
  },
  primary: {
    fontSize:      'clamp(17px, 2vw, 26px)',
    fontWeight:    '300',
    color:         'var(--text-primary)',
    lineHeight:     1.45,
    letterSpacing: '0.01em',
  },
  secondary: {
    marginTop:     '6px',
    fontSize:      'clamp(13px, 1.4vw, 18px)',
    fontWeight:    '300',
    color:         'var(--text-secondary)',
    fontStyle:     'italic',
    lineHeight:     1.35,
  },
}

export default SubtitleBar
