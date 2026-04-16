import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// No StrictMode — prevents double WebSocket connections in dev
createRoot(document.getElementById('root')).render(<App />)
