import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { funcionarioApi, authApi } from '../../api'

export function ChangePasswordPage() {
  const { isAuthenticated, senhaTemporaria, role, username, logout, login } = useAuth()
  const navigate = useNavigate()

  const [nova,      setNova]     = useState('')
  const [confirma,  setConfirma] = useState('')
  const [showNova,  setShowNova] = useState(false)
  const [showConf,  setShowConf] = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [error,     setError]    = useState('')
  const [success,   setSuccess]  = useState(false)

  // Só redireciona se não está autenticado
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Se não tem senha temporária E não acabou de trocar com sucesso
  // E não veio da página de perfil (senhaTemporaria pode ser false ao acessar manualmente)
  // Removemos o redirect automático — deixamos o usuário trocar quando quiser

  const tooShort = nova.length > 0 && nova.length < 6
  const noMatch  = confirma.length > 0 && nova !== confirma

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    console.log('>>> handleSubmit chamado')

    if (nova.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (nova !== confirma) {
      setError('As senhas não coincidem.')
      return
    }
    if (loading) return

    setError('')
    setLoading(true)

    // PASSO 1 — Altera a senha
    try {
      console.log('>>> [1] Alterando senha...')
      await funcionarioApi.alterarSenha({ novaSenha: nova })
      console.log('>>> [1] Senha alterada com sucesso')
      setSuccess(true)
    } catch (err: any) {
      console.error('>>> [1] ERRO:', err?.response?.status, err?.response?.data)
      setError(err?.response?.data ?? 'Erro ao atualizar senha. Tente novamente.')
      setLoading(false)
      return
    }

    // PASSO 2 — Re-login para obter token com senhaTemporaria = false
    try {
      console.log('>>> [2] Fazendo re-login...')
      const res = await authApi.login(username ?? '', nova)

      // Usa login() do contexto — atualiza senhaTemporaria no AuthContext
      login(res.data.token)
      console.log('>>> [2] Re-login OK, redirecionando para:', role)

      setTimeout(() => {
        if      (role === 'MASTER')  navigate('/master',      { replace: true })
        else if (role === 'GESTOR')  navigate('/gestor',      { replace: true })
        else if (role === 'GERENTE') navigate('/gerente',     { replace: true })
        else                         navigate('/funcionario', { replace: true })
      }, 1200)

    } catch (err: any) {
      console.error('>>> [2] ERRO no re-login:', err?.response?.status)
      // Senha foi alterada mas re-login falhou — vai para login manual
      setTimeout(() => { logout(); navigate('/login', { replace: true }) }, 1200)
    }
  }

  function strength(pw: string) {
    let s = 0
    if (pw.length >= 6)          s++
    if (pw.length >= 10)         s++
    if (/[A-Z]/.test(pw))        s++
    if (/[0-9]/.test(pw))        s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    if (s <= 1) return { score: s, label: 'Fraca', color: '#ef4444' }
    if (s <= 3) return { score: s, label: 'Média', color: '#f97316' }
    return       { score: s, label: 'Forte', color: '#22c55e' }
  }

  const str = strength(nova)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-page)' }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl p-8 animate-slide-up"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal-subtle flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-brand-teal" />
          </div>
          <h1
            className="font-display font-bold text-[22px] text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {senhaTemporaria ? 'Crie sua senha' : 'Alterar senha'}
          </h1>
          <p
            className="text-[13px] text-center mt-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {senhaTemporaria
              ? <>Você está acessando com uma senha temporária.<br />Defina uma senha permanente para continuar.</>
              : 'Digite sua nova senha abaixo.'
            }
          </p>
        </div>

        {/* Sucesso */}
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={40} className="text-emerald-500" />
            <p className="font-semibold text-emerald-600">Senha atualizada com sucesso!</p>
            <p className="text-[12px] text-slate-400">Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                <p className="text-[12.5px] text-rose-600">{error}</p>
              </div>
            )}

            {/* Nova senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Nova senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showNova ? 'text' : 'password'}
                  value={nova}
                  onChange={e => setNova(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border text-[13.5px] outline-none transition-all focus:border-brand-teal focus:shadow-[0_0_0_3px_rgba(42,122,138,0.12)]"
                  style={{
                    background:  'var(--bg-subtle)',
                    borderColor: tooShort ? '#ef4444' : 'var(--border-default)',
                    color:       'var(--text-primary)',
                  }}
                />
                <button type="button" onClick={() => setShowNova(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
                  {showNova ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {nova.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i <= str.score ? str.color : 'var(--border-default)' }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: str.color }}>
                    {str.label}
                  </span>
                </div>
              )}
              {tooShort && <p className="text-[11px] text-rose-500">Mínimo de 6 caracteres.</p>}
            </div>

            {/* Confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Confirmar senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirma}
                  onChange={e => setConfirma(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border text-[13.5px] outline-none transition-all focus:border-brand-teal focus:shadow-[0_0_0_3px_rgba(42,122,138,0.12)]"
                  style={{
                    background:  'var(--bg-subtle)',
                    borderColor: noMatch ? '#ef4444' : 'var(--border-default)',
                    color:       'var(--text-primary)',
                  }}
                />
                <button type="button" onClick={() => setShowConf(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
                  {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {noMatch && <p className="text-[11px] text-rose-500">As senhas não coincidem.</p>}
            </div>

            {/* Requisitos */}
            <div className="rounded-xl p-3.5 space-y-1.5" style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}>
                Requisitos
              </p>
              {[
                { ok: nova.length >= 6,   text: 'Mínimo 6 caracteres' },
                { ok: /[A-Z]/.test(nova), text: 'Uma letra maiúscula'  },
                { ok: /[0-9]/.test(nova), text: 'Um número'            },
              ].map(r => (
                <div key={r.text} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    r.ok ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}>
                    {r.ok && (
                      <svg width="8" height="8" viewBox="0 0 10 10">
                        <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5"
                          strokeLinecap="round" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px]"
                    style={{ color: r.ok ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {r.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Botão */}
            <button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-[14px] text-white transition-all flex items-center justify-center"
              style={{
                background: '#f97316',
                boxShadow:  '0 4px 14px rgba(249,115,22,0.3)',
                opacity:    loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Salvar e continuar →'
              )}
            </button>

            {/* Botão voltar — só aparece se não for senha temporária */}
            {!senhaTemporaria && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full h-9 rounded-xl text-[13px] font-medium transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Cancelar
              </button>
            )}

          </form>
        )}
      </div>
    </div>
  )
}