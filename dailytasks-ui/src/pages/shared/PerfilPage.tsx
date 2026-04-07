import { useState, useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ArrowLeft, CheckCircle2, AlertCircle, User, Shield, Trash2 } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Btn, Card, CardHeader, CardTitle } from '../../components/ui'
import { funcionarioApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export function PerfilPage() {
  const { username, role, nomeCompleto, empresaId } = useAuth()
  const navigate  = useNavigate()
  const inputRef  = useRef<HTMLInputElement>(null)

  const [foto, setFoto] = useState<string | null>(
  localStorage.getItem(`dt_foto_${username}`) ?? null
)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [erro,      setErro]      = useState('')

  /* Lê a imagem selecionada e gera preview */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErro('Imagem muito grande. Máximo 2MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido.')
      return
    }

    setErro('')
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  /* Envia para o backend */
  async function handleSalvar() {
    if (!preview) return
    setLoading(true)
    setErro('')
    setSuccess(false)

    try {
      /* Pega o ID do usuário logado — precisamos buscar do backend */
      const res = await funcionarioApi.listar()
      const usuarios = Array.isArray(res.data) ? res.data : []
      const eu = usuarios.find((f: any) => f.username === username)

      if (!eu) {
        setErro('Não foi possível identificar seu usuário.')
        return
      }

      await funcionarioApi.uploadFoto(eu.id, preview)

      
      localStorage.setItem(`dt_foto_${username}`, preview)
setFoto(preview)
setPreview(null)
setSuccess(true)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setErro(err?.response?.data ?? 'Erro ao salvar foto.')
    } finally {
      setLoading(false)
    }
  }

  /* Remove a foto */
  async function handleRemover() {
    if (!confirm('Remover foto de perfil?')) return
    setLoading(true)
    try {
      const res = await funcionarioApi.listar()
      const usuarios = Array.isArray(res.data) ? res.data : []
      const eu = usuarios.find((f: any) => f.username === username)
      if (eu) await funcionarioApi.uploadFoto(eu.id, '')
      localStorage.removeItem(`dt_foto_${username}`)
      setFoto(null)
      setPreview(null)
    } catch {
      setErro('Erro ao remover foto.')
    } finally {
      setLoading(false)
    }
  }

  function cancelarPreview() {
    setPreview(null)
    setErro('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const fotoAtual = preview ?? foto

  const actions = (
    <button onClick={() => navigate(-1)}
      className="flex items-center gap-1.5 text-[12px] font-medium hover:text-brand-teal transition-colors"
      style={{ color: 'var(--text-muted)' }}>
      <ArrowLeft size={14} /> Voltar
    </button>
  )

  const ROLE_LABEL: Record<string, string> = {
    MASTER: 'Admin Master', GESTOR: 'Gestor',
    GERENTE: 'Gerente', FUNCIONARIO: 'Funcionário',
  }

  return (
    <DashboardLayout title="Meu Perfil" breadcrumb="Conta · Perfil" actions={actions}>

      <div className="max-w-2xl mx-auto space-y-5">

        {/* Card principal — foto */}
        <Card delay="0.05s">
          <CardHeader>
            <CardTitle>Foto de perfil</CardTitle>
          </CardHeader>
          <div className="p-6 flex flex-col items-center gap-6">

            {/* Avatar grande */}
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-lg"
                style={{ background: fotoAtual ? 'transparent' : '#2a7a8a' }}
              >
                {fotoAtual ? (
                  <img src={fotoAtual} alt="Foto de perfil"
                    className="w-full h-full object-cover" />
                ) : (
                  <User size={44} className="text-white" />
                )}
              </div>

              {/* Botão de câmera sobre o avatar */}
              <button
                onClick={() => inputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Camera size={22} className="text-white" />
              </button>
            </div>

            {/* Input file oculto */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Mensagens */}
            {erro && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 w-full">
                <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                <p className="text-[12.5px] text-rose-600">{erro}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 w-full">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                <p className="text-[12.5px] text-emerald-600">Foto atualizada com sucesso!</p>
              </div>
            )}

            {/* Preview selecionado */}
            {preview && (
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  Preview — confirme para salvar
                </p>
                <div className="flex gap-2">
                  <Btn variant="secondary" size="sm" onClick={cancelarPreview}>
                    Cancelar
                  </Btn>
                  <button
                    onClick={handleSalvar}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
                    style={{ background: '#2a7a8a' }}
                  >
                    {loading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    Salvar foto
                  </button>
                </div>
              </div>
            )}

            {/* Botões quando não há preview */}
            {!preview && (
              <div className="flex gap-2">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white"
                  style={{ background: '#2a7a8a' }}
                >
                  <Camera size={13} /> Alterar foto
                </button>
                {foto && (
                  <Btn variant="secondary" size="sm" icon={<Trash2 size={13} />}
                    onClick={handleRemover} disabled={loading}>
                    Remover
                  </Btn>
                )}
              </div>
            )}

            <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
              JPG, PNG ou GIF · Máximo 2MB
            </p>
          </div>
        </Card>

        {/* Card de informações */}
        <Card delay="0.10s">
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
          </CardHeader>
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {[
              { label: 'Nome completo', value: nomeCompleto ?? username ?? '—' },
              { label: 'Login',         value: username ?? '—' },
              { label: 'Nível de acesso', value: ROLE_LABEL[role ?? ''] ?? role ?? '—' },
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

        {/* Card de segurança */}
        <Card delay="0.15s">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-teal-subtle flex items-center justify-center">
                <Shield size={16} className="text-brand-teal" />
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Alterar senha
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Recomendamos trocar periodicamente
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/primeiro-acesso')}
              className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-xl border transition-all hover:border-brand-teal"
              style={{
                background: 'var(--bg-subtle)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Alterar →
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}