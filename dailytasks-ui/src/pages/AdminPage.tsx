import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { MainLayout } from '../components/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Funcionario, Tarefa, Projeto } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  Edit3, 
  UserCheck, 
  PieChart, 
  TrendingUp,
  XCircle,
  RefreshCcw,
  Camera,
  Trash2,
  UserPlus2
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export const AdminPage = () => {
  const { role, username } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- ESTADOS DE DADOS ---
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE FORMULÁRIO ---
  const [userForm, setUserForm] = useState({
    nomeCompleto: '',
    username: '',
    password: '',
    role: 'FUNCIONARIO' as UserRole,
    foto: '' 
  });
  const [editUserId, setEditUserId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resF, resT, resP] = await Promise.allSettled([
        api.get('/funcionarios'),
        api.get('/tarefas'),
        api.get('/projetos')
      ]);

      if (resF.status === 'fulfilled') setFuncionarios(resF.value.data);
      if (resT.status === 'fulfilled') setTarefas(resT.value.data);
      if (resP.status === 'fulfilled') setProjetos(resP.value.data);
      
    } catch (err) {
      console.error("Erro crítico ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- LÓGICA DE FOTO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("A imagem deve ter no máximo 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserForm({ ...userForm, foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CRUD OPERAÇÕES ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUserId) {
        await api.put(`/funcionarios/${editUserId}`, {
          nomeCompleto: userForm.nomeCompleto,
          role: userForm.role,
          foto: userForm.foto
        });
        alert("Perfil atualizado!");
      } else {
        await api.post('/funcionarios', userForm);
        alert("Colaborador contratado com sucesso!");
      }
      setUserForm({ nomeCompleto: '', username: '', password: '', role: 'FUNCIONARIO', foto: '' });
      setEditUserId(null);
      fetchData();
    } catch (err) { 
      alert("Erro na operação. Nome de usuário já existe?"); 
    }
  };

  const handleToggleAtivo = async (id: number, atualAtivo: boolean, nome: string) => {
    const acao = atualAtivo ? "desativar" : "reativar";
    if (!window.confirm(`Deseja realmente ${acao} o acesso de ${nome}?`)) return;

    try {
      if (atualAtivo) {
        // Chamada de DELETE que no backend faz o Soft Delete (ativo = false)
        await api.delete(`/funcionarios/${id}`);
      } else {
        // Chamada de PATCH que criamos para reativar (ativo = true)
        await api.patch(`/funcionarios/${id}/ativar`);
      }
      fetchData(); // Recarrega a lista para atualizar os estilos
    } catch (err) {
      alert("Erro ao alterar status do usuário.");
    }
  };

  const handleResetPassword = async (id: number, nome: string) => {
    if (!window.confirm(`Resetar senha de ${nome}?`)) return;
    try {
      await api.patch(`/funcionarios/${id}/reset-senha`);
      alert("Senha resetada para o padrão 'tasks123'");
    } catch (err) { alert("Erro ao resetar."); }
  };

  const dataChart = {
    labels: ['Pendente', 'Em curso', 'Concluída', 'Bloqueada'],
    datasets: [{
      data: [
        tarefas.filter(t => t.status === 'PENDENTE').length,
        tarefas.filter(t => t.status === 'EM_ANDAMENTO').length,
        tarefas.filter(t => t.status === 'CONCLUIDA').length,
        tarefas.filter(t => t.status === 'BLOQUEADA').length,
      ],
      backgroundColor: ['#fbbf24', '#6366f1', '#22c55e', '#f43f5e'],
      borderWidth: 0,
      hoverOffset: 20
    }]
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Administração de Unidade</h1>
            <p className="text-slate-500 font-medium">Controle de acessos e monitoramento operacional • {username}</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white p-5 rounded-[1.8rem] border border-slate-100 shadow-sm min-w-[140px] text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaboradores</p>
              <p className="text-2xl font-black text-indigo-600">{funcionarios.length}</p>
            </div>
            <button 
              onClick={fetchData} 
              className="p-5 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors text-slate-400 group"
            >
              <RefreshCcw size={20} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ANALYTICS */}
          <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[450px]">
            <div className="w-full flex justify-between items-center mb-10 px-2">
              <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                <PieChart className="text-indigo-600" size={22} /> Saúde do Fluxo
              </h3>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <TrendingUp className="text-emerald-500" size={14} />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
              </div>
            </div>
            <div className="h-[280px] w-full relative">
              {tarefas.length > 0 ? (
                <Doughnut 
                  data={dataChart} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { weight: 'bold', size: 11 } } } } 
                  }} 
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-300 gap-2">
                  <XCircle size={40} className="opacity-20" />
                  <p className="italic font-medium">Nenhuma tarefa encontrada nesta unidade.</p>
                </div>
              )}
            </div>
          </section>

          {/* FORMULÁRIO */}
          <section className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white h-fit sticky top-24">
            <h3 className="font-black mb-8 flex items-center gap-3 text-xl text-indigo-400">
              <UserPlus /> {editUserId ? 'Editar Perfil' : 'Novo Colaborador'}
            </h3>

            <div className="flex flex-col items-center mb-8 gap-4 group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-[2rem] bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-indigo-500 relative shadow-inner"
              >
                {userForm.foto ? (
                  <img src={userForm.foto} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <Camera className="text-slate-600 group-hover:text-indigo-400 transition-colors" size={32} />
                )}
              </div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                {userForm.foto ? 'Alterar Imagem' : 'Subir Foto'}
              </p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nome Completo</label>
                <input 
                  className="w-full p-4 bg-slate-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                  value={userForm.nomeCompleto} 
                  onChange={e => setUserForm({...userForm, nomeCompleto: e.target.value})} required 
                />
              </div>

              {!editUserId && (
                <div className="grid grid-cols-1 gap-4">
                  <input placeholder="Login" className="w-full p-4 bg-slate-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required />
                  <input type="password" placeholder="Senha" className="w-full p-4 bg-slate-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cargo</label>
                <select 
                  className="w-full p-4 bg-slate-800 border-none rounded-2xl text-sm font-black text-indigo-400 outline-none appearance-none" 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                >
                  <option value="FUNCIONARIO">COLABORADOR</option>
                  <option value="GERENTE">GERENTE</option>
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 uppercase text-xs tracking-widest">
                  {editUserId ? 'Salvar Alterações' : 'Contratar Agora'}
                </button>
                {editUserId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditUserId(null); setUserForm({nomeCompleto:'', username:'', password:'', role:'FUNCIONARIO', foto: ''}); }}
                    className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest"
                  >
                    Descartar Edição
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* LISTAGEM DE STAFF COM SOFT DELETE */}
        <section className="space-y-6">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2 px-2">
            <UserCheck size={18} className="text-indigo-600" /> Corpo Docente e Staff
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {funcionarios.length > 0 ? (
              funcionarios.map(emp => (
                <div 
                  key={emp.id} 
                  className={`p-6 rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                    emp.ativo === false 
                      ? 'bg-slate-50 border-slate-200 opacity-60 grayscale' 
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-xl'
                  }`}
                >
                  {/* BADGE DE INATIVO */}
                  {!emp.ativo && (
                    <div className="absolute top-4 right-6 bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest z-10">
                      Inativo
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center font-black text-indigo-600 shadow-inner group-hover:scale-105 transition-transform">
                      {emp.foto ? (
                        <img src={emp.foto} className="w-full h-full object-cover" alt={emp.nomeCompleto} />
                      ) : (
                        <span className="text-lg">{emp.nomeCompleto[0]}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-slate-800 truncate leading-tight text-base">{emp.nomeCompleto}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{emp.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Botão Editar (Apenas se ativo) */}
                    <button 
                      onClick={() => { 
                        setEditUserId(emp.id); 
                        setUserForm({ 
                          ...userForm, 
                          nomeCompleto: emp.nomeCompleto, 
                          role: emp.role as UserRole,
                          foto: emp.foto || '' 
                        }); 
                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      }} 
                      disabled={!emp.ativo}
                      className="flex-1 py-3 bg-slate-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 size={14} /> Editar
                    </button>

                    {/* Botão Reativar / Desativar */}
                    {emp.ativo ? (
                      <button 
                        onClick={() => handleToggleAtivo(emp.id, true, emp.nomeCompleto)} 
                        className="p-3 bg-slate-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-slate-100"
                        title="Desativar Usuário"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleAtivo(emp.id, false, emp.nomeCompleto)} 
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                        title="Reativar Usuário"
                      >
                        <UserPlus2 size={16} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleResetPassword(emp.id, emp.nomeCompleto)} 
                      className="p-3 bg-slate-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all border border-slate-100"
                      title="Resetar Senha"
                    >
                      <KeyRound size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                 <p className="text-slate-400 font-bold italic">Unidade vazia.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};