import { useState, useEffect, useCallback } from 'react'
import { CheckSquare } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, StatusBadge, Avatar, EmptyState, Spinner } from '../../components/ui'
import { projetoApi, tarefaApi } from '../../api'
import type { Projeto, Tarefa, TaskStatus } from '../../types'
import { STATUS_LABEL } from '../../types'

export function GestorTarefas() {
  const [projetos,   setProjetos]   = useState<Projeto[]>([])
  const [tarefas,    setTarefas]    = useState<Tarefa[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filtro,     setFiltro]     = useState<TaskStatus | 'TODAS'>('TODAS')
  const [projetoFiltro, setProjetoFiltro] = useState<number | 'TODOS'>('TODOS')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const rP = await projetoApi.listar()
      setProjetos(rP.data)
      const reqs = await Promise.allSettled(rP.data.map((p: Projeto) => tarefaApi.listarPorProjeto(p.id)))
      const todas: Tarefa[] = []
      reqs.forEach(r => { if (r.status === 'fulfilled') todas.push(...r.value.data) })
      setTarefas(todas)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const tarefasFiltradas = tarefas
    .filter(t => filtro === 'TODAS' || t.status === filtro)
    .filter(t => projetoFiltro === 'TODOS' || t.projetoId === projetoFiltro)

  const STATUS_OPTIONS: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA', 'CANCELADA']

  if (loading) return (
    <DashboardLayout title="Tarefas" breadcrumb="Gestor · Tarefas">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Tarefas" breadcrumb="Gestor · Tarefas">

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Todas as tarefas</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {tarefasFiltradas.length} tarefa{tarefasFiltradas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="text-[12px] h-8 px-2.5 rounded-lg border outline-none cursor-pointer"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              value={projetoFiltro}
              onChange={e => setProjetoFiltro(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}>
              <option value="TODOS">Todos os projetos</option>
              {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select
              className="text-[12px] h-8 px-2.5 rounded-lg border outline-none cursor-pointer"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              value={filtro}
              onChange={e => setFiltro(e.target.value as TaskStatus | 'TODAS')}>
              <option value="TODAS">Todos os status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </CardHeader>

        {tarefasFiltradas.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<CheckSquare size={36} />} message="Nenhuma tarefa encontrada" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Tarefa', 'Projeto', 'Responsável', 'Prazo', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tarefasFiltradas.map((t, i) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50/50"
                    style={{ borderBottom: i < tarefasFiltradas.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.titulo}</p>
                      {t.descricao && <p className="text-[11px] truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{t.descricao}</p>}
                    </td>
                    <td className="px-5 py-3 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{t.nomeProjeto}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={t.nomeFuncionario} size="sm" />
                        <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{t.nomeFuncionario}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                      {t.dataDeVencimento ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}