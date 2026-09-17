import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Safe Capacitor updater — only runs in native context
try {
  if (typeof window !== 'undefined' && window.Capacitor) {
    import('@capgo/capacitor-updater').then(({ CapacitorUpdater }) => {
      CapacitorUpdater.notifyAppReady();
    }).catch(() => {});
  }
} catch (e) {}
