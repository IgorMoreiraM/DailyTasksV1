import { useState, useEffect, useCallback } from 'react'
import { BarChart2, CheckSquare, Clock, AlertTriangle, FolderKanban, Download, Loader2 } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, StatCard, Spinner, ProgressBar } from '../../components/ui'
import { projetoApi, tarefaApi } from '../../api'
import type { Projeto, Tarefa } from '../../types'

export function GerenteRelatorios() {
  const [projetos,  setProjetos]  = useState<Projeto[]>([])
  const [tarefas,   setTarefas]   = useState<Tarefa[]>([])
  const [loading,   setLoading]   = useState(true)
  const [exportando, setExportando] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const rP = await projetoApi.listar()
      const projs: Projeto[] = Array.isArray(rP.data) ? rP.data : []
      setProjetos(projs)
      const reqs = await Promise.allSettled(projs.map(p => tarefaApi.listarPorProjeto(p.id)))
      const todas: Tarefa[] = []
      reqs.forEach(r => { if (r.status === 'fulfilled' && Array.isArray(r.value.data)) todas.push(...r.value.data) })
      setTarefas(todas)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const total      = tarefas.length
  const concluidas = tarefas.filter(t => t.status === 'CONCLUIDA').length
  const andamento  = tarefas.filter(t => t.status === 'EM_ANDAMENTO').length
  const pendentes  = tarefas.filter(t => t.status === 'PENDENTE').length
  const bloqueadas = tarefas.filter(t => t.status === 'BLOQUEADA').length
  const hoje       = new Date().toISOString().split('T')[0]
  const atrasadas  = tarefas.filter(t =>
    t.dataDeVencimento && t.dataDeVencimento < hoje &&
    t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'
  ).length

  const progressoProjetos = projetos.map(p => {
    const ts     = tarefas.filter(t => t.projetoId === p.id)
    const feitas = ts.filter(t => t.status === 'CONCLUIDA').length
    const pct    = ts.length ? Math.round(feitas / ts.length * 100) : 0
    const atrasP = ts.filter(t =>
      t.dataDeVencimento && t.dataDeVencimento < hoje &&
      t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA'
    ).length
    return { ...p, total: ts.length, feitas, pct, atrasadas: atrasP }
  })

  const distribuicao = [
    { label: 'Concluidas',   value: concluidas, color: '#22c55e', pct: total ? Math.round(concluidas / total * 100) : 0 },
    { label: 'Em andamento', value: andamento,  color: '#3b82f6', pct: total ? Math.round(andamento  / total * 100) : 0 },
    { label: 'Pendentes',    value: pendentes,  color: '#f59e0b', pct: total ? Math.round(pendentes  / total * 100) : 0 },
    { label: 'Bloqueadas',   value: bloqueadas, color: '#ef4444', pct: total ? Math.round(bloqueadas / total * 100) : 0 },
  ]

  async function exportarPDF() {
    setExportando(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW  = pdf.internal.pageSize.getWidth()
      const margem = 15
      const colW   = pageW - margem * 2
      let   y      = margem
      const dataStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

      type C3 = [number, number, number]
      const TEAL:  C3 = [42,  122, 138]
      const DARK:  C3 = [15,  23,  42 ]
      const MUTED: C3 = [100, 116, 139]
      const LIGHT: C3 = [241, 245, 249]
      const GREEN: C3 = [34,  197, 94 ]
      const BLUE:  C3 = [59,  130, 246]
      const AMBER: C3 = [245, 158, 11 ]
      const RED:   C3 = [239, 68,  68 ]
      const WHITE: C3 = [255, 255, 255]
      const VIOLET: C3 = [124, 58, 237]

      const novaLinha = (h: number) => {
        if (y + h > pdf.internal.pageSize.getHeight() - margem) { pdf.addPage(); y = margem }
      }
      const barra = (x: number, yp: number, w: number, pct: number, cor: C3) => {
        pdf.setFillColor(...LIGHT); pdf.roundedRect(x, yp, w, 3, 1, 1, 'F')
        if (pct > 0) { pdf.setFillColor(...cor); pdf.roundedRect(x, yp, Math.max(w * pct / 100, 2), 3, 1, 1, 'F') }
      }

      // CABECALHO
      pdf.setFillColor(...VIOLET); pdf.rect(0, 0, pageW, 28, 'F')
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(...WHITE)
      pdf.text('DailyTasks', margem, 13)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
      pdf.text('Relatorio do Gerente', margem, 21)
      pdf.setFontSize(9); pdf.setTextColor(220, 200, 255)
      pdf.text('Gerado em ' + dataStr, pageW - margem, 21, { align: 'right' })
      y = 38

      // CARDS RESUMO
      const cardW = (colW - 9) / 4
      const cards = [
        { label: 'Total',        value: total,      cor: TEAL  },
        { label: 'Concluidas',   value: concluidas, cor: GREEN },
        { label: 'Em andamento', value: andamento,  cor: BLUE  },
        { label: 'Atrasadas',    value: atrasadas,  cor: RED   },
      ]
      cards.forEach((c, i) => {
        const x = margem + i * (cardW + 3)
        pdf.setFillColor(...LIGHT); pdf.roundedRect(x, y, cardW, 18, 2, 2, 'F')
        pdf.setFillColor(...c.cor); pdf.roundedRect(x, y, cardW, 2, 1, 1, 'F')
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(...DARK)
        pdf.text(String(c.value), x + cardW / 2, y + 11, { align: 'center' })
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...MUTED)
        pdf.text(c.label, x + cardW / 2, y + 16, { align: 'center' })
      })
      y += 26

      // DISTRIBUICAO
      novaLinha(60)
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(...DARK)
      pdf.text('Distribuicao por Status', margem, y); y += 6
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MUTED)
      pdf.text(total + ' tarefas no total', margem, y); y += 8

      const distPDF = [
        { label: 'Concluidas',   value: concluidas, cor: GREEN },
        { label: 'Em andamento', value: andamento,  cor: BLUE  },
        { label: 'Pendentes',    value: pendentes,  cor: AMBER },
        { label: 'Bloqueadas',   value: bloqueadas, cor: RED   },
      ]
      distPDF.forEach(d => {
        const pct = total > 0 ? Math.round(d.value / total * 100) : 0
        pdf.setFillColor(...d.cor); pdf.circle(margem + 2, y - 1, 2, 'F')
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...DARK)
        pdf.text(d.label, margem + 7, y)
        pdf.setFont('helvetica', 'bold')
        pdf.text(d.value + '  (' + pct + '%)', margem + 70, y)
        barra(margem + 110, y - 3, colW - 110, pct, d.cor); y += 9
      })
      y += 6

      // PROGRESSO POR PROJETO
      novaLinha(20 + progressoProjetos.length * 16)
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(...DARK)
      pdf.text('Progresso por Projeto', margem, y); y += 6
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...MUTED)
      pdf.text(projetos.length + ' projeto(s)', margem, y); y += 8

      progressoProjetos.forEach(p => {
        novaLinha(16)
        const corB: C3 = p.pct === 100 ? GREEN : VIOLET
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...DARK)
        pdf.text(p.nome.length > 35 ? p.nome.substring(0, 35) + '...' : p.nome, margem, y)
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...VIOLET)
        pdf.text(p.pct + '%', pageW - margem, y, { align: 'right' })
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MUTED)
        pdf.text(p.feitas + '/' + p.total + ' tarefas concluidas', margem, y + 5)
        if (p.atrasadas > 0) { pdf.setTextColor(...RED); pdf.text('! ' + p.atrasadas + ' atrasada(s)', margem + 55, y + 5) }
        barra(margem, y + 8, colW, p.pct, corB); y += 18
      })

      // RODAPE
      const totalPgs = (pdf as any).internal.pages.length - 1
      for (let pg = 1; pg <= totalPgs; pg++) {
        pdf.setPage(pg)
        const pageH = pdf.internal.pageSize.getHeight()
        pdf.setFillColor(...LIGHT); pdf.rect(0, pageH - 10, pageW, 10, 'F')
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(...MUTED)
        pdf.text('DailyTasks - Relatorio do Gerente', margem, pageH - 4)
        pdf.text('Pagina ' + pg + ' de ' + totalPgs, pageW - margem, pageH - 4, { align: 'right' })
      }

      pdf.save('relatorio-gerente-' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.pdf')
    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      alert('Erro ao gerar PDF.')
    } finally {
      setExportando(false)
    }
  }

  if (loading) return (
    <DashboardLayout title="Relatórios" breadcrumb="Gerente · Relatórios">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <DashboardLayout title="Relatórios" breadcrumb="Gerente · Relatórios"
      actions={
        <button onClick={exportarPDF} disabled={exportando}
          className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl text-white transition-all disabled:opacity-70"
          style={{ background: exportando ? '#64748b' : '#7c3aed', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}>
          {exportando
            ? <><Loader2 size={14} className="animate-spin" /> Gerando PDF...</>
            : <><Download size={14} /> Exportar PDF</>
          }
        </button>
      }>
      <div className="space-y-5">

        {/* Cabecalho */}
        <div className="rounded-2xl border px-6 py-5 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7c3aed' }}>
              <BarChart2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-[16px]" style={{ color: 'var(--text-primary)' }}>
                Relatório do Gerente
              </p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Gerado em {dataAtual}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-display font-bold text-[22px]" style={{ color: '#7c3aed' }}>DailyTasks</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Plataforma de gestão</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total de tarefas" value={total}
            icon={<CheckSquare size={16} className="text-brand-teal" />}
            accentColor="bg-brand-teal" iconBg="bg-brand-teal-subtle" delay="0.05s" />
          <StatCard label="Concluídas" value={concluidas}
            sub={total > 0 ? '<strong>' + Math.round(concluidas / total * 100) + '%</strong> do total' : ''}
            icon={<CheckSquare size={16} className="text-emerald-600" />}
            accentColor="bg-emerald-500" iconBg="bg-emerald-50" delay="0.10s" />
          <StatCard label="Em andamento" value={andamento}
            icon={<Clock size={16} className="text-blue-600" />}
            accentColor="bg-blue-500" iconBg="bg-blue-50" delay="0.15s" />
          <StatCard label="Atrasadas" value={atrasadas}
            icon={<AlertTriangle size={16} className="text-rose-600" />}
            accentColor="bg-rose-500" iconBg="bg-rose-50" delay="0.20s" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Distribuição */}
          <Card delay="0.25s">
            <CardHeader>
              <CardTitle>Distribuição por status</CardTitle>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{total} tarefas</p>
            </CardHeader>
            <div className="p-5 space-y-4">
              {distribuicao.map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{d.label}</span>
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
                <p className="px-5 py-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>Nenhum projeto com tarefas</p>
              ) : progressoProjetos.map(p => (
                <div key={p.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <FolderKanban size={13} style={{ color: '#7c3aed' }} className="flex-shrink-0" />
                      <span className="text-[13px] font-medium truncate max-w-[180px]"
                        style={{ color: 'var(--text-primary)' }}>{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.feitas}/{p.total}</span>
                      <span className="text-[12px] font-bold" style={{ color: '#7c3aed' }}>{p.pct}%</span>
                    </div>
                  </div>
                  <ProgressBar pct={p.pct} color="#7c3aed" />
                  {p.atrasadas > 0 && (
                    <p className="text-[11px] mt-1 text-rose-500 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      {p.atrasadas} tarefa{p.atrasadas !== 1 ? 's' : ''} atrasada{p.atrasadas !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  )
}