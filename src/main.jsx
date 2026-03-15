import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './styles/lyrics.css'
import App from './App.jsx'
import { SpotifyProvider } from './contexts/SpotifyContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <SpotifyProvider>
        <App />
      </SpotifyProvider>
    </HashRouter>
  </StrictMode>,
)
