import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, EmptyState, Spinner, ProgressBar, Avatar } from '../../components/ui'
import { projetoApi, tarefaApi } from '../../api'
import type { Projeto, Tarefa } from '../../types'

export function GerenteProjeto() {
  const navigate = useNavigate()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [membros,  setMembros]  = useState<Record<number, any[]>>({})
  const [tarefas,  setTarefas]  = useState<Record<number, Tarefa[]>>({})
  const [loading,  setLoading]  = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const rP = await projetoApi.listar()
      const projs: Projeto[] = Array.isArray(rP.data) ? rP.data : []
      setProjetos(projs)

      const [mRes, tRes] = await Promise.all([
        Promise.allSettled(projs.map(p => projetoApi.listarMembros(p.id))),
        Promise.allSettled(projs.map(p => tarefaApi.listarPorProjeto(p.id))),
      ])

      const mMap: Record<number, any[]>    = {}
      const tMap: Record<number, Tarefa[]> = {}
      projs.forEach((p, i) => {
        mMap[p.id] = mRes[i].status === 'fulfilled' ? (mRes[i] as any).value.data ?? [] : []
        tMap[p.id] = tRes[i].status === 'fulfilled' ? (tRes[i] as any).value.data ?? [] : []
      })
      setMembros(mMap)
      setTarefas(tMap)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Exibe todos os projetos retornados — backend já filtra pelo gerente logado
  if (loading) return (
    <DashboardLayout title="Meu Projeto" breadcrumb="Gerente · Projeto">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Meu Projeto" breadcrumb="Gerente · Projeto">
      {projetos.length === 0 ? (
        <EmptyState icon={<FolderKanban size={40} />} message="Nenhum projeto vinculado"
          sub="Aguarde o Gestor te vincular a um projeto ou atribuir uma tarefa." />
      ) : (
        <div className="flex flex-col gap-5">
          {projetos.map(p => {
            const ts     = tarefas[p.id] ?? []
            const pct    = ts.length ? Math.round(ts.filter(t => t.status === 'CONCLUIDA').length / ts.length * 100) : 0
            const equipe = (membros[p.id] ?? []).map((m: any) => m.funcionario).filter(Boolean)

            return (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <FolderKanban size={16} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle>{p.nome}</CardTitle>
                      <div className="flex items-center gap-3 mt-1">
                        <ProgressBar pct={pct} color="#7c3aed" />
                        <span className="text-[11px] font-semibold text-violet-600">{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/projetos/${p.id}`)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl border transition-all"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                    <ExternalLink size={13} /> Ver Kanban
                  </button>
                </CardHeader>

                <div className="px-5 py-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total',        value: ts.length },
                      { label: 'Concluídas',   value: ts.filter(t => t.status === 'CONCLUIDA').length },
                      { label: 'Em andamento', value: ts.filter(t => t.status === 'EM_ANDAMENTO').length },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
                        <p className="font-display font-bold text-[22px]" style={{ color: 'var(--text-primary)' }}>{m.value}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {equipe.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Equipe</p>
                      <div className="flex -space-x-1.5">
                        {equipe.slice(0, 8).map((f: any) => (
                          <div key={f.id} title={f.nomeCompleto}>
                            <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                          </div>
                        ))}
                        {equipe.length > 8 && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            +{equipe.length - 8}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}