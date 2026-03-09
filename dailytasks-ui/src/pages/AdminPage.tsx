import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MainLayout } from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Funcionario, Tarefa, Projeto } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

export const AdminPage = () => {
  const { role } = useAuth();

  // --- ESTADOS DE DADOS ---
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE FORMULÁRIO ---
  const [userForm, setUserForm] = useState({
    nomeCompleto: '',
    username: '',
    password: '',
    role: 'FUNCIONARIO' as UserRole
  });
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [projForm, setProjForm] = useState({ nome: '', descricao: '' });
  const [lideranca, setLideranca] = useState({ funcionarioId: '', projetoId: '' });

  const fetchData = async () => {
    try {
      const [resT, resF, resP] = await Promise.all([
        api.get('/tarefas'),
        api.get('/funcionarios'),
        api.get('/projetos')
      ]);
      setTarefas(resT.data);
      setFuncionarios(resF.data);
      setProjetos(resP.data);
    } catch (err) {
      console.error("Erro ao carregar dados do Painel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS DE EQUIPE ---
  
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUserId) {
        await api.put(`/funcionarios/${editUserId}`, {
          nomeCompleto: userForm.nomeCompleto,
          role: userForm.role
        });
        alert("Colaborador atualizado!");
      } else {
        await api.post('/funcionarios', userForm);
        alert("Novo membro adicionado à equipe!");
      }
      resetUserForm();
      fetchData();
    } catch (err) {
      alert("Erro na operação. Verifique se o username já existe ou se você tem permissão.");
    }
  };

  const handleUserDelete = async (id: number) => {
    if (!window.confirm("Remover este colaborador permanentemente?")) return;
    try {
      await api.delete(`/funcionarios/${id}`);
      fetchData();
    } catch (err) {
      alert("Não é possível excluir: o usuário possui tarefas vinculadas.");
    }
  };

  /**
   * FUNCIONALIDADE: Reset de Senha (Esqueci minha senha)
   * Envia comando para o backend restaurar a senha padrão 'tasks123'
   */
  const handleResetPassword = async (id: number, nome: string) => {
    if (!window.confirm(`Deseja resetar a senha de ${nome}? A nova senha será 'tasks123' e ele(a) deverá trocá-la no próximo acesso.`)) return;

    try {
      await api.patch(`/funcionarios/${id}/reset-senha`);
      alert(`Senha de ${nome} resetada com sucesso! Senha provisória: tasks123`);
    } catch (err) {
      alert("Erro ao tentar resetar a senha. Verifique suas permissões.");
    }
  };

  const resetUserForm = () => {
    setEditUserId(null);
    setUserForm({ nomeCompleto: '', username: '', password: '', role: 'FUNCIONARIO' });
  };

  // --- HANDLERS DE PROJETO ---
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projetos', projForm);
      alert("Projeto criado com sucesso!");
      setProjForm({ nome: '', descricao: '' });
      fetchData();
    } catch (err) {
      alert("Erro ao criar projeto.");
    }
  };

  const handleAssignLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lideranca.funcionarioId || !lideranca.projetoId) {
      return alert("Por favor, selecione o projeto e o gerente.");
    }
    
    try {
      await api.post('/projeto-membros/atribuir-lider', {
        funcionarioId: Number(lideranca.funcionarioId),
        projetoId: Number(lideranca.projetoId)
      });
      alert("Liderança atribuída com sucesso!");
      setLideranca({ funcionarioId: '', projetoId: '' });
    } catch (err) {
      alert("Erro ao atribuir liderança.");
    }
  };

  const dataChart = {
    labels: ['Pendente', 'Em curso', 'Concluída', 'Bloqueada', 'Cancelada'],
    datasets: [{
      data: [
        tarefas.filter(t => t.status === 'PENDENTE').length,
        tarefas.filter(t => t.status === 'EM_ANDAMENTO').length,
        tarefas.filter(t => t.status === 'CONCLUIDA').length,
        tarefas.filter(t => t.status === 'BLOQUEADA').length,
        tarefas.filter(t => t.status === 'CANCELADA').length,
      ],
      backgroundColor: ['#fbbf24', '#60a5fa', '#22c55e', '#ef4444', '#94a3b8'],
      borderWidth: 0,
    }]
  };

  return (
    <MainLayout>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Painel de Gestão</h1>
            <p className="text-slate-500">
              {role === 'MASTER' ? 'Gerenciamento global do ecossistema Daily Tasks.' : 'Controle sua operação, equipes e projetos.'}
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Projetos</p>
              <p className="text-2xl font-black text-indigo-600">{projetos.length}</p>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Ativo</p>
              <p className="text-2xl font-black text-indigo-600">{funcionarios.length}</p>
            </div>
          </div>
        </div>

        {/* MÉTRICAS E CADASTRO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center min-h-[400px]">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3">
              <span className="p-2 bg-indigo-50 rounded-xl text-lg">📊</span> 
              Produtividade Geral
            </h3>
            <div className="h-[280px] relative">
              {tarefas.length > 0 ? (
                <Doughnut data={dataChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { weight: 'bold' } } } } }} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 italic font-medium">Aguardando inserção de tarefas para gerar dados...</div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">{editUserId ? '✏️ Editar Colaborador' : '👤 Novo Membro'}</h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={userForm.nomeCompleto} onChange={e => setUserForm({...userForm, nomeCompleto: e.target.value})} required />
              </div>
              {!editUserId && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Login</label>
                    <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Senha Inicial</label>
                    <input type="password" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                  </div>
                </>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Acesso</label>
                <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-indigo-600 outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                  <option value="FUNCIONARIO">FUNCIONÁRIO</option>
                  <option value="GERENTE">GERENTE (LÍDER)</option>
                  {role === 'MASTER' && <option value="GESTOR">GESTOR (CLIENTE)</option>}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-2">
                {editUserId ? 'ATUALIZAR' : 'EFETIVAR MEMBRO'}
              </button>
              {editUserId && <button onClick={resetUserForm} className="w-full text-xs text-slate-400 mt-2 font-bold underline">Cancelar Edição</button>}
            </form>
          </div>
        </div>

        {/* PROJETOS E LIDERANÇA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">🚀 Novo Projeto</h2>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <input placeholder="Título do Projeto" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={projForm.nome} onChange={e => setProjForm({...projForm, nome: e.target.value})} required />
              <textarea placeholder="Resumo e objetivos..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-28 resize-none" value={projForm.descricao} onChange={e => setProjForm({...projForm, descricao: e.target.value})} />
              <button className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl hover:bg-slate-900 transition-all">ESTABELECER PROJETO</button>
            </form>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-amber-100 bg-gradient-to-br from-white to-amber-50/20">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">👑 Gestão de Líderes</h2>
            <form onSubmit={handleAssignLeader} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Projeto Destino</label>
                <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold" value={lideranca.projetoId} onChange={e => setLideranca({...lideranca, projetoId: e.target.value})}>
                  <option value="">-- Selecionar Projeto --</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Gerente Delegado</label>
                <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-amber-600" value={lideranca.funcionarioId} onChange={e => setLideranca({...lideranca, funcionarioId: e.target.value})}>
                  <option value="">-- Selecionar Gerente --</option>
                  {funcionarios.filter(f => f.role === 'GERENTE').map(g => <option key={g.id} value={g.id}>{g.nomeCompleto}</option>)}
                </select>
              </div>
              <button className="w-full bg-amber-500 text-white font-black py-4 rounded-2xl hover:bg-amber-600 shadow-md shadow-amber-100 transition-all mt-2">CONFIRMAR LIDERANÇA</button>
            </form>
          </section>
        </div>

        {/* EQUIPE OPERACIONAL */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">Time de Elite</h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-3 py-1 rounded-full">{funcionarios.length} MEMBROS</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {funcionarios.map(emp => (
              <div key={emp.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-300 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                      emp.role === 'GESTOR' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 
                      emp.role === 'GERENTE' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {emp.nomeCompleto[0]}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-800 truncate leading-tight">{emp.nomeCompleto}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                        emp.role === 'GESTOR' ? 'bg-indigo-50 text-indigo-700' : 
                        emp.role === 'GERENTE' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {emp.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex justify-between">
                    <button 
                      onClick={() => { 
                        setEditUserId(emp.id); 
                        setUserForm({ ...userForm, nomeCompleto: emp.nomeCompleto, role: emp.role as UserRole }); 
                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      }} 
                      className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase"
                    >
                      Editar
                    </button>
                    
                    {/* BOTÃO RESET DE SENHA */}
                    <button 
                      onClick={() => handleResetPassword(emp.id, emp.nomeCompleto)} 
                      className="text-[10px] font-black text-amber-500 hover:text-amber-700 uppercase"
                    >
                      Reset Senha
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleUserDelete(emp.id)} 
                    className="w-full py-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl text-[10px] font-black uppercase transition-colors"
                  >
                    Remover Colaborador
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </MainLayout>
  );
};