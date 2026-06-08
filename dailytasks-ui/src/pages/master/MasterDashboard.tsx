import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  Building2, Users, Plus, Trash2, UserPlus,
  RefreshCw, AlertCircle, LayoutDashboard, Search,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import {
  StatCard, Card, CardHeader, CardTitle, Btn, Modal, FormField,
  Avatar, EmptyState, Spinner, inputClass, inputStyle,
} from '../../components/ui'
import { empresaApi, funcionarioApi } from '../../api'
import type { Empresa, Funcionario } from '../../types'

/* ── Helpers locais ── */
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

/* ── Hook compartilhado de dados ── */
function useMasterData() {
  const [empresas,     setEmpresas]     = useState<Empresa[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const [rE, rF] = await Promise.all([
        empresaApi.listar(),
        funcionarioApi.listar(),
      ])
      const emps = Array.isArray(rE.data) ? rE.data : []
      const funcs = Array.isArray(rF.data) ? rF.data : []
      console.log('=== EMPRESAS ===', emps)
      console.log('=== FUNCIONARIOS ===', funcs)
      setEmpresas(emps)
      setFuncionarios(funcs)
    } catch (err) {
      console.error('Erro Master fetchAll:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { empresas, funcionarios, loading, refreshing, fetchAll, setEmpresas, setFuncionarios }
}

/* ══════════════════════════════════════════════
   PÁGINA: Dashboard (visão geral)
══════════════════════════════════════════════ */
function MasterHome() {
  const navigate = useNavigate()
  const { empresas, funcionarios, loading, refreshing, fetchAll } = useMasterData()

  const gestores          = funcionarios.filter(f => f.role === 'GESTOR')
  const gerentesCount     = funcionarios.filter(f => f.role === 'GERENTE').length
  const funcionariosCount = funcionarios.filter(f => f.role === 'FUNCIONARIO').length

  if (loading) return (
    <DashboardLayout title="Dashboard" breadcrumb="Admin Master · Visão global">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Dashboard" breadcrumb="Admin Master · Visão global"
      actions={
        <Btn variant="secondary" size="sm"
          icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
          onClick={() => fetchAll(true)}>
          Atualizar
        </Btn>
      }>

      {/* Stats */}
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

      {/* Preview empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay="0.25s">
          <CardHeader>
            <CardTitle>Empresas recentes</CardTitle>
            <button onClick={() => navigate('/master/empresas')}
              className="text-[12px] font-semibold hover:text-brand-teal transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              Ver todas →
            </button>
          </CardHeader>
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {empresas.slice(0, 5).map(emp => {
              const gestor = funcionarios.find(f => f.role === 'GESTOR' && f.empresaId === emp.id)
              return (
                <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={emp.nome} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {emp.nome}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {gestor ? gestor.nomeCompleto : 'Sem gestor'}
                    </p>
                  </div>
                </div>
              )
            })}
            {empresas.length === 0 && (
              <p className="px-5 py-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Nenhuma empresa cadastrada
              </p>
            )}
          </div>
        </Card>

        <Card delay="0.30s">
          <CardHeader>
            <CardTitle>Usuários recentes</CardTitle>
            <button onClick={() => navigate('/master/usuarios')}
              className="text-[12px] font-semibold hover:text-brand-teal transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              Ver todos →
            </button>
          </CardHeader>
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {funcionarios.slice(0, 5).map(f => {
              const empresa = empresas.find(e => e.id === f.empresaId)
              return (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {f.nomeCompleto}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {empresa?.nome ?? '—'}
                    </p>
                  </div>
                  <RolePill role={f.role} />
                </div>
              )
            })}
            {funcionarios.length === 0 && (
              <p className="px-5 py-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Nenhum usuário cadastrado
              </p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

/* ══════════════════════════════════════════════
   PÁGINA: Empresas
══════════════════════════════════════════════ */
function MasterEmpresas() {
  const { empresas, funcionarios, loading, refreshing, fetchAll } = useMasterData()
  const [busca,        setBusca]        = useState('')
  const [modalEmpresa, setModalEmpresa] = useState(false)
  const [modalGestor,  setModalGestor]  = useState(false)
  const [empresaSel,   setEmpresaSel]   = useState<Empresa | null>(null)
  const [fEmpresa,     setFEmpresa]     = useState({ nome: '', cnpj: '' })
  const [fGestor,      setFGestor]      = useState({ nomeCompleto: '', username: '', password: '', empresaId: '' })
  const [savingE,      setSavingE]      = useState(false)
  const [savingG,      setSavingG]      = useState(false)
  const [erroE,        setErroE]        = useState('')
  const [erroG,        setErroG]        = useState('')

  const empresasFiltradas = empresas.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (e.cnpj ?? '').includes(busca)
  )

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
      await funcionarioApi.criar({
        nomeCompleto: fGestor.nomeCompleto.trim(),
        username:     fGestor.username.trim(),
        password:     fGestor.password,
        role:         'GESTOR',
        empresaId:    Number(fGestor.empresaId),
      })
      setModalGestor(false)
      setFGestor({ nomeCompleto: '', username: '', password: '', empresaId: '' })
      setEmpresaSel(null)
      fetchAll(true)
    } catch (err: any) {
      setErroG(err?.response?.data ?? 'Erro ao criar gestor.')
    } finally { setSavingG(false) }
  }

  async function handleDeleteEmpresa(id: number, nome: string) {
    if (!confirm(`Remover "${nome}"? Todos os dados vinculados serão excluídos.`)) return
    try { await empresaApi.deletar(id); fetchAll(true) }
    catch { alert('Empresa possui registros ativos e não pode ser excluída.') }
  }

  function abrirModalGestor(emp: Empresa) {
    setEmpresaSel(emp)
    setFGestor(p => ({ ...p, empresaId: String(emp.id) }))
    setModalGestor(true)
  }

  if (loading) return (
    <DashboardLayout title="Empresas" breadcrumb="Admin Master · Empresas">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Empresas" breadcrumb="Admin Master · Empresas"
      actions={
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm"
            icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
            onClick={() => fetchAll(true)}>
            Atualizar
          </Btn>
          <button onClick={() => setModalEmpresa(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white"
            style={{ background: '#2a7a8a' }}>
            <Plus size={13} /> Nova Empresa
          </button>
        </div>
      }>

      {/* Busca */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="w-full h-10 pl-9 pr-4 rounded-xl border text-[13px] outline-none focus:border-brand-teal"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          placeholder="Buscar empresa por nome ou CNPJ..."
          value={busca} onChange={e => setBusca(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {empresasFiltradas.length} empresa{empresasFiltradas.length !== 1 ? 's' : ''}
            {busca && ` para "${busca}"`}
          </CardTitle>
        </CardHeader>

        {empresasFiltradas.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Building2 size={36} />}
              message={busca ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              sub={busca ? 'Tente outro termo de busca.' : 'Clique em "Nova Empresa" para começar.'} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Empresa', 'CNPJ', 'Gestor responsável', 'Usuários', 'Ações'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map((emp, i) => {
                  const gestor        = funcionarios.find(f => f.role === 'GESTOR' && f.empresaId === emp.id)
                  const totalUsuarios = funcionarios.filter(f => f.empresaId === emp.id).length
                  return (
                    <tr key={emp.id} className="transition-colors hover:bg-slate-50/50 group"
                      style={{ borderBottom: i < empresasFiltradas.length - 1 ? '1px solid var(--border-default)' : 'none' }}>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.nome} size="sm" />
                          <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {emp.nome}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-[12.5px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {emp.cnpj || '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        {gestor ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={gestor.nomeCompleto} foto={gestor.foto} size="sm" />
                            <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                              {gestor.nomeCompleto}
                            </span>
                          </div>
                        ) : (
                          <button onClick={() => abrirModalGestor(emp)}
                            className="text-[12px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
                            <UserPlus size={12} /> Adicionar gestor
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-semibold px-2 py-1 rounded-lg"
                          style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                          {totalUsuarios} usuário{totalUsuarios !== 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => abrirModalGestor(emp)}
                            className="p-1.5 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors text-[11px] font-semibold flex items-center gap-1"
                            style={{ color: 'var(--text-muted)' }}>
                            <UserPlus size={13} /> Gestor
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
      <Modal open={modalGestor} onClose={() => { setModalGestor(false); setErroG(''); setEmpresaSel(null) }}
        title={empresaSel ? `Novo Gestor — ${empresaSel.nome}` : 'Novo Gestor'}>
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

/* ══════════════════════════════════════════════
   PÁGINA: Usuários
══════════════════════════════════════════════ */
function MasterUsuarios() {
  const { empresas, funcionarios, loading, refreshing, fetchAll } = useMasterData()
  const [busca,       setBusca]      = useState('')
  const [filtroRole,  setFiltroRole] = useState<string>('TODOS')
  const [filtroEmp,   setFiltroEmp]  = useState<string>('TODAS')

  const funcionariosFiltrados = funcionarios.filter(f => {
    const matchBusca = f.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
                       f.username.toLowerCase().includes(busca.toLowerCase())
    const matchRole  = filtroRole === 'TODOS' || f.role === filtroRole
    const matchEmp   = filtroEmp  === 'TODAS' || String(f.empresaId) === filtroEmp
    return matchBusca && matchRole && matchEmp
  })

  const ROLES = ['TODOS', 'MASTER', 'GESTOR', 'GERENTE', 'FUNCIONARIO']

  if (loading) return (
    <DashboardLayout title="Usuários" breadcrumb="Admin Master · Usuários">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Usuários" breadcrumb="Admin Master · Usuários"
      actions={
        <Btn variant="secondary" size="sm"
          icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
          onClick={() => fetchAll(true)}>
          Atualizar
        </Btn>
      }>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Busca */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="w-full h-10 pl-9 pr-4 rounded-xl border text-[13px] outline-none focus:border-brand-teal"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            placeholder="Buscar por nome ou login..."
            value={busca} onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Filtro por papel */}
        <div className="flex items-center gap-1.5">
          {ROLES.map(r => (
            <button key={r} onClick={() => setFiltroRole(r)}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all"
              style={filtroRole === r
                ? { background: '#2a7a8a', color: 'white', borderColor: '#2a7a8a' }
                : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
              {r === 'TODOS' ? 'Todos' : r}
            </button>
          ))}
        </div>

        {/* Filtro por empresa */}
        <select
          className="h-10 px-3 rounded-xl border text-[13px] outline-none focus:border-brand-teal"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', cursor: 'pointer' }}
          value={filtroEmp} onChange={e => setFiltroEmp(e.target.value)}>
          <option value="TODAS">Todas as empresas</option>
          {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {funcionariosFiltrados.length} usuário{funcionariosFiltrados.length !== 1 ? 's' : ''}
            {filtroRole !== 'TODOS' && ` · ${filtroRole}`}
          </CardTitle>
        </CardHeader>

        {funcionariosFiltrados.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Users size={36} />}
              message="Nenhum usuário encontrado"
              sub="Tente ajustar os filtros." />
          </div>
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
                {funcionariosFiltrados.map((f, i) => {
                  const empresa = empresas.find(e => e.id === f.empresaId)
                  return (
                    <tr key={f.id} className="transition-colors hover:bg-slate-50/50"
                      style={{ borderBottom: i < funcionariosFiltrados.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                            {f.nomeCompleto}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12.5px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {f.username}
                      </td>
                      <td className="px-5 py-3"><RolePill role={f.role} /></td>
                      <td className="px-5 py-3">
                        {empresa ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={empresa.nome} size="sm" />
                            <span className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                              {empresa.nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}

/* ══════════════════════════════════════════════
   EXPORT PRINCIPAL
══════════════════════════════════════════════ */
export function MasterDashboard() {
  return (
    <Routes>
      <Route index         element={<MasterHome />} />
      <Route path="empresas" element={<MasterEmpresas />} />
      <Route path="usuarios" element={<MasterUsuarios />} />
      <Route path="*"        element={<MasterHome />} />
    </Routes>
  )
}