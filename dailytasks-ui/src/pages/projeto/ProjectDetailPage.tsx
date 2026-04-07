/* ============================================================
   ProjectDetailPage — Kanban do projeto
   ============================================================ */

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, CheckCircle2, Calendar, MoreHorizontal, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Btn, Modal, FormField, Avatar, EmptyState, Spinner, StatusBadge,
         ProgressBar, inputClass, inputStyle } from '../../components/ui'
import { projetoApi, listaApi, tarefaApi, funcionarioApi } from '../../api'
import type { Projeto, Lista, Tarefa, Funcionario, TaskStatus } from '../../types'
import { STATUS_LABEL } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_OPTIONS: TaskStatus[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA', 'CANCELADA']

function formatarData(data: string): string {
  if (!data) return ''
  const partes = data.substring(0, 10).split('-')
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

export function ProjectDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { role, username } = useAuth()

  const [projeto,      setProjeto]      = useState<Projeto | null>(null)
  const [listas,       setListas]       = useState<Lista[]>([])
  const [tarefas,      setTarefas]      = useState<Tarefa[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading,      setLoading]      = useState(true)

  /* Modais criar */
  const [modalLista,  setModalLista]  = useState(false)
  const [modalTarefa, setModalTarefa] = useState(false)
  const [listaAlvo,   setListaAlvo]   = useState<number | null>(null)
  const [nomeLista,   setNomeLista]   = useState('')
  const [fTarefa,     setFTarefa]     = useState({ titulo: '', descricao: '', dataDeVencimento: '', funcionarioId: '' })
  const [savingL,     setSavingL]     = useState(false)
  const [savingT,     setSavingT]     = useState(false)
  const [erroT,       setErroT]       = useState('')

  /* Modal editar */
  const [modalEditar,     setModalEditar]     = useState(false)
  const [tarefaEditando,  setTarefaEditando]  = useState<Tarefa | null>(null)
  const [fEditar,         setFEditar]         = useState({ titulo: '', descricao: '', dataDeVencimento: '', funcionarioId: '', listaId: '' })
  const [savingE,         setSavingE]         = useState(false)
  const [erroE,           setErroE]           = useState('')

  const [filtro, setFiltro] = useState<'todas' | 'minhas' | 'hoje'>('todas')

  const fetchAll = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [rP, rL, rT, rF] = await Promise.all([
        projetoApi.detalhar(Number(id)),
        listaApi.listarPorProjeto(Number(id)),
        tarefaApi.listarPorProjeto(Number(id)),
        funcionarioApi.listar(),
      ])
      setProjeto(rP.data)
      const listasRaw = Array.isArray(rL.data) ? rL.data : []
      setListas(listasRaw.map((l: any) => ({ id: Number(l.id), nome: String(l.nome) })))
      setTarefas(Array.isArray(rT.data) ? rT.data : [])
      setFuncionarios(Array.isArray(rF.data) ? rF.data : [])
    } catch (err) {
      console.error('Erro ProjectDetailPage:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  /* Auto-refresh a cada 30s */
  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(), 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const podeGerenciar = role === 'MASTER' || role === 'GESTOR' || role === 'GERENTE'
  const podeEstrutura = role === 'MASTER' || role === 'GESTOR'

  /* ── Criar coluna ── */
  async function handleCriarLista(e: FormEvent) {
    e.preventDefault(); setSavingL(true)
    try {
      await listaApi.criar({ nome: nomeLista, projetoId: Number(id) })
      setModalLista(false); setNomeLista(''); fetchAll()
    } catch { alert('Erro ao criar coluna.') }
    finally { setSavingL(false) }
  }

  async function handleDeleteLista(listaId: number, nome: string) {
    if (!confirm(`Remover coluna "${nome}"?`)) return
    try { await listaApi.deletar(listaId); fetchAll() }
    catch { alert('Erro ao remover coluna.') }
  }

  /* ── Criar tarefa ── */
  async function handleCriarTarefa(e: FormEvent) {
    e.preventDefault()
    if (!fTarefa.funcionarioId) { setErroT('Selecione um responsável.'); return }
    setErroT(''); setSavingT(true)
    try {
      const payload: any = {
        titulo:        fTarefa.titulo.trim(),
        projetoId:     Number(id),
        funcionarioId: Number(fTarefa.funcionarioId),
        listaId:       listaAlvo ?? null,
      }
      if (fTarefa.descricao.trim())    payload.descricao        = fTarefa.descricao.trim()
      if (fTarefa.dataDeVencimento)    payload.dataDeVencimento = fTarefa.dataDeVencimento
      await tarefaApi.criar(payload)
      setSavingT(false)
      setFTarefa({ titulo: '', descricao: '', dataDeVencimento: '', funcionarioId: '' })
      setErroT('')
      setModalTarefa(false)
      fetchAll()
    } catch (err: any) {
      const msg = err?.response?.data
      setErroT(typeof msg === 'string' ? msg : 'Erro ao criar tarefa.')
      setSavingT(false)
    }
  }

  /* ── Editar tarefa ── */
  function abrirEditar(tarefa: Tarefa) {
    setTarefaEditando(tarefa)
    setFEditar({
      titulo:           tarefa.titulo,
      descricao:        tarefa.descricao ?? '',
      dataDeVencimento: tarefa.dataDeVencimento ? String(tarefa.dataDeVencimento).substring(0, 10) : '',
      funcionarioId:    String(tarefa.funcionarioId),
      listaId:          tarefa.listaId ? String(tarefa.listaId) : '',
    })
    setErroE('')
    setModalEditar(true)
  }

  async function handleEditarTarefa(e: FormEvent) {
    e.preventDefault()
    if (!tarefaEditando) return
    setErroE(''); setSavingE(true)
    try {
      const payload: any = {
        titulo:        fEditar.titulo.trim(),
        funcionarioId: Number(fEditar.funcionarioId),
        listaId:       fEditar.listaId ? Number(fEditar.listaId) : null,
        dataDeVencimento: fEditar.dataDeVencimento || null,
      }
      if (fEditar.descricao.trim()) payload.descricao = fEditar.descricao.trim()
      await tarefaApi.atualizar(tarefaEditando.id, payload)
      setModalEditar(false)
      setTarefaEditando(null)
      fetchAll()
    } catch (err: any) {
      setErroE(err?.response?.data ?? 'Erro ao editar tarefa.')
    } finally { setSavingE(false) }
  }

  /* ── Status e delete ── */
  async function alterarStatus(tarefa: Tarefa, status: TaskStatus) {
    try {
      await tarefaApi.atualizar(tarefa.id, { status })
      setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, status } : t))
    } catch { alert('Não foi possível atualizar.') }
  }

  async function deletarTarefa(tarefaId: number) {
    if (!confirm('Excluir tarefa?')) return
    try { await tarefaApi.deletar(tarefaId); setTarefas(prev => prev.filter(t => t.id !== tarefaId)) }
    catch { alert('Sem permissão.') }
  }

  const hoje = new Date().toISOString().split('T')[0]
  const tarefasFiltradas = tarefas.filter(t => {
    if (filtro === 'minhas') return t.nomeFuncionario?.toLowerCase().includes((username ?? '').toLowerCase())
    if (filtro === 'hoje')   return t.dataDeVencimento === hoje
    return true
  })

  const pct = tarefas.length
    ? Math.round(tarefas.filter(t => t.status === 'CONCLUIDA').length / tarefas.length * 100) : 0

  const actions = (
    <div className="flex items-center gap-2">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-brand-teal"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14}/> Voltar
      </button>
      {podeEstrutura && (
        <Btn variant="secondary" size="sm" icon={<Plus size={13}/>} onClick={() => setModalLista(true)}>
          Coluna
        </Btn>
      )}
      {podeGerenciar && listas.length > 0 && (
        <button
          onClick={() => { setListaAlvo(listas[0]?.id ?? null); setModalTarefa(true) }}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white"
          style={{ background: '#f97316' }}>
          <Plus size={13}/> Tarefa
        </button>
      )}
    </div>
  )

  if (loading) return (
    <DashboardLayout title="Carregando..." actions={actions}>
      <div className="flex justify-center py-20"><Spinner size={32}/></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title={projeto?.nome ?? 'Projeto'} breadcrumb={`Projeto · ${tarefas.length} tarefas`} actions={actions}>

      {/* Header */}
      <div className="rounded-2xl border px-5 py-4 mb-5 flex items-center gap-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] mb-2" style={{ color: 'var(--text-secondary)' }}>
            {projeto?.descricao || 'Sem descrição.'}
          </p>
          <div className="flex items-center gap-3">
            <ProgressBar pct={pct}/>
            <span className="text-[12px] font-semibold text-brand-teal whitespace-nowrap">{pct}%</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="font-display font-extrabold text-[26px] text-brand-teal leading-none">{pct}%</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {tarefas.filter(t => t.status === 'CONCLUIDA').length}/{tarefas.length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4">
        {(['todas', 'minhas', 'hoje'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all"
            style={filtro === f
              ? { background: '#2a7a8a', color: 'white', borderColor: '#2a7a8a' }
              : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
            {{ todas: `Todas (${tarefas.length})`, minhas: 'Minhas', hoje: 'Hoje' }[f]}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {listas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal-subtle flex items-center justify-center">
            <Plus size={28} className="text-brand-teal"/>
          </div>
          <p className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>Nenhuma coluna criada</p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {podeEstrutura ? 'Crie a primeira coluna para organizar as tarefas.' : 'Aguardando o gestor criar colunas.'}
          </p>
          {podeEstrutura && (
            <button onClick={() => setModalLista(true)}
              className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-xl text-white"
              style={{ background: '#2a7a8a' }}>
              <Plus size={14}/> Criar primeira coluna
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll items-start">
          {listas.map(lista => {
            const cols = tarefasFiltradas.filter(t => t.listaId === lista.id)
            return (
              <div key={lista.id} className="min-w-[290px] max-w-[290px] flex-shrink-0 flex flex-col gap-2.5 group/col">
                {/* Cabeçalho da coluna */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ background: '#2a7a8a' }}/>
                    <h3 className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      {lista.nome}
                    </h3>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                      {cols.length}
                    </span>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    {podeGerenciar && (
                      <button onClick={() => { setListaAlvo(lista.id); setModalTarefa(true) }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-all"
                        style={{ color: 'var(--text-muted)' }}>
                        <Plus size={13}/>
                      </button>
                    )}
                    {podeEstrutura && (
                      <button onClick={() => handleDeleteLista(lista.id, lista.nome)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all"
                        style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards */}
                <div className="rounded-xl border p-2 flex flex-col gap-2 min-h-[200px]"
                  style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}>
                  {cols.map(t => (
                    <KanbanCard key={t.id} tarefa={t} podeGerenciar={podeGerenciar}
                      onStatusChange={alterarStatus}
                      onDelete={deletarTarefa}
                      onEditar={abrirEditar}
                    />
                  ))}
                  {podeGerenciar && (
                    <button onClick={() => { setListaAlvo(lista.id); setModalTarefa(true) }}
                      className="w-full py-2.5 rounded-lg border-2 border-dashed text-[11.5px] font-medium flex items-center justify-center gap-1.5 transition-all hover:border-brand-teal hover:text-brand-teal"
                      style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
                      <Plus size={13}/> Adicionar tarefa
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: Nova Coluna ── */}
      <Modal open={modalLista} onClose={() => { setModalLista(false); setNomeLista('') }} title="Nova Coluna">
        <form onSubmit={handleCriarLista} className="space-y-4">
          <FormField label="Nome da coluna">
            <input autoFocus className={inputClass} style={inputStyle} required
              placeholder="Ex: Em revisão"
              value={nomeLista} onChange={e => setNomeLista(e.target.value)} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <Btn variant="secondary" size="sm" type="button" onClick={() => setModalLista(false)}>Cancelar</Btn>
            <button type="submit" disabled={savingL}
              className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
              style={{ background: '#2a7a8a' }}>
              {savingL ? 'Criando...' : 'Criar Coluna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Nova Tarefa ── */}
      <Modal open={modalTarefa} onClose={() => { setModalTarefa(false); setErroT('') }} title="Nova Tarefa">
        {erroT && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0"/>
            <p className="text-[12.5px] text-rose-600">{erroT}</p>
          </div>
        )}
        <form onSubmit={handleCriarTarefa} className="space-y-4">
          <FormField label="Título *">
            <input className={inputClass} style={inputStyle} required
              placeholder="Ex: Criar endpoint de login"
              value={fTarefa.titulo} onChange={e => setFTarefa(p => ({ ...p, titulo: e.target.value }))} />
          </FormField>
          <FormField label="Coluna">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
              value={listaAlvo ?? ''} onChange={e => setListaAlvo(Number(e.target.value))}>
              <option value="">Sem coluna</option>
              {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Responsável *">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }} required
              value={fTarefa.funcionarioId} onChange={e => setFTarefa(p => ({ ...p, funcionarioId: e.target.value }))}>
              <option value="">Selecionar funcionário</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nomeCompleto} ({f.role})</option>)}
            </select>
          </FormField>
          <FormField label="Prazo (opcional)">
            <input type="date" className={inputClass} style={inputStyle}
              value={fTarefa.dataDeVencimento}
              onChange={e => setFTarefa(p => ({ ...p, dataDeVencimento: e.target.value }))} />
          </FormField>
          <FormField label="Descrição (opcional)">
            <textarea className={inputClass} style={{ ...inputStyle, height: 68, paddingTop: 8, resize: 'none' }}
              placeholder="Detalhes..."
              value={fTarefa.descricao} onChange={e => setFTarefa(p => ({ ...p, descricao: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <Btn variant="secondary" size="sm" type="button" onClick={() => setModalTarefa(false)}>Cancelar</Btn>
            <button type="submit" disabled={savingT}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
              style={{ background: '#f97316' }}>
              {savingT ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar Tarefa ── */}
      <Modal open={modalEditar} onClose={() => { setModalEditar(false); setErroE('') }} title="Editar Tarefa">
        {erroE && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-rose-500 flex-shrink-0"/>
            <p className="text-[12.5px] text-rose-600">{erroE}</p>
          </div>
        )}
        <form onSubmit={handleEditarTarefa} className="space-y-4">
          <FormField label="Título *">
            <input className={inputClass} style={inputStyle} required
              value={fEditar.titulo}
              onChange={e => setFEditar(p => ({ ...p, titulo: e.target.value }))} />
          </FormField>
          <FormField label="Coluna">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
              value={fEditar.listaId}
              onChange={e => setFEditar(p => ({ ...p, listaId: e.target.value }))}>
              <option value="">Sem coluna</option>
              {listas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Responsável *">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }} required
              value={fEditar.funcionarioId}
              onChange={e => setFEditar(p => ({ ...p, funcionarioId: e.target.value }))}>
              <option value="">Selecionar</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nomeCompleto} ({f.role})</option>)}
            </select>
          </FormField>
          <FormField label="Prazo">
            <input type="date" className={inputClass} style={inputStyle}
              value={fEditar.dataDeVencimento}
              onChange={e => setFEditar(p => ({ ...p, dataDeVencimento: e.target.value }))} />
          </FormField>
          <FormField label="Descrição">
            <textarea className={inputClass} style={{ ...inputStyle, height: 68, paddingTop: 8, resize: 'none' }}
              value={fEditar.descricao}
              onChange={e => setFEditar(p => ({ ...p, descricao: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <Btn variant="secondary" size="sm" type="button" onClick={() => setModalEditar(false)}>Cancelar</Btn>
            <button type="submit" disabled={savingE}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
              style={{ background: '#2a7a8a' }}>
              {savingE ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}

/* ── Kanban Card ── */
function KanbanCard({ tarefa, podeGerenciar, onStatusChange, onDelete, onEditar }: {
  tarefa: Tarefa
  podeGerenciar: boolean
  onStatusChange: (t: Tarefa, s: TaskStatus) => void
  onDelete:  (id: number) => void
  onEditar:  (t: Tarefa) => void
}) {
  const [open, setOpen]       = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef                = useRef<HTMLButtonElement>(null)

  const isAtrasada = tarefa.dataDeVencimento
    && new Date(tarefa.dataDeVencimento) < new Date()
    && tarefa.status !== 'CONCLUIDA'
    && tarefa.status !== 'CANCELADA'

  const barColor: Record<TaskStatus, string> = {
    CONCLUIDA:    'bg-emerald-400',
    EM_ANDAMENTO: 'bg-blue-400',
    BLOQUEADA:    'bg-rose-400',
    CANCELADA:    'bg-slate-300',
    PENDENTE:     'bg-amber-400',
  }

  function handleOpenMenu() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({
        top:  rect.bottom + window.scrollY + 4,
        left: rect.right  + window.scrollX - 160,
      })
    }
    setOpen(v => !v)
  }

  return (
    <>
      <div
        className={`rounded-xl border p-3 group/card relative transition-all hover:-translate-y-0.5 hover:shadow-sm ${tarefa.status === 'CONCLUIDA' ? 'opacity-60' : ''}`}
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${barColor[tarefa.status]}`} />

        {/* Título */}
        <p className={`text-[13px] font-semibold mb-1.5 pl-2 pr-6 ${tarefa.status === 'CONCLUIDA' ? 'line-through' : ''}`}
          style={{ color: 'var(--text-primary)' }}>
          {tarefa.titulo}
        </p>

        {tarefa.descricao && (
          <p className="text-[11px] pl-2 mb-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {tarefa.descricao}
          </p>
        )}

        {/* Status badge */}
        <div className="pl-2 mb-2">
          <StatusBadge status={tarefa.status} />
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-1.5">
            <Avatar name={tarefa.nomeFuncionario} size="sm"/>
            <span className="text-[10.5px] truncate max-w-[80px]" style={{ color: 'var(--text-muted)' }}>
              {tarefa.nomeFuncionario?.split(' ')[0]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {tarefa.dataDeVencimento && (
              <span className={`text-[10px] flex items-center gap-0.5 ${isAtrasada ? 'text-rose-500 font-bold' : ''}`}
                style={!isAtrasada ? { color: 'var(--text-muted)' } : undefined}>
                <Calendar size={9}/>
                {formatarData(String(tarefa.dataDeVencimento))}
              </span>
            )}
            {tarefa.status === 'CONCLUIDA' && <CheckCircle2 size={12} className="text-emerald-500"/>}
          </div>
        </div>

        {/* Botão menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button ref={btnRef} onClick={handleOpenMenu}
            className="p-1 rounded hover:bg-slate-100 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <MoreHorizontal size={13}/>
          </button>
        </div>
      </div>

      {/* Menu via portal */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed z-50 rounded-xl border shadow-xl py-1 min-w-[160px]"
            style={{ top: menuPos.top, left: menuPos.left, background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>

            <p className="text-[10px] font-bold uppercase tracking-wide px-3.5 pt-2 pb-1"
              style={{ color: 'var(--text-muted)' }}>
              Alterar status
            </p>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => { onStatusChange(tarefa, s); setOpen(false) }}
                className={`w-full text-left px-3.5 py-1.5 text-[12px] transition-colors hover:bg-slate-50 ${tarefa.status === s ? 'font-semibold' : ''}`}
                style={{ color: tarefa.status === s ? '#2a7a8a' : 'var(--text-secondary)' }}>
                {STATUS_LABEL[s]}
              </button>
            ))}

            {podeGerenciar && (
              <>
                <div className="my-1 border-t" style={{ borderColor: 'var(--border-default)' }}/>
                <button onClick={() => { onEditar(tarefa); setOpen(false) }}
                  className="w-full text-left px-3.5 py-1.5 text-[12px] flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  ✏️ Editar tarefa
                </button>
                <button onClick={() => { onDelete(tarefa.id); setOpen(false) }}
                  className="w-full text-left px-3.5 py-1.5 text-[12px] text-rose-600 flex items-center gap-2 hover:bg-rose-50 transition-colors">
                  <Trash2 size={12}/> Excluir tarefa
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  )
}