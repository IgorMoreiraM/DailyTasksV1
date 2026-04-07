import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  FolderKanban, Users, CheckSquare, Plus, Trash2,
  KeyRound, UserX, UserCheck, AlertCircle, RefreshCw,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card, CardHeader, CardTitle, Btn, Modal, FormField,
         Avatar, RoleBadge, EmptyState, Spinner, ProgressBar,
         inputClass, inputStyle } from '../../components/ui'
import { projetoApi, funcionarioApi, tarefaApi } from '../../api'
import type { Projeto, Funcionario, Tarefa, UserRole } from '../../types'
import { GestorProjetos }     from './GestorProjetos'
import { GestorFuncionarios } from './GestorFuncionarios'
import { GestorTarefas }      from './GestorTarefas'
import { GestorRelatorios } from './GestorRelatorios'

function GestorHome() {
  const navigate = useNavigate()

  const [projetos,     setProjetos]    = useState<Projeto[]>([])
  const [funcionarios, setFuncionarios]= useState<Funcionario[]>([])
  const [allTarefas,   setAllTarefas]  = useState<Tarefa[]>([])
  const [loading,      setLoading]     = useState(true)

  const [modalProjeto, setModalProjeto] = useState(false)
  const [modalFunc,    setModalFunc]    = useState(false)
  const [editFunc,     setEditFunc]     = useState<Funcionario | null>(null)

  const [fProjeto, setFProjeto] = useState({ nome: '', descricao: '' })
  const [fFunc,    setFFunc]    = useState({ nomeCompleto: '', username: '', password: '', role: 'FUNCIONARIO' as UserRole })
  const [savingP,  setSavingP]  = useState(false)
  const [savingF,  setSavingF]  = useState(false)
  const [erroP,    setErroP]    = useState('')
  const [erroF,    setErroF]    = useState('')

  const fetchAll = useCallback(async (quiet = false) => {
  if (!quiet) setLoading(true)
  try {
    const [rP, rF] = await Promise.all([projetoApi.listar(), funcionarioApi.listar()])

    // Garante que sempre são arrays mesmo que o backend retorne algo diferente
    const projetosData: Projeto[] = Array.isArray(rP.data) ? rP.data : []
    const funcionariosData: Funcionario[] = Array.isArray(rF.data) ? rF.data : []

    setProjetos(projetosData)
    setFuncionarios(funcionariosData)

    if (projetosData.length > 0) {
      const reqs = await Promise.allSettled(
        projetosData.map(p => tarefaApi.listarPorProjeto(p.id))
      )
      const todas: Tarefa[] = []
      reqs.forEach(r => {
        if (r.status === 'fulfilled' && Array.isArray(r.value.data)) {
          todas.push(...r.value.data)
        }
      })
      setAllTarefas(todas)
    }
  } catch (err) {
    console.error('Erro Gestor:', err)
  } finally {
    setLoading(false)
  }
}, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleCriarProjeto(e: FormEvent) {
    e.preventDefault(); setErroP(''); setSavingP(true)
    try {
      await projetoApi.criar(fProjeto)
      setModalProjeto(false)
      setFProjeto({ nome: '', descricao: '' })
      fetchAll(true)
    } catch { setErroP('Erro ao criar projeto.') }
    finally { setSavingP(false) }
  }

  async function handleSalvarFunc(e: FormEvent) {
    e.preventDefault(); setErroF(''); setSavingF(true)
    try {
      if (editFunc) {
        await funcionarioApi.atualizar(editFunc.id, { nomeCompleto: fFunc.nomeCompleto, role: fFunc.role })
      } else {
        await funcionarioApi.criar(fFunc)
      }
      closeModalFunc()
      fetchAll(true)
    } catch (err: any) {
      setErroF(err?.response?.status === 409 ? 'Login já em uso.' : 'Erro ao salvar funcionário.')
    } finally { setSavingF(false) }
  }

  function openEditFunc(f: Funcionario) {
    setEditFunc(f)
    setFFunc({ nomeCompleto: f.nomeCompleto, username: f.username, password: '', role: f.role })
    setModalFunc(true)
  }

  function closeModalFunc() {
    setModalFunc(false); setEditFunc(null)
    setFFunc({ nomeCompleto: '', username: '', password: '', role: 'FUNCIONARIO' })
    setErroF('')
  }

  async function toggleAtivo(f: Funcionario) {
    if (!confirm(`${f.ativo ? 'Desativar' : 'Reativar'} ${f.nomeCompleto}?`)) return
    try {
      if (f.ativo) await funcionarioApi.desativar(f.id)
      else         await funcionarioApi.ativar(f.id)
      fetchAll(true)
    } catch { alert('Erro ao alterar status.') }
  }

  async function resetSenha(f: Funcionario) {
    if (!confirm(`Resetar senha de ${f.nomeCompleto} para "tasks123"?`)) return
    try { await funcionarioApi.resetSenha(f.id); alert('Senha resetada para "tasks123".') }
    catch { alert('Erro ao resetar senha.') }
  }

  async function deletarProjeto(p: Projeto) {
    if (!confirm(`Excluir projeto "${p.nome}"?`)) return
    try { await projetoApi.deletar(p.id); fetchAll(true) }
    catch { alert('Erro ao excluir projeto.') }
  }

  const total     = allTarefas.length
  const concluidas = allTarefas.filter(t => t.status === 'CONCLUIDA').length
  const abertas   = allTarefas.filter(t => t.status === 'EM_ANDAMENTO').length

  function progresso(projetoId: number) {
    const ts = allTarefas.filter(t => t.projetoId === projetoId)
    if (!ts.length) return 0
    return Math.round((ts.filter(t => t.status === 'CONCLUIDA').length / ts.length) * 100)
  }

  const actions = (
  <div className="flex gap-2">
    <Btn
      variant="secondary"
      size="sm"
      icon={<RefreshCw size={13} />}
      onClick={() => fetchAll(true)}
    >
      Atualizar
    </Btn>
    <button
      onClick={() => setModalProjeto(true)}
      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white transition-all"
      style={{ background: '#2a7a8a' }}
    >
      <Plus size={13} />
      Novo Projeto
    </button>
    <button
      onClick={() => setModalFunc(true)}
      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white transition-all"
      style={{ background: '#f97316' }}
    >
      <Plus size={13} />
      Novo Funcionário
    </button>
  </div>
)

  if (loading) return (
    <DashboardLayout title="Dashboard" breadcrumb="Gestor · Empresa" actions={actions}>
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Dashboard" breadcrumb="Gestor · Empresa" actions={actions}>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Funcionários" value={funcionarios.length}
          icon={<Users size={16} className="text-brand-teal" />}
          accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
        <StatCard label="Projetos" value={projetos.length}
          icon={<FolderKanban size={16} className="text-brand-orange" />}
          accentColor="bg-brand-orange" iconBg="bg-brand-orange-subtle" delay="0.10s" />
        <StatCard label="Tarefas totais" value={total}
          icon={<CheckSquare size={16} className="text-violet-600" />}
          accentColor="bg-violet-500" iconBg="bg-violet-50" delay="0.15s" />
        <StatCard label="Concluídas" value={concluidas}
          sub={total > 0 ? `<strong>${Math.round(concluidas / total * 100)}%</strong> de conclusão` : 'Sem tarefas'}
          icon={<CheckSquare size={16} className="text-emerald-600" />}
          accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.20s" />
      </div>

      {/* Projetos */}
      <Card delay="0.25s" className="mb-5">
        <CardHeader>
          <div>
            <CardTitle>Projetos</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {projetos.length} projeto{projetos.length !== 1 ? 's' : ''} · {abertas} em andamento
            </p>
          </div>
          <Btn size="sm" icon={<Plus size={13} />} onClick={() => setModalProjeto(true)}>Novo</Btn>
        </CardHeader>

        {projetos.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<FolderKanban size={36} />} message="Nenhum projeto criado"
              sub="Crie o primeiro projeto da sua empresa." />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {projetos.map(p => {
              const pct = progresso(p.id)
              const ts  = allTarefas.filter(t => t.projetoId === p.id)
              return (
                <div key={p.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 group cursor-pointer transition-colors"
                  onClick={() => navigate(`/projetos/${p.id}`)}>
                  <div className="w-9 h-9 rounded-xl bg-brand-teal-subtle flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={16} className="text-brand-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {p.nome}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <ProgressBar pct={pct} />
                      <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] whitespace-nowrap hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    {ts.length} tarefa{ts.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletarProjeto(p) }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Funcionários */}
      <Card delay="0.35s">
        <CardHeader>
          <div>
            <CardTitle>Equipe</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {funcionarios.length} membro{funcionarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Btn size="sm" icon={<Plus size={13} />} onClick={() => setModalFunc(true)}>Novo</Btn>
        </CardHeader>

        {funcionarios.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Users size={36} />} message="Nenhum funcionário cadastrado" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Funcionário', 'Login', 'Papel', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f, i) => (
                  <tr key={f.id}
                    className={`transition-colors hover:bg-slate-50/50 ${f.ativo === false ? 'opacity-50' : ''}`}
                    style={{ borderBottom: i < funcionarios.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
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
                    <td className="px-5 py-3"><RoleBadge role={f.role} /></td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        f.ativo !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {f.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditFunc(f)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          style={{ color: 'var(--text-muted)' }} title="Editar">✏️</button>
                        <button onClick={() => toggleAtivo(f)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title={f.ativo !== false ? 'Desativar' : 'Reativar'}>
                          {f.ativo !== false ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button onClick={() => resetSenha(f)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          style={{ color: 'var(--text-muted)' }} title="Resetar senha">
                          <KeyRound size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Novo Projeto */}
      <Modal open={modalProjeto} onClose={() => { setModalProjeto(false); setErroP('') }} title="Novo Projeto">
        {erroP && <ErroBanner msg={erroP} />}
        <form onSubmit={handleCriarProjeto} className="space-y-4">
          <FormField label="Nome do projeto">
            <input className={inputClass} style={inputStyle} required
              placeholder="Ex: Plataforma Alpha v2.0"
              value={fProjeto.nome} onChange={e => setFProjeto(p => ({ ...p, nome: e.target.value }))} />
          </FormField>
          <FormField label="Descrição (opcional)">
            <textarea className={inputClass} style={{ ...inputStyle, height: 76, paddingTop: 10, resize: 'none' }}
              placeholder="Objetivo do projeto..."
              value={fProjeto.descricao} onChange={e => setFProjeto(p => ({ ...p, descricao: e.target.value }))} />
          </FormField>
          <ModalFooter onCancel={() => setModalProjeto(false)} loading={savingP} label="Criar Projeto" />
        </form>
      </Modal>

      {/* Modal: Funcionário */}
      <Modal open={modalFunc} onClose={closeModalFunc} title={editFunc ? 'Editar Funcionário' : 'Novo Funcionário'}>
        {erroF && <ErroBanner msg={erroF} />}
        <form onSubmit={handleSalvarFunc} className="space-y-4">
          <FormField label="Nome completo">
            <input className={inputClass} style={inputStyle} required
              placeholder="Ex: Ana Costa"
              value={fFunc.nomeCompleto} onChange={e => setFFunc(p => ({ ...p, nomeCompleto: e.target.value }))} />
          </FormField>
          {!editFunc && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Login">
                <input className={inputClass} style={inputStyle} required placeholder="ana.costa"
                  value={fFunc.username} onChange={e => setFFunc(p => ({ ...p, username: e.target.value }))} />
              </FormField>
              <FormField label="Senha temporária">
                <input type="password" className={inputClass} style={inputStyle} required placeholder="••••••"
                  value={fFunc.password} onChange={e => setFFunc(p => ({ ...p, password: e.target.value }))} />
              </FormField>
            </div>
          )}
          <FormField label="Papel">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
              value={fFunc.role} onChange={e => setFFunc(p => ({ ...p, role: e.target.value as UserRole }))}>
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="GERENTE">Gerente</option>
            </select>
          </FormField>
          <ModalFooter onCancel={closeModalFunc} loading={savingF} label={editFunc ? 'Salvar' : 'Criar'} />
        </form>
      </Modal>

    </DashboardLayout>
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

export function GestorDashboard() {
  return (
    <Routes>
      <Route index             element={<GestorHome />} />
      <Route path="projetos"       element={<GestorProjetos />} />
      <Route path="funcionarios"   element={<GestorFuncionarios />} />
      <Route path="tarefas"        element={<GestorTarefas />} />
      <Route path="relatorios"     element={<GestorRelatorios />} />
      <Route path="*"              element={<GestorHome />} />
    </Routes>
  )
}