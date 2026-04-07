import {
  createContext, useContext, useEffect, useState,
  type ReactNode,
} from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../api'
import type { UserRole, DecodedToken } from '../types'

interface AuthContextValue {
  token:           string | null
  username:        string | null
  nomeCompleto:    string | null
  role:            UserRole | null
  empresaId:       number | null
  senhaTemporaria: boolean
  isAuthenticated: boolean
  isLoading:       boolean
  login:  (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null)
  const [username,  setUsername]  = useState<string | null>(null)
  const [nomeCompleto, setNome]   = useState<string | null>(null)
  const [role,      setRole]      = useState<UserRole | null>(null)
  const [empresaId, setEmpresaId] = useState<number | null>(null)
  const [senhaTemp, setSenhaTemp] = useState(false)
  const [isAuth,    setIsAuth]    = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('dt_token')
    if (saved) applyToken(saved)
    else setIsLoading(false)
  }, [])

  function applyToken(jwt: string) {
    try {
      const decoded = jwtDecode<DecodedToken>(jwt)
      if (decoded.exp * 1000 < Date.now()) { clearSession(); return }

      const auth = decoded.authorities ?? []
      let r: UserRole = 'FUNCIONARIO'
      if (auth.includes('ROLE_MASTER'))       r = 'MASTER'
      else if (auth.includes('ROLE_GESTOR'))  r = 'GESTOR'
      else if (auth.includes('ROLE_GERENTE')) r = 'GERENTE'

      setToken(jwt)
      setUsername(decoded.sub)
      setNome(decoded.sub)
      setRole(r)
      setEmpresaId(decoded.empresaId)
      setSenhaTemp(decoded.senhaTemporaria)
      setIsAuth(true)
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  function clearSession() {
    localStorage.removeItem('dt_token')
    setToken(null); setUsername(null); setNome(null)
    setRole(null); setEmpresaId(null)
    setSenhaTemp(false); setIsAuth(false)
    delete api.defaults.headers.common['Authorization']
    setIsLoading(false)
  }

  function login(jwt: string) {
    localStorage.setItem('dt_token', jwt)
    applyToken(jwt)
  }

  function logout() { clearSession() }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 bg-brand-teal rounded-2xl flex items-center justify-center shadow-lg">
            <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
              <path d="M12 22C12 15.373 17.373 10 24 10H28C30.761 10 33 12.239 33 15V29C33 31.761 30.761 34 28 34H24C17.373 34 12 28.627 12 22Z"
                stroke="white" strokeWidth="2" fill="none"/>
              <path d="M18 22L21 25L28 18" stroke="#fb923c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M26 11L32 17" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">DailyTasks</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      token, username, nomeCompleto, role, empresaId,
      senhaTemporaria: senhaTemp, isAuthenticated: isAuth,
      isLoading, login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}