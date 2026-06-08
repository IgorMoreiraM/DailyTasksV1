import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { CheckSquare, Clock, FolderKanban, AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card, CardHeader, CardTitle, StatusBadge,
         EmptyState, Spinner } from '../../components/ui'
import { projetoApi, tarefaApi } from '../../api'
import type { Projeto, Tarefa, TaskStatus } from '../../types'
import { STATUS_LABEL } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_OPTIONS: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA', 'CANCELADA']

const STATUS_SELECT_COLOR: Record<TaskStatus, string> = {
  PENDENTE:     'border-amber-300   bg-amber-50   text-amber-700',
  EM_ANDAMENTO: 'border-blue-300    bg-blue-50    text-blue-700',
  CONCLUIDA:    'border-emerald-300 bg-emerald-50 text-emerald-700',
  BLOQUEADA:    'border-rose-300    bg-rose-50    text-rose-700',
  CANCELADA:    'border-slate-300   bg-slate-50   text-slate-600',
}

function formatarData(data: string): string {
  if (!data) return ''
  const partes = data.substring(0, 10).split('-')
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

/* ─────────────────────────────────────────
   Hook compartilhado de dados
───────────────────────────────────────── */
function useFuncionarioData() {
  const [projetos,  setProjetos]  = useState<Projeto[]>([])
  const [tarefas,   setTarefas]   = useState<Tarefa[]>([])
  const [loading,   setLoading]   = useState(true)
  const [updating,  setUpdating]  = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rP, rT] = await Promise.all([
        projetoApi.listar(),
        tarefaApi.listarMinhas(),
      ])
      setProjetos(Array.isArray(rP.data) ? rP.data : [])
      setTarefas(Array.isArray(rT.data) ? rT.data : [])
    } catch (err) {
      console.error('Erro FuncionarioDashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleStatusChange(tarefa: Tarefa, novoStatus: TaskStatus) {
    setUpdating(tarefa.id)
    try {
      await tarefaApi.atualizar(tarefa.id, { status: novoStatus })
      setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, status: novoStatus } : t))
    } catch {
      alert('Não foi possível atualizar o status.')
    } finally {
      setUpdating(null)
    }
  }

  return { projetos, tarefas, loading, updating, handleStatusChange }
}

