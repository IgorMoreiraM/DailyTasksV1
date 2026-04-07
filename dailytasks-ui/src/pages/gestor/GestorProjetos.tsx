import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Trash2, CheckCircle2, Filter } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Btn, EmptyState, Spinner, ProgressBar } from '../../components/ui'
import { projetoApi, tarefaApi } from '../../api'
import type { Projeto, Tarefa } from '../../types'

function formatarData(data: string): string {
  if (!data) return ''
  const partes = data.substring(0, 10).split('-')
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

export function GestorProjetos() {
  const navigate = useNavigate()
  const [projetos,    setProjetos]    = useState<Projeto[]>([])
  const [allTarefas,  setAllTarefas]  = useState<Tarefa[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filtro,      setFiltro]      = useState<'ativos' | 'concluidos' | 'todos'>('ativos')
  const [modalProjeto, setModalProjeto] = useState(false)
  const [fProjeto,    setFProjeto]    = useState({ nome: '', descricao: '' })
  const [saving,      setSaving]      = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const rP = await projetoApi.listar()
      setProjetos(rP.data)
      const reqs = await Promise.allSettled(rP.data.map((p: Projeto) => tarefaApi.listarPorProjeto(p.id)))
      const todas: Tarefa[] = []
      reqs.forEach(r => { if (r.status === 'fulfilled') todas.push(...r.value.data) })
      setAllTarefas(todas)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function progresso(projetoId: number) {
    const ts = allTarefas.filter(t => t.projetoId === projetoId)
    if (!ts.length) return 0
    return Math.round(ts.filter(t => t.status === 'CONCLUIDA').length / ts.length * 100)
  }

  function isConcluido(projetoId: number) {
    const ts = allTarefas.filter(t => t.projetoId === projetoId)
    return ts.length > 0 && ts.every(t => t.status === 'CONCLUIDA')
  }

  const projetosFiltrados = projetos.filter(p => {
    const concluido = isConcluido(p.id)
    if (filtro === 'ativos')     return !concluido
    if (filtro === 'concluidos') return concluido
    return true
  })

  const totalConcluidos = projetos.filter(p => isConcluido(p.id)).length
  const totalAtivos     = projetos.length - totalConcluidos

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      await projetoApi.criar(fProjeto)
      setModalProjeto(false)
      setFProjeto({ nome: '', descricao: '' })
      fetchAll()
    } catch { alert('Erro ao criar projeto.') }
    finally { setSaving(false) }
  }

  async function handleDeletar(p: Projeto) {
    if (!confirm(`Excluir "${p.nome}"?`)) return
    try { await projetoApi.deletar(p.id); fetchAll() }
    catch { alert('Erro ao excluir.') }
  }

  if (loading) return (
    <DashboardLayout title="Projetos" breadcrumb="Gestor · Projetos">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Projetos" breadcrumb="Gestor · Projetos"
      actions={
        <button onClick={() => setModalProjeto(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white"
          style={{ background: '#2a7a8a' }}>
          <Plus size={13} /> Novo Projeto
        </button>
      }>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-5">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {[
          { key: 'ativos',     label: `Ativos (${totalAtivos})` },
          { key: 'concluidos', label: `Concluídos (${totalConcluidos})` },
          { key: 'todos',      label: `Todos (${projetos.length})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key as any)}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all"
            style={filtro === f.key
              ? { background: '#2a7a8a', color: 'white', borderColor: '#2a7a8a' }
              : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtro === 'ativos' ? 'Projetos ativos' : filtro === 'concluidos' ? 'Projetos concluídos' : 'Todos os projetos'}
          </CardTitle>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {projetosFiltrados.length} projeto{projetosFiltrados.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>

        {projetosFiltrados.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<FolderKanban size={36} />}
              message={filtro === 'concluidos' ? 'Nenhum projeto concluído ainda' : 'Nenhum projeto ativo'}
              sub={filtro === 'ativos' ? 'Todos os projetos foram concluídos!' : undefined} />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {projetosFiltrados.map(p => {
              const pct       = progresso(p.id)
              const ts        = allTarefas.filter(t => t.projetoId === p.id)
              const concluido = isConcluido(p.id)
              return (
                <div key={p.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 group cursor-pointer transition-colors"
                  onClick={() => navigate(`/projetos/${p.id}`)}>

                  {/* Ícone */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    concluido ? 'bg-emerald-50' : 'bg-brand-teal-subtle'
                  }`}>
                    {concluido
                      ? <CheckCircle2 size={16} className="text-emerald-600" />
                      : <FolderKanban size={16} className="text-brand-teal" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.nome}
                      </p>
                      {concluido && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          CONCLUÍDO
                        </span>
                      )}
                    </div>
                    {p.descricao && (
                      <p className="text-[12px] truncate mb-1" style={{ color: 'var(--text-muted)' }}>
                        {p.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <ProgressBar pct={pct} color={concluido ? '#22c55e' : '#2a7a8a'} />
                      <span className="text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: concluido ? '#22c55e' : 'var(--text-muted)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Tarefas count */}
                  <p className="text-[12px] whitespace-nowrap hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    {ts.filter(t => t.status === 'CONCLUIDA').length}/{ts.length} tarefas
                  </p>

                  {/* Deletar */}
                  <button onClick={e => { e.stopPropagation(); handleDeletar(p) }}
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

      {/* Modal */}
      {modalProjeto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalProjeto(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <h3 className="font-display font-bold text-[17px] mb-5" style={{ color: 'var(--text-primary)' }}>
              Novo Projeto
            </h3>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Nome</label>
                <input required
                  className="w-full h-10 px-3.5 rounded-xl border text-[13.5px] outline-none focus:border-brand-teal"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  placeholder="Ex: Plataforma Alpha"
                  value={fProjeto.nome} onChange={e => setFProjeto(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Descrição</label>
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] outline-none focus:border-brand-teal"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', height: 76, resize: 'none' }}
                  placeholder="Objetivo do projeto..."
                  value={fProjeto.descricao} onChange={e => setFProjeto(p => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <Btn variant="secondary" size="sm" type="button" onClick={() => setModalProjeto(false)}>Cancelar</Btn>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
                  style={{ background: '#2a7a8a' }}>
                  {saving ? 'Criando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}