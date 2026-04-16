import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Welcome from './screens/Welcome.jsx'
import Assessment from './screens/Assessment.jsx'
import ThankYou from './screens/ThankYou.jsx'
import InviteTest from './screens/InviteTest.jsx'
import Results from './screens/Results.jsx'

function App() {
  const [screen, setScreen] = useState('loading')
  const [config, setConfig] = useState(null)
  const [results, setResults] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)

  // On mount: check for ?invite=CODE in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('invite')
    if (code) {
      setInviteCode(code)
      setScreen('invite-test')
    } else {
      setScreen('welcome')
    }
  }, [])

  function handleStart(cfg) {
    setConfig(cfg)
    setScreen('assessment')
  }

  function handleAssessmentComplete(res) {
    setResults(res)
    setScreen('thank-you')
  }

  function handleReset() {
    setConfig(null)
    setResults(null)
    setInviteCode(null)
    // Clear invite param from URL if present
    const url = new URL(window.location.href)
    url.searchParams.delete('invite')
    window.history.replaceState({}, '', url)
    setScreen('welcome')
  }

  if (screen === 'loading') return null

  return (
    <AnimatePresence mode="wait">
      {screen === 'welcome' && (
        <Welcome key="welcome" onStart={handleStart} />
      )}
      {screen === 'assessment' && (
        <Assessment key="assessment" config={config} onComplete={handleAssessmentComplete} />
      )}
      {screen === 'thank-you' && (
        <ThankYou
          key="thank-you"
          studentName={results?.studentName || config?.studentName || ''}
          onReset={handleReset}
        />
      )}
      {screen === 'invite-test' && (
        <InviteTest key="invite-test" inviteCode={inviteCode} onReset={handleReset} />
      )}
      {screen === 'results' && (
        <Results key="results" results={results} onReset={handleReset} />
      )}
    </AnimatePresence>
  )
}

export default App
