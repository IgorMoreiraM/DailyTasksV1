import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Plus, Star, User, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card, CardHeader, CardTitle, Btn, Modal, FormField,
         StatusBadge, Avatar, EmptyState, Spinner, ProgressBar,
         inputClass, inputStyle } from '../../components/ui'
import { projetoApi, tarefaApi, funcionarioApi } from '../../api'
import type { Projeto, Tarefa, Funcionario } from '../../types'
import { GerenteProjeto } from './GerenteProjeto'
import { GerenteTarefas } from './GerenteTarefas'
import { GerenteRelatorios } from './GerenteRelatorios'

function GerenteHome() {
  const navigate = useNavigate()

  const [projetos,                setProjetos]                = useState<Projeto[]>([])
  const [tarefasPorProjeto,       setTarefasPorProjeto]       = useState<Record<number, Tarefa[]>>({})
  const [membrosPorProjeto,       setMembrosPorProjeto]       = useState<Record<number, any[]>>({})
  const [funcionarios,            setFuncionarios]            = useState<Funcionario[]>([])
  const [minhasTarefasAtribuidas, setMinhasTarefasAtribuidas] = useState<Tarefa[]>([])
  const [loading,                 setLoading]                 = useState(true)

  const [modalTarefa, setModalTarefa] = useState(false)
  const [tarefaProj,  setTarefaProj]  = useState<number | null>(null)
  const [fTarefa,     setFTarefa]     = useState({ titulo: '', descricao: '', dataDeVencimento: '', funcionarioId: '' })
  const [savingT,     setSavingT]     = useState(false)
  const [erroT,       setErroT]       = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rP, rT] = await Promise.all([
        projetoApi.listar(),
        tarefaApi.listarMinhas(),
      ])

      const projs: Projeto[]     = Array.isArray(rP.data) ? rP.data : []
      const minhas: Tarefa[]     = Array.isArray(rT.data) ? rT.data : []

      setProjetos(projs)
      setMinhasTarefasAtribuidas(minhas)

      const [membrosResults, tarefasResults] = await Promise.all([
        Promise.allSettled(projs.map(p => projetoApi.listarMembros(p.id))),
        Promise.allSettled(projs.map(p => tarefaApi.listarPorProjeto(p.id))),
      ])

      const mMap: Record<number, any[]>    = {}
      const tMap: Record<number, Tarefa[]> = {}
      projs.forEach((p, i) => {
        mMap[p.id] = membrosResults[i].status === 'fulfilled' ? (membrosResults[i] as any).value.data ?? [] : []
        tMap[p.id] = tarefasResults[i].status === 'fulfilled' ? (tarefasResults[i] as any).value.data ?? [] : []
      })
      setMembrosPorProjeto(mMap)
      setTarefasPorProjeto(tMap)
    } catch (err) {
      console.error('Erro GerenteDashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Abre modal e busca funcionários — com fallback para membros do projeto
  async function abrirModalTarefa(projetoId: number) {
    setTarefaProj(projetoId)
    setModalTarefa(true)
    try {
      const rF = await funcionarioApi.listar()
      setFuncionarios(Array.isArray(rF.data) ? rF.data : [])
    } catch {
      // Gerente não tem acesso a /funcionarios — usa membros do projeto como fallback
      const membros = membrosPorProjeto[projetoId] ?? []
      const funcs   = membros.map((m: any) => m.funcionario).filter(Boolean)
      setFuncionarios(funcs)
    }
  }

  const totalTarefas    = projetos.reduce((acc, p) => acc + (tarefasPorProjeto[p.id]?.length ?? 0), 0)
  const totalConcluidas = projetos.reduce((acc, p) =>
    acc + (tarefasPorProjeto[p.id]?.filter(t => t.status === 'CONCLUIDA').length ?? 0), 0)

  async function handleCriarTarefa(e: FormEvent) {
    e.preventDefault()
    if (!tarefaProj) return
    setErroT(''); setSavingT(true)
    try {
      await tarefaApi.criar({
        titulo:           fTarefa.titulo,
        descricao:        fTarefa.descricao || undefined,
        dataDeVencimento: fTarefa.dataDeVencimento || null,
        projetoId:        tarefaProj,
        funcionarioId:    Number(fTarefa.funcionarioId),
        listaId:          null,
      })
      setModalTarefa(false)
      setFTarefa({ titulo: '', descricao: '', dataDeVencimento: '', funcionarioId: '' })
      await fetchAll()
    } catch (err: any) {
      setErroT(err?.response?.data ?? 'Erro ao criar tarefa.')
    } finally { setSavingT(false) }
  }

  async function alterarStatus(tarefaId: number, status: string) {
    try {
      await tarefaApi.atualizar(tarefaId, { status: status as any })
      await fetchAll()
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err?.response?.status, err?.response?.data)
      alert('Não foi possível atualizar o status.')
    }
  }

  const actions = (
    <Btn size="sm" icon={<Plus size={13} />}
      onClick={() => projetos.length > 0 && abrirModalTarefa(projetos[0].id)}
      disabled={projetos.length === 0}>
      Nova Tarefa
    </Btn>
  )

  if (loading) return (
    <DashboardLayout title="Dashboard" breadcrumb="Gerente" actions={actions}>
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Dashboard" breadcrumb="Gerente" actions={actions}>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Meus projetos" value={projetos.length}
          icon={<Star size={16} className="text-brand-teal" />}
          accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
        <StatCard label="Total de tarefas" value={totalTarefas}
          icon={<CheckSquare size={16} className="text-violet-600" />}
          accentColor="bg-violet-500" iconBg="bg-violet-50" delay="0.10s" />
        <StatCard label="Concluídas" value={totalConcluidas}
          sub={totalTarefas > 0 ? `<strong>${Math.round(totalConcluidas / totalTarefas * 100)}%</strong>` : '—'}
          icon={<CheckSquare size={16} className="text-emerald-600" />}
          accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.15s" />
        <StatCard label="Minhas tarefas" value={minhasTarefasAtribuidas.length}
          sub="Atribuídas a mim"
          icon={<User size={16} className="text-brand-orange" />}
          accentColor="bg-brand-orange" iconBg="bg-brand-orange-subtle" delay="0.20s" />
      </div>

      {/* Projetos */}
      {projetos.length > 0 ? (
        <>
          <SectionDivider label="Meus Projetos" color="violet" />

          {projetos.map(p => {
            const ts     = tarefasPorProjeto[p.id] ?? []
            const pct    = ts.length ? Math.round(ts.filter(t => t.status === 'CONCLUIDA').length / ts.length * 100) : 0
            const equipe = (membrosPorProjeto[p.id] ?? []).map((m: any) => m.funcionario).filter(Boolean)

            return (
              <Card key={p.id} delay="0.25s" className="mb-5">
                <CardHeader>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <FolderKanban size={16} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle>{p.nome}</CardTitle>
                      <div className="flex items-center gap-3 mt-1">
                        <ProgressBar pct={pct} color="#7c3aed" />
                        <span className="text-[11px] font-semibold text-violet-600 whitespace-nowrap">{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Btn size="sm" icon={<Plus size={12} />} onClick={() => abrirModalTarefa(p.id)}>
                      Tarefa
                    </Btn>
                    <Btn variant="secondary" size="sm" onClick={() => navigate(`/projetos/${p.id}`)}>
                      Ver Kanban
                    </Btn>
                  </div>
                </CardHeader>

                {/* Tarefas */}
                <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                  {ts.length === 0 ? (
                    <div className="p-5">
                      <EmptyState icon={<CheckSquare size={28} />} message="Sem tarefas neste projeto" />
                    </div>
                  ) : (
                    ts.slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {t.titulo}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {t.nomeFuncionario}{t.dataDeVencimento ? ` · ${t.dataDeVencimento}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))
                  )}
                  {ts.length > 5 && (
                    <div className="px-5 py-3 text-center">
                      <button onClick={() => navigate(`/projetos/${p.id}`)}
                        className="text-[12px] font-semibold text-brand-teal hover:underline">
                        Ver todas as {ts.length} tarefas →
                      </button>
                    </div>
                  )}
                </div>

                {/* Equipe */}
                {equipe.length > 0 && (
                  <div className="px-5 py-3 border-t flex items-center gap-2"
                    style={{ borderColor: 'var(--border-default)' }}>
                    <p className="text-[11px] font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>Equipe:</p>
                    <div className="flex -space-x-1.5">
                      {equipe.slice(0, 6).map((f: any) => (
                        <div key={f.id} title={f.nomeCompleto}>
                          <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                        </div>
                      ))}
                      {equipe.length > 6 && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{equipe.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </>
      ) : (
        <EmptyState icon={<FolderKanban size={40} />} message="Nenhum projeto vinculado"
          sub="Aguarde o Gestor te vincular a um projeto ou atribuir uma tarefa." />
      )}

      {/* Minhas tarefas atribuídas */}
      {minhasTarefasAtribuidas.length > 0 && (
        <>
          <SectionDivider label="Minhas Tarefas Atribuídas" color="orange" />
          <Card delay="0.45s">
            <CardHeader>
              <div>
                <CardTitle>Tarefas atribuídas a mim</CardTitle>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {minhasTarefasAtribuidas.length} tarefa{minhasTarefasAtribuidas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardHeader>
            <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
              {minhasTarefasAtribuidas.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-orange">
                      {t.nomeProjeto}
                    </span>
                    <p className={`text-[13px] font-medium ${t.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--text-primary)' }}>
                      {t.titulo}
                    </p>
                    {t.dataDeVencimento && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Prazo: {t.dataDeVencimento}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={t.status} />
                    <select
                      value={t.status}
                      onChange={e => alterarStatus(t.id, e.target.value)}
                      className="text-[11px] font-semibold h-7 px-2 rounded-lg border outline-none cursor-pointer"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_ANDAMENTO">Em andamento</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Modal Nova Tarefa */}
      <Modal open={modalTarefa} onClose={() => { setModalTarefa(false); setErroT('') }} title="Nova Tarefa">
        {erroT && (
          <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
            <p className="text-[12.5px] text-rose-600">{erroT}</p>
          </div>
        )}
        <form onSubmit={handleCriarTarefa} className="space-y-4">
          {projetos.length > 1 && (
            <FormField label="Projeto">
              <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
                value={tarefaProj ?? ''}
                onChange={e => setTarefaProj(Number(e.target.value))}>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Título">
            <input className={inputClass} style={inputStyle} required
              placeholder="Ex: Implementar autenticação"
              value={fTarefa.titulo}
              onChange={e => setFTarefa(p => ({ ...p, titulo: e.target.value }))} />
          </FormField>
          <FormField label="Atribuir a">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }} required
              value={fTarefa.funcionarioId}
              onChange={e => setFTarefa(p => ({ ...p, funcionarioId: e.target.value }))}>
              <option value="">Selecionar funcionário</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
            </select>
          </FormField>
          <FormField label="Prazo (opcional)">
            <input type="date" className={inputClass} style={inputStyle}
              value={fTarefa.dataDeVencimento}
              onChange={e => setFTarefa(p => ({ ...p, dataDeVencimento: e.target.value }))} />
          </FormField>
          <FormField label="Descrição (opcional)">
            <textarea className={inputClass} style={{ ...inputStyle, height: 68, paddingTop: 8, resize: 'none' }}
              placeholder="Detalhes da tarefa..."
              value={fTarefa.descricao}
              onChange={e => setFTarefa(p => ({ ...p, descricao: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2.5 pt-2 border-t mt-5" style={{ borderColor: 'var(--border-default)' }}>
            <Btn variant="secondary" size="sm" type="button" onClick={() => setModalTarefa(false)}>Cancelar</Btn>
            <Btn size="sm" type="submit" loading={savingT}>Criar Tarefa</Btn>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}

function SectionDivider({ label, color }: { label: string; color: 'violet' | 'orange' }) {
  const cls = {
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    orange: 'bg-brand-orange-subtle border-orange-200 text-orange-700',
  }[color]
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
      <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${cls}`}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
    </div>
  )
}

export function GerenteDashboard() {
  return (
    <Routes>
      <Route index          element={<GerenteHome />} />
      <Route path="projeto" element={<GerenteProjeto />} />
      <Route path="tarefas" element={<GerenteTarefas />} />
      <Route path="relatorios" element={<GerenteRelatorios />} />
      <Route path="*"       element={<GerenteHome />} />
    </Routes>
  )
}