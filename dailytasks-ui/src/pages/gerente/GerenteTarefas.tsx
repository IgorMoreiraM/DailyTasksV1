import { useState, useEffect, useCallback } from 'react'
import { CheckSquare, AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, StatusBadge, EmptyState, Spinner } from '../../components/ui'
import { projetoApi, tarefaApi } from '../../api'
import type { Projeto, Tarefa, TaskStatus } from '../../types'
import { STATUS_LABEL } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

function formatarData(data: string): string {
  if (!data) return ''
  const partes = data.substring(0, 10).split('-')
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

export function GerenteTarefas() {
  const { username } = useAuth()
  const [tarefas,  setTarefas]  = useState<Tarefa[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filtro,   setFiltro]   = useState<TaskStatus | 'TODAS'>('TODAS')
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const rP = await projetoApi.listar()
      const reqs = await Promise.allSettled(rP.data.map((p: Projeto) => tarefaApi.listarPorProjeto(p.id)))
      const minhas: Tarefa[] = []
      reqs.forEach(r => {
        if (r.status === 'fulfilled') {
          r.value.data.forEach((t: Tarefa) => {
            if (t.nomeFuncionario?.toLowerCase().includes((username ?? '').toLowerCase())) {
              minhas.push(t)
            }
          })
        }
      })
      setTarefas(minhas)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [username])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleStatus(tarefa: Tarefa, status: TaskStatus) {
    setUpdating(tarefa.id)
    try {
      await tarefaApi.atualizar(tarefa.id, { status })
      setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, status } : t))
    } catch { alert('Erro ao atualizar.') }
    finally { setUpdating(null) }
  }

  const STATUS_OPTIONS: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA', 'CANCELADA']
  const filtradas = filtro === 'TODAS' ? tarefas : tarefas.filter(t => t.status === filtro)

  if (loading) return (
    <DashboardLayout title="Minhas Tarefas" breadcrumb="Gerente · Tarefas">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Minhas Tarefas" breadcrumb="Gerente · Como Funcionário">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tarefas atribuídas a mim</CardTitle>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {filtradas.length} tarefa{filtradas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['TODAS', ...STATUS_OPTIONS] as const).map(s => (
              <button key={s} onClick={() => setFiltro(s)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${filtro === s ? 'text-white border-brand-teal' : 'border-transparent'}`}
                style={filtro === s
                  ? { background: '#2a7a8a' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                {s === 'TODAS' ? 'Todas' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </CardHeader>

        {filtradas.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<CheckSquare size={36} />} message="Nenhuma tarefa encontrada" />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {filtradas.map(t => {
              const isAtrasada = t.dataDeVencimento
                && new Date(t.dataDeVencimento) < new Date()
                && t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'
              return (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 mt-1 ${
                    t.status === 'CONCLUIDA' ? 'bg-emerald-400' :
                    t.status === 'EM_ANDAMENTO' ? 'bg-blue-400' :
                    t.status === 'BLOQUEADA' ? 'bg-rose-400' :
                    t.status === 'CANCELADA' ? 'bg-slate-300' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-teal mb-0.5">{t.nomeProjeto}</p>
                    <p className={`text-[13.5px] font-semibold ${t.status === 'CONCLUIDA' ? 'line-through opacity-50' : ''}`}
                      style={{ color: 'var(--text-primary)' }}>{t.titulo}</p>
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
                      <select value={t.status} onChange={e => handleStatus(t, e.target.value as TaskStatus)}
                        className="text-[11px] font-semibold h-8 pl-2.5 pr-6 rounded-lg border outline-none cursor-pointer"
                        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)', minWidth: 120 }}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
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