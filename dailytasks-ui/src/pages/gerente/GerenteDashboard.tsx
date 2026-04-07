import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { FolderKanban, CheckSquare, Plus, Star, User, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card, CardHeader, CardTitle, Btn, Modal, FormField,
         StatusBadge, Avatar, EmptyState, Spinner, ProgressBar,
         inputClass, inputStyle } from '../../components/ui'
import { projetoApi, tarefaApi, funcionarioApi } from '../../api'
import type { Projeto, Tarefa, Funcionario, ProjetoPapel } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { GerenteProjeto }  from './GerenteProjeto'
import { GerenteTarefas }  from './GerenteTarefas'

function GerenteHome() {
  const { username } = useAuth()
  const navigate = useNavigate()

  const [projetos,     setProjetos]     = useState<Projeto[]>([])
  const [membros,      setMembros]      = useState<Record<number, any[]>>({})
  const [tarefas,      setTarefas]      = useState<Record<number, Tarefa[]>>({})
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading,      setLoading]      = useState(true)

  const [modalTarefa, setModalTarefa] = useState(false)
  const [tarefaProj,  setTarefaProj]  = useState<number | null>(null)
  const [fTarefa,     setFTarefa]     = useState({ titulo: '', descricao: '', dataDeVencimento: '', funcionarioId: '' })
  const [savingT,     setSavingT]     = useState(false)
  const [erroT,       setErroT]       = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rP, rF] = await Promise.all([projetoApi.listar(), funcionarioApi.listar()])
      const projs: Projeto[] = rP.data
      setProjetos(projs)
      setFuncionarios(rF.data)

      const [membrosResults, tarefasResults] = await Promise.all([
        Promise.allSettled(projs.map(p => projetoApi.listarMembros(p.id))),
        Promise.allSettled(projs.map(p => tarefaApi.listarPorProjeto(p.id))),
      ])

      const mMap: Record<number, any[]>     = {}
      const tMap: Record<number, Tarefa[]>  = {}
      projs.forEach((p, i) => {
        if (membrosResults[i].status === 'fulfilled') mMap[p.id] = (membrosResults[i] as any).value.data
        if (tarefasResults[i].status === 'fulfilled') tMap[p.id] = (tarefasResults[i] as any).value.data
      })
      setMembros(mMap)
      setTarefas(tMap)
    } catch (err) {
      console.error('Erro GerenteDashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function meuPapel(projetoId: number): ProjetoPapel | null {
    const lista   = membros[projetoId] ?? []
    const vinculo = lista.find(m => m.funcionario?.username === username)
    return vinculo?.papel ?? null
  }

  const projetosLider       = projetos.filter(p => meuPapel(p.id) === 'LIDER_PROJETO')
  const projetosColaborador = projetos.filter(p => meuPapel(p.id) === 'COLABORADOR')

  const minhasTarefas = projetosColaborador.flatMap(p =>
    (tarefas[p.id] ?? []).filter(t =>
      t.nomeFuncionario?.toLowerCase().includes((username ?? '').toLowerCase())
    )
  )

  function abrirModalTarefa(projetoId: number) {
    setTarefaProj(projetoId)
    setModalTarefa(true)
  }

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
      fetchAll()
    } catch (err: any) {
      setErroT(err?.response?.data ?? 'Erro ao criar tarefa.')
    } finally { setSavingT(false) }
  }

  async function alterarStatus(tarefaId: number, status: string) {
    try {
      await tarefaApi.atualizar(tarefaId, { status: status as any })
      fetchAll()
    } catch { alert('Não foi possível atualizar o status.') }
  }

  const totalTarefasLider = projetosLider.reduce((acc, p) => acc + (tarefas[p.id]?.length ?? 0), 0)
  const concluidasLider   = projetosLider.reduce((acc, p) =>
    acc + (tarefas[p.id]?.filter(t => t.status === 'CONCLUIDA').length ?? 0), 0)

  const actions = (
    <Btn size="sm" icon={<Plus size={13} />}
      onClick={() => projetosLider.length > 0 && abrirModalTarefa(projetosLider[0].id)}
      disabled={projetosLider.length === 0}>
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
        <StatCard label="Projetos liderados" value={projetosLider.length}
          icon={<Star size={16} className="text-brand-teal" />}
          accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
        <StatCard label="Tarefas nos projetos" value={totalTarefasLider}
          icon={<CheckSquare size={16} className="text-violet-600" />}
          accentColor="bg-violet-500" iconBg="bg-violet-50" delay="0.10s" />
        <StatCard label="Concluídas" value={concluidasLider}
          sub={totalTarefasLider > 0 ? `<strong>${Math.round(concluidasLider / totalTarefasLider * 100)}%</strong>` : '—'}
          icon={<CheckSquare size={16} className="text-emerald-600" />}
          accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.15s" />
        <StatCard label="Minhas tarefas" value={minhasTarefas.length}
          sub="Em outros projetos"
          icon={<User size={16} className="text-brand-orange" />}
          accentColor="bg-brand-orange" iconBg="bg-brand-orange-subtle" delay="0.20s" />
      </div>

      {/* ── SEÇÃO: COMO GERENTE ── */}
      {projetosLider.length > 0 && (
        <>
          <SectionDivider label="Gerente de Projeto" color="violet" />

          {projetosLider.map(p => {
            const ts    = tarefas[p.id] ?? []
            const pct   = ts.length ? Math.round(ts.filter(t => t.status === 'CONCLUIDA').length / ts.length * 100) : 0
            const equipe = (membros[p.id] ?? []).map((m: any) => m.funcionario).filter(Boolean)

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

                {/* Tarefas do projeto */}
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
      )}

      {/* ── SEÇÃO: COMO FUNCIONÁRIO ── */}
      {projetosColaborador.length > 0 && (
        <>
          <SectionDivider label="Funcionário em outros projetos" color="orange" />

          <Card delay="0.45s">
            <CardHeader>
              <div>
                <CardTitle>Minhas tarefas atribuídas</CardTitle>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {minhasTarefas.length} tarefa{minhasTarefas.length !== 1 ? 's' : ''} em {projetosColaborador.length} projeto{projetosColaborador.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardHeader>

            {minhasTarefas.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={<CheckSquare size={32} />} message="Nenhuma tarefa atribuída"
                  sub="Você não possui tarefas nesses projetos ainda." />
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                {minhasTarefas.map(t => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-brand-orange">
                        {t.nomeProjeto}
                      </span>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {t.titulo}
                      </p>
                      {t.dataDeVencimento && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Prazo: {t.dataDeVencimento}
                        </p>
                      )}
                    </div>
                    <select
                      value={t.status}
                      onChange={e => alterarStatus(t.id, e.target.value)}
                      className="text-[11px] font-semibold h-8 px-2.5 rounded-lg border outline-none cursor-pointer"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_ANDAMENTO">Em andamento</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Estado vazio geral */}
      {projetos.length === 0 && (
        <EmptyState icon={<FolderKanban size={40} />} message="Nenhum projeto vinculado"
          sub="Aguarde o Gestor te vincular a um projeto." />
      )}

      {/* Modal: Nova Tarefa */}
      <Modal open={modalTarefa} onClose={() => { setModalTarefa(false); setErroT('') }} title="Nova Tarefa">
        {erroT && (
          <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
            <p className="text-[12.5px] text-rose-600">{erroT}</p>
          </div>
        )}
        <form onSubmit={handleCriarTarefa} className="space-y-4">
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
      <Route index             element={<GerenteHome />} />
      <Route path="projeto"    element={<GerenteProjeto />} />
      <Route path="tarefas"    element={<GerenteTarefas />} />
      <Route path="*"          element={<GerenteHome />} />
    </Routes>
  )
}