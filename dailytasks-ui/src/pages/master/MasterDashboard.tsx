import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Building2, Users, Plus, Trash2, UserPlus, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card, CardHeader, CardTitle, Btn, Modal, FormField,
         Avatar, EmptyState, Spinner, inputClass, inputStyle } from '../../components/ui'
import { empresaApi, funcionarioApi } from '../../api'
import type { Empresa, Funcionario } from '../../types'

function MasterHome() {
  const [empresas,      setEmpresas]      = useState<Empresa[]>([])
  const [funcionarios,  setFuncionarios]  = useState<Funcionario[]>([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [modalEmpresa,  setModalEmpresa]  = useState(false)
  const [modalGestor,   setModalGestor]   = useState(false)
  const [fEmpresa,      setFEmpresa]      = useState({ nome: '', cnpj: '' })
  const [fGestor,       setFGestor]       = useState({ nomeCompleto: '', username: '', password: '', empresaId: '' })
  const [savingE,       setSavingE]       = useState(false)
  const [savingG,       setSavingG]       = useState(false)
  const [erroE,         setErroE]         = useState('')
  const [erroG,         setErroG]         = useState('')

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const [rE, rF] = await Promise.all([empresaApi.listar(), funcionarioApi.listar()])
      setEmpresas(rE.data)
      setFuncionarios(rF.data)
    } catch (err) {
      console.error('Erro Master:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleCriarEmpresa(e: FormEvent) {
    e.preventDefault(); setErroE(''); setSavingE(true)
    try {
      await empresaApi.criar(fEmpresa)
      setModalEmpresa(false)
      setFEmpresa({ nome: '', cnpj: '' })
      fetchAll(true)
    } catch { setErroE('Erro ao criar empresa.') }
    finally { setSavingE(false) }
  }

  async function handleCriarGestor(e: FormEvent) {
  e.preventDefault(); setErroG(''); setSavingG(true)
    try {
      const payload = {
        nomeCompleto: fGestor.nomeCompleto.trim(),
        username:     fGestor.username.trim(),
        password:     fGestor.password,
        role:         'GESTOR',
        empresaId:    Number(fGestor.empresaId),
      }
      console.log('=== PAYLOAD ENVIADO ===', JSON.stringify(payload))
      await funcionarioApi.criar(payload)
      setModalGestor(false)
      setFGestor({ nomeCompleto: '', username: '', password: '', empresaId: '' })
      fetchAll(true)
    } catch (err: any) {
      console.error('=== ERRO STATUS ===', err?.response?.status)
      console.error('=== ERRO BODY ===', err?.response?.data)
      setErroG(err?.response?.data ?? 'Erro desconhecido')
    } finally { setSavingG(false) }
  }

  async function handleDeleteEmpresa(id: number, nome: string) {
    if (!confirm(`Remover "${nome}"?`)) return
    try { await empresaApi.deletar(id); fetchAll(true) }
    catch { alert('Empresa possui registros ativos.') }
  }

  const gestores          = funcionarios.filter(f => f.role === 'GESTOR')
  const gerentesCount     = funcionarios.filter(f => f.role === 'GERENTE').length
  const funcionariosCount = funcionarios.filter(f => f.role === 'FUNCIONARIO').length

  const actions = (
  <div className="flex gap-2">
    <Btn
      variant="secondary"
      size="sm"
      icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
      onClick={() => fetchAll(true)}
    >
      Atualizar
    </Btn>
    <Btn
      variant="secondary"
      size="sm"
      icon={<UserPlus size={13} />}
      onClick={() => setModalGestor(true)}
    >
      Novo Gestor
    </Btn>
    <button
      onClick={() => setModalEmpresa(true)}
      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white transition-all disabled:opacity-50"
      style={{ background: '#2a7a8a' }}
    >
      <Plus size={13} />
      Nova Empresa
    </button>
  </div>
)

  if (loading) return (
    <DashboardLayout title="Dashboard" breadcrumb="Admin Master · Visão global" actions={actions}>
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Dashboard" breadcrumb="Admin Master · Visão global" actions={actions}>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Empresas" value={empresas.length}
          sub={`<strong>${gestores.length} gestores</strong> cadastrados`}
          icon={<Building2 size={16} className="text-brand-teal" />}
          accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
        <StatCard label="Total de usuários" value={funcionarios.length}
          sub={`<strong>Gestores:</strong> ${gestores.length}`}
          icon={<Users size={16} className="text-brand-orange" />}
          accentColor="bg-brand-orange" iconBg="bg-brand-orange-subtle" delay="0.10s" />
        <StatCard label="Gerentes" value={gerentesCount} sub="Líderes de projeto"
          icon={<Users size={16} className="text-violet-600" />}
          accentColor="bg-violet-500" iconBg="bg-violet-50" delay="0.15s" />
        <StatCard label="Funcionários" value={funcionariosCount} sub="Colaboradores ativos"
          icon={<Users size={16} className="text-emerald-600" />}
          accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.20s" />
      </div>

      {/* Tabela de Empresas */}
      <Card delay="0.25s">
        <CardHeader>
          <div>
            <CardTitle>Empresas cadastradas</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} no sistema
            </p>
          </div>
          <Btn size="sm" icon={<Plus size={13} />} onClick={() => setModalEmpresa(true)}>Adicionar</Btn>
        </CardHeader>
        {empresas.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Building2 size={36} />} message="Nenhuma empresa cadastrada"
              sub="Clique em 'Nova Empresa' para começar." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Empresa', 'CNPJ', 'Gestor', 'Ações'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp, i) => {
                  const gestor = funcionarios.find(f => f.role === 'GESTOR' && f.empresaId === emp.id)
                  return (
                    <tr key={emp.id} className="transition-colors hover:bg-slate-50/50 group"
                      style={{ borderBottom: i < empresas.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.nome} size="sm" />
                          <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>{emp.nome}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{emp.cnpj || '—'}</td>
                      <td className="px-5 py-3.5">
                        {gestor ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={gestor.nomeCompleto} size="sm" />
                            <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{gestor.nomeCompleto}</span>
                          </div>
                        ) : <span className="text-[12px] text-amber-500">Sem gestor</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: 'var(--text-muted)' }}>
                            <ExternalLink size={14} />
                          </button>
                          <button onClick={() => handleDeleteEmpresa(emp.id, emp.nome)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tabela de Usuários */}
      <Card delay="0.35s" className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>Todos os usuários</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {funcionarios.length} usuário{funcionarios.length !== 1 ? 's' : ''} no sistema
            </p>
          </div>
          <Btn size="sm" icon={<UserPlus size={13} />} onClick={() => setModalGestor(true)}>Novo Gestor</Btn>
        </CardHeader>
        {funcionarios.length === 0 ? (
          <div className="p-6"><EmptyState icon={<Users size={36} />} message="Nenhum usuário cadastrado" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Usuário', 'Login', 'Papel', 'Empresa'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f, i) => {
                  const empresa = empresas.find(e => e.id === f.empresaId)
                  return (
                    <tr key={f.id} className="transition-colors hover:bg-slate-50/50"
                      style={{ borderBottom: i < funcionarios.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{f.nomeCompleto}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12.5px] font-mono" style={{ color: 'var(--text-secondary)' }}>{f.username}</td>
                      <td className="px-5 py-3"><RolePill role={f.role} /></td>
                      <td className="px-5 py-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>{empresa?.nome ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Nova Empresa */}
      <Modal open={modalEmpresa} onClose={() => { setModalEmpresa(false); setErroE('') }} title="Nova Empresa">
        {erroE && <ErroBanner msg={erroE} />}
        <form onSubmit={handleCriarEmpresa} className="space-y-4">
          <FormField label="Nome fantasia">
            <input className={inputClass} style={inputStyle} required placeholder="Ex: TechNova Ltda"
              value={fEmpresa.nome} onChange={e => setFEmpresa(p => ({ ...p, nome: e.target.value }))} />
          </FormField>
          <FormField label="CNPJ">
            <input className={inputClass} style={inputStyle} required placeholder="00.000.000/0001-00"
              value={fEmpresa.cnpj} onChange={e => setFEmpresa(p => ({ ...p, cnpj: e.target.value }))} />
          </FormField>
          <ModalFooter onCancel={() => setModalEmpresa(false)} loading={savingE} label="Criar Empresa" />
        </form>
      </Modal>

      {/* Modal: Novo Gestor */}
      <Modal open={modalGestor} onClose={() => { setModalGestor(false); setErroG('') }} title="Novo Gestor">
        {erroG && <ErroBanner msg={erroG} />}
        <form onSubmit={handleCriarGestor} className="space-y-4">
          <FormField label="Empresa vinculada">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }} required
              value={fGestor.empresaId} onChange={e => setFGestor(p => ({ ...p, empresaId: e.target.value }))}>
              <option value="">Selecionar empresa</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Nome completo">
            <input className={inputClass} style={inputStyle} required placeholder="Ex: João Silva"
              value={fGestor.nomeCompleto} onChange={e => setFGestor(p => ({ ...p, nomeCompleto: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Login">
              <input className={inputClass} style={inputStyle} required placeholder="joao.silva"
                value={fGestor.username} onChange={e => setFGestor(p => ({ ...p, username: e.target.value }))} />
            </FormField>
            <FormField label="Senha temporária">
              <input type="password" className={inputClass} style={inputStyle} required placeholder="••••••"
                value={fGestor.password} onChange={e => setFGestor(p => ({ ...p, password: e.target.value }))} />
            </FormField>
          </div>
          <ModalFooter onCancel={() => setModalGestor(false)} loading={savingG} label="Criar Gestor" />
        </form>
      </Modal>

    </DashboardLayout>
  )
}

function RolePill({ role }: { role: string }) {
  const map: Record<string, string> = {
    MASTER:      'bg-amber-50 text-amber-700 border-amber-200',
    GESTOR:      'bg-teal-50  text-teal-700  border-teal-200',
    GERENTE:     'bg-violet-50 text-violet-700 border-violet-200',
    FUNCIONARIO: 'bg-orange-50 text-orange-700 border-orange-200',
  }
  return (
    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${map[role] ?? 'bg-slate-50 text-slate-500'}`}>
      {role}
    </span>
  )
}

function ErroBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
      <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
      <p className="text-[12.5px] text-rose-600">{msg}</p>
    </div>
  )
}

function ModalFooter({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2.5 pt-2 border-t mt-5" style={{ borderColor: 'var(--border-default)' }}>
      <Btn variant="secondary" size="sm" type="button" onClick={onCancel}>Cancelar</Btn>
      <Btn size="sm" type="submit" loading={loading}>{label}</Btn>
    </div>
  )
}

export function MasterDashboard() {
  return (
    <Routes>
      <Route index element={<MasterHome />} />
      <Route path="empresas" element={<MasterHome />} />
      <Route path="usuarios" element={<MasterHome />} />
      <Route path="*" element={<MasterHome />} />
    </Routes>
  )
}