import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NativeShell } from './components/NativeShell'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NativeShell>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NativeShell>
    </BrowserRouter>
  </StrictMode>,
)
