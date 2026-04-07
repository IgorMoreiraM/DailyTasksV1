import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, UserX, UserCheck, KeyRound } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, Btn, Avatar, RoleBadge, EmptyState, Spinner, inputClass, inputStyle, FormField, Modal } from '../../components/ui'
import { funcionarioApi } from '../../api'
import type { Funcionario, UserRole } from '../../types'

export function GestorFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading,      setLoading]      = useState(true)
  const [modalFunc,    setModalFunc]    = useState(false)
  const [editFunc,     setEditFunc]     = useState<Funcionario | null>(null)
  const [fFunc,        setFFunc]        = useState({ nomeCompleto: '', username: '', password: '', role: 'FUNCIONARIO' as UserRole })
  const [saving,       setSaving]       = useState(false)
  const [erro,         setErro]         = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await funcionarioApi.listar()
      setFuncionarios(r.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function closeModal() {
    setModalFunc(false); setEditFunc(null)
    setFFunc({ nomeCompleto: '', username: '', password: '', role: 'FUNCIONARIO' })
    setErro('')
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault(); setErro(''); setSaving(true)
    try {
      if (editFunc) {
        await funcionarioApi.atualizar(editFunc.id, { nomeCompleto: fFunc.nomeCompleto, role: fFunc.role })
      } else {
        await funcionarioApi.criar(fFunc)
      }
      closeModal(); fetchAll()
    } catch (err: any) {
      setErro(err?.response?.status === 409 ? 'Login já em uso.' : 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  async function toggleAtivo(f: Funcionario) {
    if (!confirm(`${f.ativo ? 'Desativar' : 'Reativar'} ${f.nomeCompleto}?`)) return
    try {
      if (f.ativo) await funcionarioApi.desativar(f.id)
      else         await funcionarioApi.ativar(f.id)
      fetchAll()
    } catch { alert('Erro ao alterar status.') }
  }

  async function resetSenha(f: Funcionario) {
    if (!confirm(`Resetar senha de ${f.nomeCompleto}?`)) return
    try { await funcionarioApi.resetSenha(f.id); alert('Senha resetada para "tasks123".') }
    catch { alert('Erro.') }
  }

  if (loading) return (
    <DashboardLayout title="Funcionários" breadcrumb="Gestor · Funcionários">
      <div className="flex justify-center py-20"><Spinner size={32} /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Funcionários" breadcrumb="Gestor · Funcionários"
      actions={
        <button onClick={() => setModalFunc(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl text-white"
          style={{ background: '#f97316' }}>
          <Plus size={13} /> Novo Funcionário
        </button>
      }>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {funcionarios.length} membro{funcionarios.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>

        {funcionarios.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={<Users size={36} />} message="Nenhum funcionário cadastrado" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Funcionário', 'Login', 'Papel', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-5 pb-3 pt-2 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f, i) => (
                  <tr key={f.id}
                    className={`transition-colors hover:bg-slate-50/50 ${f.ativo === false ? 'opacity-50' : ''}`}
                    style={{ borderBottom: i < funcionarios.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={f.nomeCompleto} foto={f.foto} size="sm" />
                        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{f.nomeCompleto}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] font-mono" style={{ color: 'var(--text-secondary)' }}>{f.username}</td>
                    <td className="px-5 py-3"><RoleBadge role={f.role} /></td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${f.ativo !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {f.ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditFunc(f); setFFunc({ nomeCompleto: f.nomeCompleto, username: f.username, password: '', role: f.role }); setModalFunc(true) }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: 'var(--text-muted)' }}>✏️</button>
                        <button onClick={() => toggleAtivo(f)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: 'var(--text-muted)' }}>
                          {f.ativo !== false ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button onClick={() => resetSenha(f)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
                          <KeyRound size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalFunc} onClose={closeModal} title={editFunc ? 'Editar Funcionário' : 'Novo Funcionário'}>
        {erro && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-[12.5px] text-rose-600">{erro}</p>
          </div>
        )}
        <form onSubmit={handleSalvar} className="space-y-4">
          <FormField label="Nome completo">
            <input className={inputClass} style={inputStyle} required placeholder="Ex: Ana Costa"
              value={fFunc.nomeCompleto} onChange={e => setFFunc(p => ({ ...p, nomeCompleto: e.target.value }))} />
          </FormField>
          {!editFunc && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Login">
                <input className={inputClass} style={inputStyle} required placeholder="ana.costa"
                  value={fFunc.username} onChange={e => setFFunc(p => ({ ...p, username: e.target.value }))} />
              </FormField>
              <FormField label="Senha temporária">
                <input type="password" className={inputClass} style={inputStyle} required placeholder="••••••"
                  value={fFunc.password} onChange={e => setFFunc(p => ({ ...p, password: e.target.value }))} />
              </FormField>
            </div>
          )}
          <FormField label="Papel">
            <select className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
              value={fFunc.role} onChange={e => setFFunc(p => ({ ...p, role: e.target.value as UserRole }))}>
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="GERENTE">Gerente</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <Btn variant="secondary" size="sm" type="button" onClick={closeModal}>Cancelar</Btn>
            <button type="submit" disabled={saving}
              className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-xl text-white disabled:opacity-50"
              style={{ background: '#2a7a8a' }}>
              {saving ? 'Salvando...' : editFunc ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}