/* ─────────────────────────────────────────
   Dashboard — visão geral com stats e projetos
───────────────────────────────────────── */
function FuncionarioHome() {
  const { username } = useAuth()
  const navigate = useNavigate()
  const { projetos, tarefas, loading } = useFuncionarioData()

  const pendentes  = tarefas.filter(t => t.status === 'PENDENTE').length
  const andamento  = tarefas.filter(t => t.status === 'EM_ANDAMENTO').length
  const concluidas = tarefas.filter(t => t.status === 'CONCLUIDA').length
  const atrasadas  = tarefas.filter(t => {
    if (!t.dataDeVencimento) return false
    return new Date(t.dataDeVencimento) < new Date()
      && t.status !== 'CONCLUIDA'
      && t.status !== 'CANCELADA'
  }).length

  if (loading) return (
    <DashboardLayout title="Dashboard" breadcrumb="Funcionário · Dashboard">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Dashboard" breadcrumb={`Funcionário · ${username}`}>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de tarefas" value={tarefas.length}
          icon={<CheckSquare size={16} className="text-brand-teal" />}
          accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
        <StatCard label="Em andamento" value={andamento}
          icon={<Clock size={16} className="text-blue-600" />}
          accentColor="bg-blue-500" iconBg="bg-blue-50" delay="0.10s" />
        <StatCard label="Concluídas" value={concluidas}
          sub={tarefas.length > 0 ? `<strong>${Math.round(concluidas / tarefas.length * 100)}%</strong> do total` : '—'}
          icon={<CheckSquare size={16} className="text-emerald-600" />}
          accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.15s" />
        <StatCard label="Atrasadas" value={atrasadas}
          icon={<AlertTriangle size={16} className="text-rose-600" />}
          accentColor="bg-rose-500" iconBg="bg-rose-50" delay="0.20s" />
      </div>

      {/* Projetos */}
      {projetos.length > 0 && (
        <Card delay="0.25s" className="mb-5">
          <CardHeader>
            <CardTitle>Projetos em que participo</CardTitle>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {projetos.length} projeto{projetos.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {projetos.map(p => (
              <button key={p.id} onClick={() => navigate(`/projetos/${p.id}`)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12.5px] font-medium transition-all hover:border-brand-teal hover:text-brand-teal"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                <FolderKanban size={13} />
                {p.nome}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  {tarefas.filter(t => t.projetoId === p.id).length}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Tarefas recentes — máx 5, link para ver todas */}
      <Card delay="0.35s">
        <CardHeader>
          <div>
            <CardTitle>Tarefas recentes</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''} atribuídas
            </p>
          </div>
          {tarefas.length > 5 && (
            <button onClick={() => navigate('/funcionario/tarefas')}
              className="text-[12px] font-semibold text-brand-teal hover:underline">
              Ver todas →
            </button>
          )}
        </CardHeader>

        {tarefas.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<CheckSquare size={36} />}
              message="Nenhuma tarefa atribuída"
              sub="Aguarde tarefas serem atribuídas pelo gerente."
            />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {tarefas.slice(0, 5).map(t => {
              const isAtrasada = t.dataDeVencimento
                && new Date(t.dataDeVencimento) < new Date()
                && t.status !== 'CONCLUIDA'
                && t.status !== 'CANCELADA'

              return (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 mt-1 ${
                    t.status === 'CONCLUIDA'    ? 'bg-emerald-400' :
                    t.status === 'EM_ANDAMENTO' ? 'bg-blue-400'    :
                    t.status === 'BLOQUEADA'    ? 'bg-rose-400'    :
                    t.status === 'CANCELADA'    ? 'bg-slate-300'   : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-teal mb-0.5">
                      {t.nomeProjeto}
                    </p>
                    <p className={`text-[13.5px] font-semibold ${t.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--text-primary)' }}>
                      {t.titulo}
                    </p>
                    {t.dataDeVencimento && (
                      <p className={`text-[11px] mt-1 flex items-center gap-1 ${isAtrasada ? 'text-rose-500 font-semibold' : ''}`}
                        style={!isAtrasada ? { color: 'var(--text-muted)' } : undefined}>
                        {isAtrasada && <AlertTriangle size={11} />}
                        {isAtrasada ? 'Atrasada · ' : 'Prazo: '}{formatarData(t.dataDeVencimento ?? '')}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {pendentes > 0 && (
        <p className="text-[12px] mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
          Você tem <strong className="text-amber-600">{pendentes}</strong> tarefa{pendentes !== 1 ? 's' : ''} pendente{pendentes !== 1 ? 's' : ''}.
        </p>
      )}

    </DashboardLayout>
  )
}

/* ─────────────────────────────────────────
   Minhas Tarefas — lista completa com filtros
───────────────────────────────────────── */
function FuncionarioTarefas() {
  const { tarefas, loading, updating, handleStatusChange } = useFuncionarioData()
  const [filterStatus, setFilter] = useState<TaskStatus | 'TODAS'>('TODAS')

  const tarefasFiltradas = filterStatus === 'TODAS'
    ? tarefas
    : tarefas.filter(t => t.status === filterStatus)

  if (loading) return (
    <DashboardLayout title="Minhas Tarefas" breadcrumb="Funcionário · Tarefas">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Minhas Tarefas" breadcrumb="Funcionário · Tarefas">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Fila de trabalho</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {tarefasFiltradas.length} tarefa{tarefasFiltradas.length !== 1 ? 's' : ''}
              {filterStatus !== 'TODAS' ? ` · ${STATUS_LABEL[filterStatus]}` : ''}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['TODAS', ...STATUS_OPTIONS] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all"
                style={filterStatus === s
                  ? { background: '#2a7a8a', color: 'white', borderColor: '#2a7a8a' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
                {s === 'TODAS' ? 'Todas' : STATUS_LABEL[s]}
                {s !== 'TODAS' && (
                  <span className="ml-1 opacity-60">{tarefas.filter(t => t.status === s).length}</span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        {tarefasFiltradas.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<CheckSquare size={36} />}
              message={filterStatus === 'TODAS' ? 'Nenhuma tarefa atribuída' : `Sem tarefas "${STATUS_LABEL[filterStatus as TaskStatus]}"`}
              sub={filterStatus === 'TODAS' ? 'Aguarde tarefas serem atribuídas pelo gerente.' : undefined}
            />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {tarefasFiltradas.map(t => {
              const isAtrasada = t.dataDeVencimento
                && new Date(t.dataDeVencimento) < new Date()
                && t.status !== 'CONCLUIDA'
                && t.status !== 'CANCELADA'

              return (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 mt-1 ${
                    t.status === 'CONCLUIDA'    ? 'bg-emerald-400' :
                    t.status === 'EM_ANDAMENTO' ? 'bg-blue-400'    :
                    t.status === 'BLOQUEADA'    ? 'bg-rose-400'    :
                    t.status === 'CANCELADA'    ? 'bg-slate-300'   : 'bg-amber-400'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-teal mb-0.5">
                      {t.nomeProjeto}
                    </p>
                    <p className={`text-[13.5px] font-semibold ${t.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--text-primary)' }}>
                      {t.titulo}
                    </p>
                    {t.descricao && (
                      <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                        {t.descricao}
                      </p>
                    )}
                    {t.dataDeVencimento && (
                      <p className={`text-[11px] mt-1 flex items-center gap-1 ${isAtrasada ? 'text-rose-500 font-semibold' : ''}`}
                        style={!isAtrasada ? { color: 'var(--text-muted)' } : undefined}>
                        {isAtrasada && <AlertTriangle size={11} />}
                        {isAtrasada ? 'Atrasada · ' : 'Prazo: '}{formatarData(t.dataDeVencimento ?? '')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge status={t.status} />
                    {updating === t.id ? (
                      <div className="h-8 w-28 flex items-center justify-center">
                        <span className="w-4 h-4 border-2 border-slate-200 border-t-brand-teal rounded-full animate-spin" />
                      </div>
                    ) : (
                      <select
                        value={t.status}
                        onChange={e => handleStatusChange(t, e.target.value as TaskStatus)}
                        className={`text-[11px] font-semibold h-8 pl-2.5 pr-7 rounded-lg border outline-none cursor-pointer appearance-none ${STATUS_SELECT_COLOR[t.status]}`}
                        style={{ minWidth: 120 }}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}

/* ─────────────────────────────────────────
   Router
───────────────────────────────────────── */
export function FuncionarioDashboard() {
  return (
    <Routes>
      <Route index          element={<FuncionarioHome />} />
      <Route path="tarefas" element={<FuncionarioTarefas />} />
      <Route path="*"       element={<FuncionarioHome />} />
    </Routes>
  )
}