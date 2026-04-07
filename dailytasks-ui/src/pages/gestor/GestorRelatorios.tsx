import { useState, useEffect, useCallback } from 'react'
import { BarChart2, CheckSquare, Clock, AlertTriangle, Users, FolderKanban } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, StatCard, Avatar, StatusBadge, Spinner, ProgressBar } from '../../components/ui'
import { projetoApi, tarefaApi, funcionarioApi } from '../../api'
import type { Projeto, Tarefa, Funcionario } from '../../types'

export function GestorRelatorios() {
  const [projetos,     setProjetos]     = useState<Projeto[]>([])
  const [tarefas,      setTarefas]      = useState<Tarefa[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading,      setLoading]      = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rP, rF] = await Promise.all([projetoApi.listar(), funcionarioApi.listar()])
      const projs: Projeto[] = Array.isArray(rP.data) ? rP.data : []
      setProjetos(projs)
      setFuncionarios(Array.isArray(rF.data) ? rF.data : [])

      const reqs = await Promise.allSettled(projs.map(p => tarefaApi.listarPorProjeto(p.id)))
      const todas: Tarefa[] = []
      reqs.forEach(r => { if (r.status === 'fulfilled' && Array.isArray(r.value.data)) todas.push(...r.value.data) })
      setTarefas(todas)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* ── Métricas gerais ── */
  const total      = tarefas.length
  const concluidas = tarefas.filter(t => t.status === 'CONCLUIDA').length
  const andamento  = tarefas.filter(t => t.status === 'EM_ANDAMENTO').length
  const pendentes  = tarefas.filter(t => t.status === 'PENDENTE').length
  const bloqueadas = tarefas.filter(t => t.status === 'BLOQUEADA').length
  const hoje       = new Date().toISOString().split('T')[0]
  const atrasadas  = tarefas.filter(t =>
    t.dataDeVencimento &&
    t.dataDeVencimento < hoje &&
    t.status !== 'CONCLUIDA' &&
    t.status !== 'CANCELADA'
  ).length

  /* ── Ranking de funcionários ── */
  const rankingFunc = funcionarios.map(f => {
    const minhas     = tarefas.filter(t => t.funcionarioId === f.id)
    const feitas     = minhas.filter(t => t.status === 'CONCLUIDA').length
    const emAndamento = minhas.filter(t => t.status === 'EM_ANDAMENTO').length
    const atrasadasF = minhas.filter(t =>
      t.dataDeVencimento && t.dataDeVencimento < hoje &&
      t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'
    ).length
    return { ...f, total: minhas.length, feitas, emAndamento, atrasadasF }
  }).filter(f => f.total > 0).sort((a, b) => b.feitas - a.feitas)

  /* ── Progresso por projeto ── */
  const progressoProjetos = projetos.map(p => {
    const ts      = tarefas.filter(t => t.projetoId === p.id)
    const feitas  = ts.filter(t => t.status === 'CONCLUIDA').length
    const pct     = ts.length ? Math.round(feitas / ts.length * 100) : 0
    const atrasP  = ts.filter(t =>
      t.dataDeVencimento && t.dataDeVencimento < hoje &&
      t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'
    ).length
    return { ...p, total: ts.length, feitas, pct, atrasadas: atrasP }
  })

  /* ── Distribuição de status ── */
  const distribuicao = [
    { label: 'Concluídas',   value: concluidas, color: '#22c55e', pct: total ? Math.round(concluidas / total * 100) : 0 },
    { label: 'Em andamento', value: andamento,  color: '#3b82f6', pct: total ? Math.round(andamento  / total * 100) : 0 },
    { label: 'Pendentes',    value: pendentes,  color: '#f59e0b', pct: total ? Math.round(pendentes  / total * 100) : 0 },
    { label: 'Bloqueadas',   value: bloqueadas, color: '#ef4444', pct: total ? Math.round(bloqueadas / total * 100) : 0 },
  ]

  if (loading) return (
    <DashboardLayout title="Relatórios" breadcrumb="Gestor · Relatórios">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Relatórios" breadcrumb="Gestor · Relatórios">

      {/* Stats gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de tarefas" value={total}
          icon={<CheckSquare size={16} className="text-brand-teal" />}
          accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
        <StatCard label="Concluídas" value={concluidas}
          sub={total > 0 ? `<strong>${Math.round(concluidas / total * 100)}%</strong> do total` : '—'}
          icon={<CheckSquare size={16} className="text-emerald-600" />}
          accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.10s" />
        <StatCard label="Em andamento" value={andamento}
          icon={<Clock size={16} className="text-blue-600" />}
          accentColor="bg-blue-500" iconBg="bg-blue-50" delay="0.15s" />
        <StatCard label="Atrasadas" value={atrasadas}
          icon={<AlertTriangle size={16} className="text-rose-600" />}
          accentColor="bg-rose-500" iconBg="bg-rose-50" delay="0.20s" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Distribuição de status */}
        <Card delay="0.25s">
          <CardHeader>
            <CardTitle>Distribuição por status</CardTitle>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{total} tarefas no total</p>
          </CardHeader>
          <div className="p-5 space-y-4">
            {distribuicao.map(d => (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {d.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>({d.pct}%)</span>
                  </div>
                </div>
                <ProgressBar pct={d.pct} color={d.color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Progresso por projeto */}
        <Card delay="0.30s">
          <CardHeader>
            <CardTitle>Progresso por projeto</CardTitle>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{projetos.length} projetos</p>
          </CardHeader>
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {progressoProjetos.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Nenhum projeto com tarefas</p>
              </div>
            ) : progressoProjetos.map(p => (
              <div key={p.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={13} className="text-brand-teal flex-shrink-0" />
                    <span className="text-[13px] font-medium truncate max-w-[180px]"
                      style={{ color: 'var(--text-primary)' }}>
                      {p.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {p.feitas}/{p.total}
                    </span>
                    <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {p.pct}%
                    </span>
                  </div>
                </div>
                <ProgressBar pct={p.pct} />
                {p.atrasadas > 0 && (
                  <p className="text-[11px] mt-1 text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={10} /> {p.atrasadas} tarefa{p.atrasadas !== 1 ? 's' : ''} atrasada{p.atrasadas !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ranking de funcionários */}
      <Card delay="0.35s">
        <CardHeader>
          <div>
            <CardTitle>Desempenho da equipe</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Ordenado por tarefas concluídas
            </p>
          </div>
          <Users size={16} className="text-brand-teal" />
        </CardHeader>

        {rankingFunc.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Nenhuma tarefa atribuída ainda
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['#', 'Funcionário', 'Total', 'Concluídas', 'Em andamento', 'Atrasadas', 'Taxa'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankingFunc.map((f, i) => {
                  const taxa = f.total > 0 ? Math.round(f.feitas / f.total * 100) : 0
                  return (
                    <tr key={f.id} className="transition-colors hover:bg-slate-50/50"
                      style={{ borderBottom: i < rankingFunc.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                      <td className="px-5 py-3">
                        <span className={`text-[12px] font-bold ${
                          i === 0 ? 'text-amber-500' :
                          i === 1 ? 'text-slate-400' :
                          i === 2 ? 'text-orange-600' : ''
                        }`} style={i > 2 ? { color: 'var(--text-muted)' } : undefined}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                          <div>
                            <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                              {f.nomeCompleto}
                            </p>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {f.total}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-semibold text-emerald-600">{f.feitas}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-semibold text-blue-600">{f.emAndamento}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[12px] font-semibold ${f.atrasadasF > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {f.atrasadasF}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <ProgressBar pct={taxa} color={taxa >= 70 ? '#22c55e' : taxa >= 40 ? '#f59e0b' : '#ef4444'} />
                          </div>
                          <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            {taxa}%
                          </span>
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

    </DashboardLayout>
  )
}