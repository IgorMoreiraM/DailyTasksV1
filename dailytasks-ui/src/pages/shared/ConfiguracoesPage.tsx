import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, Copy, RefreshCw, CheckCircle2, Shield, Smartphone } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle } from '../../components/ui'
import { botApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export function ConfiguracoesPage() {
  const navigate = useNavigate()
  const { username, role, nomeCompleto } = useAuth()

  const [token,    setToken]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [copiado,  setCopiado]  = useState(false)
  const [erro,     setErro]     = useState('')

  async function handleGerarToken() {
    setLoading(true)
    setErro('')
    setToken(null)
    try {
      const res = await botApi.gerarToken()
      setToken(res.data.token)
    } catch (err: any) {
      setErro('Erro ao gerar token. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopiar() {
    if (!token) return
    navigator.clipboard.writeText(`/conectar ${token}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const ROLE_LABEL: Record<string, string> = {
    MASTER: 'Admin Master', GESTOR: 'Gestor',
    GERENTE: 'Gerente', FUNCIONARIO: 'Funcionário',
  }

  const actions = (
    <button onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 text-[12px] font-medium hover:text-brand-teal transition-colors"
      style={{ color: 'var(--text-muted)' }}>
      <ArrowLeft size={14} /> Voltar
    </button>
  )

  return (
    <DashboardLayout title="Configurações" breadcrumb="Conta · Configurações" actions={actions}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Informações da conta */}
        <Card delay="0.05s">
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
          </CardHeader>
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {[
              { label: 'Nome',   value: nomeCompleto ?? username ?? '—' },
              { label: 'Login',  value: username ?? '—' },
              { label: 'Papel',  value: ROLE_LABEL[role ?? ''] ?? role ?? '—' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-5 py-3.5">
                <p className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {item.label}
                </p>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Conexão com o Bot Telegram */}
        <Card delay="0.10s">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-teal-subtle flex items-center justify-center">
                <Bot size={16} className="text-brand-teal" />
              </div>
              <div>
                <CardTitle>Conectar ao Bot Telegram</CardTitle>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Gere um token para vincular sua conta ao bot
                </p>
              </div>
            </div>
          </CardHeader>

          <div className="p-5 space-y-5">

            {/* Como funciona */}
            <div className="rounded-xl p-4 space-y-2.5"
              style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Como conectar
              </p>
              {[
                { num: '1', text: 'Clique em "Gerar Token" abaixo' },
                { num: '2', text: 'Copie o comando gerado' },
                { num: '3', text: 'Cole no chat do bot no Telegram' },
                { num: '4', text: 'Pronto! Sua conta estará vinculada' },
              ].map(step => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: '#2a7a8a' }}>
                    {step.num}
                  </div>
                  <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{step.text}</p>
                </div>
              ))}
            </div>

            {/* Aviso de segurança */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Shield size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-amber-700">
                O token expira em <strong>10 minutos</strong> e só pode ser usado uma vez.
                Nunca compartilhe com outras pessoas.
              </p>
            </div>

            {/* Token gerado */}
            {token && (
              <div className="rounded-xl border-2 border-brand-teal p-4 space-y-3"
                style={{ background: 'var(--bg-surface)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-brand-teal uppercase tracking-wide">
                    Token gerado
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Válido por 10 minutos
                  </p>
                </div>

                {/* Comando para copiar */}
                <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'var(--bg-subtle)', fontFamily: 'monospace' }}>
                  <Smartphone size={14} className="text-brand-teal flex-shrink-0" />
                  <p className="text-[14px] font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
                    /conectar {token}
                  </p>
                </div>

                {/* Botão copiar */}
                <button
                  onClick={handleCopiar}
                  className="w-full h-10 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: copiado ? '#22c55e' : '#2a7a8a',
                    color: 'white',
                  }}
                >
                  {copiado ? (
                    <><CheckCircle2 size={15} /> Copiado!</>
                  ) : (
                    <><Copy size={15} /> Copiar comando</>
                  )}
                </button>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <p className="text-[12.5px] text-rose-600 text-center">{erro}</p>
            )}

            {/* Botão gerar */}
            <button
              onClick={handleGerarToken}
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-[14px] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: token ? '#475569' : '#f97316', boxShadow: '0 4px 14px rgba(249,115,22,0.2)' }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><RefreshCw size={15} /> {token ? 'Gerar novo token' : 'Gerar token de acesso'}</>
              )}
            </button>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}