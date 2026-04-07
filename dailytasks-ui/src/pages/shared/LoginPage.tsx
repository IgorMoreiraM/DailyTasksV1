import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { authApi } from '../../api'

export function LoginPage() {
  const { isAuthenticated, role, senhaTemporaria, login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  if (isAuthenticated) {
    if (senhaTemporaria)    return <Navigate to="/primeiro-acesso" replace />
    if (role === 'MASTER')  return <Navigate to="/master"          replace />
    if (role === 'GESTOR')  return <Navigate to="/gestor"          replace />
    if (role === 'GERENTE') return <Navigate to="/gerente"         replace />
    return <Navigate to="/funcionario" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username.trim(), password)
      login(res.data.token)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403)     setError('Usuário ou senha incorretos.')
      else if (!err.response) setError('Não foi possível conectar ao servidor.')
      else                    setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-page)' }}
    >
      <div
        className="w-full max-w-[380px] rounded-2xl p-8 animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 8px 40px rgba(30,41,59,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#2a7a8a' }}
          >
            <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
              <path
                d="M12 22C12 15.373 17.373 10 24 10H28C30.761 10 33 12.239 33 15V29C33 31.761 30.761 34 28 34H24C17.373 34 12 28.627 12 22Z"
                stroke="white" strokeWidth="2" fill="none" opacity="0.7"
              />
              <path
                d="M18 22L21 25L28 18"
                stroke="#fb923c" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
              />
              <path
                d="M26 11L32 17"
                stroke="#fb923c" strokeWidth="2" strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-[17px] leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Daily<span style={{ color: '#f97316' }}>Tasks</span>
            </p>
          </div>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h2
            className="font-display font-bold text-[22px] tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Bem-vindo de volta
          </h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            Entre com suas credenciais para acessar.
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
            <p className="text-[12.5px] font-medium text-rose-600">{error}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Usuário */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[12px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Usuário
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="seu.usuario"
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border text-[13.5px] outline-none transition-all focus:border-brand-teal focus:shadow-[0_0_0_3px_rgba(42,122,138,0.12)]"
                style={{
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[12px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Senha
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-11 pl-10 pr-11 rounded-xl border text-[13.5px] outline-none transition-all focus:border-brand-teal focus:shadow-[0_0_0_3px_rgba(42,122,138,0.12)]"
                style={{
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px] text-white transition-all mt-2 disabled:opacity-60"
            style={{
              background: loading ? '#3d9aac' : '#f97316',
              boxShadow: '0 4px 14px rgba(249,115,22,0.25)',
            }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <p
          className="text-[11px] text-center mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Contas são criadas pelo administrador da empresa.
        </p>
      </div>
    </div>
  )
}