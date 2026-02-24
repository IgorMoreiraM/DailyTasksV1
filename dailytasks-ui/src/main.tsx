import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext' // 1. Importe o Provedor
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* 2. Envolva o App com o Provedor */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)