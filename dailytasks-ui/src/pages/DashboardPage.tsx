import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { Tarefa, Projeto } from '../types'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { 
  ClipboardList, 
  Folder, 
  Trash2, 
  Star, 
  CheckCircle2, 
  LayoutDashboard,
  ArrowRight,
  Plus,
  AlertCircle
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export const DashboardPage = () => {
  const { username, role } = useAuth(); 
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Proteção contra 403: Se um falhar, o outro ainda carrega
      const [resT, resP] = await Promise.allSettled([
        api.get('/tarefas'),
        api.get('/projetos')
      ]);

      if (resT.status === 'fulfilled') setTarefas(resT.value.data);
      if (resP.status === 'fulfilled') setProjetos(resP.value.data);
      
    } catch (err) {
      console.error("Erro inesperado no Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.put(`/tarefas/${id}`, { status: newStatus });
      setTarefas(prev => 
        prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t)
      );
    } catch (err) {
      alert("Não foi possível atualizar o status.");
    }
  };

  const handleDeleteTarefa = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Evita navegar para o projeto ao clicar em excluir
    if (!window.confirm("Excluir esta tarefa permanentemente?")) return;
    try {
      await api.delete(`/tarefas/${id}`);
      setTarefas(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Você não tem permissão para excluir esta tarefa.");
    }
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
      hoverOffset: 15
    }]
  };

  const renderStatusBadge = (status: string) => {
    const base = "px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ";
    switch (status) {
      case 'PENDENTE': return <span className={`${base} bg-amber-50 text-amber-600`}>Pendente</span>;
      case 'EM_ANDAMENTO': return <span className={`${base} bg-indigo-50 text-indigo-600`}>Em curso</span>;
      case 'CONCLUIDA': return <span className={`${base} bg-emerald-50 text-emerald-600`}>Concluída</span>;
      case 'BLOQUEADA': return <span className={`${base} bg-rose-50 text-rose-600`}>Bloqueada</span>;
      default: return <span className={`${base} bg-slate-50 text-slate-500`}>{status}</span>;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* WELCOME HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Foco no Objetivo, {username.split(' ')[0]}</h1>
            <p className="text-slate-500 font-medium">Aqui está o resumo operacional da sua unidade.</p>
          </div>
          {(role === 'GESTOR' || role === 'GERENTE') && (
            <button 
              onClick={() => navigate('/criar')}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
            >
              <Plus size={16} /> Nova Demanda
            </button>
          )}
        </div>

        {/* TOP METRICS & CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full flex justify-between items-center mb-10">
              <h3 className="font-black text-slate-800 flex items-center gap-3">
                <LayoutDashboard className="text-indigo-600" size={20} /> Saúde do Fluxo
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-400">
                 <CheckCircle2 size={12} className="text-emerald-500" /> {tarefas.filter(t => t.status === 'CONCLUIDA').length} Finalizadas
              </div>
            </div>
            <div className="h-[250px] w-full relative">
              {tarefas.length > 0 ? (
                <Doughnut 
                  data={dataChart} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { weight: 'bold' } } } } 
                  }} 
                />
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-slate-300 gap-2">
                    <AlertCircle size={32} className="opacity-20" />
                    <p className="italic font-medium">Aguardando dados das tarefas...</p>
                </div>
              )}
            </div>
          </section>

          {/* PROJECT SUMMARY CARD */}
          <section className="space-y-6">
             <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-black leading-tight mb-4">Seus Projetos Ativos</h3>
                  <div className="space-y-3">
                    {projetos.slice(0, 3).map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => navigate(`/projetos/${p.id}`)}
                        className="bg-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/20 cursor-pointer transition-all border border-white/5"
                      >
                        <span className="text-xs font-bold truncate pr-4">{p.nome}</span>
                        <ArrowRight size={14} className="opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/criar')}
                  className="mt-6 w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
                >
                  Ver Todos os Projetos
                </button>
             </div>
          </section>
        </div>

        {/* TASKS LIST */}
        <div className="space-y-6">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2 px-2">
            <ClipboardList size={16} className="text-indigo-600" /> Minha Fila de Trabalho
          </h3>
          
          {loading ? (
             <div className="grid gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[2rem] animate-pulse"></div>)}
             </div>
          ) : tarefas.length > 0 ? (
            <div className="grid gap-4">
              {tarefas.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => navigate(`/projetos/${task.projeto?.id}`)}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <Folder size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          {task.projeto?.nome || 'Demanda Isolada'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{task.titulo}</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
                        <Clock size={12} /> {task.dataDeVencimento || 'Sem prazo definido'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    {renderStatusBadge(task.status)}
                    
                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="text-[10px] font-black py-2.5 px-4 bg-slate-50 rounded-xl border-none cursor-pointer hover:bg-slate-100 transition-all outline-none uppercase tracking-tighter"
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em curso</option>
                        <option value="CONCLUIDA">Concluída</option>
                        <option value="BLOQUEADA">Bloqueada</option>
                      </select>

                      {(role === 'MASTER' || role === 'GESTOR' || role === 'GERENTE') && (
                        <button 
                          onClick={(e) => handleDeleteTarefa(e, task.id)}
                          className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>  
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <ClipboardList className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Tudo em dia por aqui.</p>
              <p className="text-slate-300 text-[10px] font-bold mt-1">Nenhuma tarefa ativa atribuída a você no momento.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};