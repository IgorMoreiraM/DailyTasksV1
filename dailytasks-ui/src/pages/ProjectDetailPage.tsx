import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { MainLayout } from '../components/MainLayout';
import { TaskModal } from '../components/TaskModal';
import { useAuth } from '../contexts/AuthContext';
import { Projeto, Tarefa, ListaTarefa } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  Layout as LayoutIcon,
  CheckCircle2,
  Trash2,
  ListFilter,
  User2,
  Clock,
  Filter
} from 'lucide-react';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, username } = useAuth();
  
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [listas, setListas] = useState<ListaTarefa[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [novaListaNome, setNovaListaNome] = useState('');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedListaId, setSelectedListaId] = useState<number | null>(null);

  // NOVO: Estado do Filtro Ativo
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'today'>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resProj, resListas, resTasks] = await Promise.all([
        api.get(`/projetos/${id}`),
        api.get(`/listas/projeto/${id}`),
        api.get(`/tarefas/projeto/${id}`)
      ]);
      
      setProjeto(resProj.data);
      setListas(resListas.data);
      setTarefas(resTasks.data);
    } catch (err) {
      console.error("Erro ao sincronizar projeto:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  // NOVO: Lógica de Filtragem de Tarefas
  const filteredTasks = tarefas.filter(task => {
    if (activeFilter === 'mine') {
      return task.nomeFuncionario?.toLowerCase().includes(username?.toLowerCase() || '');
    }
    if (activeFilter === 'today') {
      const hoje = new Date().toISOString().split('T')[0];
      return task.dataDeVencimento === hoje;
    }
    return true; // 'all'
  });

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaListaNome.trim()) return;
    try {
      await api.post('/listas', { nome: novaListaNome, projetoId: Number(id) });
      setNovaListaNome('');
      setIsAddingList(false);
      fetchData();
    } catch (err) { alert("Erro ao criar coluna."); }
  };

  const handleDeleteList = async (listaId: number) => {
    if (!window.confirm("Remover esta etapa?")) return;
    try {
      await api.delete(`/listas/${listaId}`);
      fetchData();
    } catch (err) { alert("Erro ao excluir coluna."); }
  };

  const progress = tarefas.length > 0 
    ? Math.round((tarefas.filter(t => t.status === 'CONCLUIDA').length / tarefas.length) * 100) 
    : 0;

  if (loading && !projeto) {
    return (
      <MainLayout>
        <div className="animate-pulse p-8 space-y-4">
          <div className="h-12 bg-slate-200 rounded-3xl w-1/3"></div>
          <div className="h-64 bg-slate-100 rounded-[3rem]"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
        
        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-between px-2">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest"
            >
                <ArrowLeft size={14} /> Voltar
            </button>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel Operacional</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
        </div>

        {/* HEADER DO PROJETO */}
        <header className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between gap-8">
          <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                      <LayoutIcon size={24} />
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{projeto?.nome}</h1>
              </div>
              <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">{projeto?.descricao || 'Sem descrição definida.'}</p>
          </div>

          <div className="flex flex-col justify-center items-end min-w-[280px]">
              <div className="w-full bg-slate-100 h-3 rounded-full mb-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Progresso Geral</span>
                  <span className="text-indigo-600 font-black">{progress}%</span>
              </div>
          </div>
        </header>

        {/* BARRAMENTO DE FILTROS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-[1.5rem] w-full md:w-auto">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ListFilter size={14} /> Todas <span className="opacity-40">{tarefas.length}</span>
            </button>
            
            <button 
              onClick={() => setActiveFilter('mine')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeFilter === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <User2 size={14} /> Minhas <span className="opacity-40">{tarefas.filter(t => t.nomeFuncionario?.toLowerCase().includes(username?.toLowerCase() || '')).length}</span>
            </button>

            <button 
              onClick={() => setActiveFilter('today')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeFilter === 'today' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Clock size={14} /> Hoje <span className="opacity-40">{tarefas.filter(t => t.dataDeVencimento === new Date().toISOString().split('T')[0]).length}</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-6 text-slate-400">
             <Filter size={14} />
             <span className="text-[10px] font-bold uppercase tracking-tighter">Exibindo {filteredTasks.length} resultados</span>
          </div>
        </div>

        {/* QUADRO KANBAN */}
        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 custom-scrollbar items-start min-h-[600px]">
          {listas.map(lista => (
            <div key={lista.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-4 group/list">
              
              <div className="flex justify-between items-center px-4">
                <h3 className="font-black text-slate-400 text-[11px] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                  {lista.nome} 
                  <span className="ml-1 opacity-50 bg-slate-100 px-2 py-0.5 rounded-md">
                    {filteredTasks.filter(t => t.listaId === lista.id).length}
                  </span>
                </h3>
                
                <div className="flex items-center gap-1 opacity-0 group-hover/list:opacity-100 transition-opacity">
                    {(role === 'MASTER' || role === 'GESTOR') && (
                        <button onClick={() => handleDeleteList(lista.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"><Trash2 size={14} /></button>
                    )}
                    {role !== 'FUNCIONARIO' && (
                        <button onClick={() => { setSelectedListaId(lista.id); setIsTaskModalOpen(true); }} className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><Plus size={16} /></button>
                    )}
                </div>
              </div>

              <div className="bg-slate-50/50 p-3 rounded-[2.5rem] border border-slate-200/60 min-h-[500px] space-y-3">
                {filteredTasks.filter(t => t.listaId === lista.id).map(task => (
                  <div key={task.id} className={`bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden ${task.status === 'CONCLUIDA' ? 'opacity-75' : ''}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.status === 'CONCLUIDA' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    
                    <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-4 line-clamp-2 text-sm leading-tight">
                      {task.titulo}
                    </h4>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{task.dataDeVencimento || 'Sem prazo'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm">
                                    {task.nomeFuncionario ? task.nomeFuncionario[0] : <User size={10}/>}
                                </div>
                                <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[80px]">
                                    {task.nomeFuncionario?.split(' ')[0]}
                                </span>
                            </div>
                            {task.status === 'CONCLUIDA' && <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={3} />}
                        </div>
                    </div>
                  </div>
                ))}

                {role !== 'FUNCIONARIO' && (
                    <button onClick={() => { setSelectedListaId(lista.id); setIsTaskModalOpen(true); }} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.8rem] text-slate-400 text-[10px] font-black hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Plus size={14}/> Adicionar Tarefa
                    </button>
                )}
              </div>
            </div>
          ))}

          {/* ADICIONAR ETAPA */}
          {(role === 'MASTER' || role === 'GESTOR') && (
            <div className="min-w-[320px]">
                {isAddingList ? (
                    <form onSubmit={handleAddList} className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-indigo-100 animate-in zoom-in-95 duration-200">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Nova Coluna</label>
                        <input autoFocus className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm mb-4 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Nome da etapa..." value={novaListaNome} onChange={e => setNovaListaNome(e.target.value)} />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">Salvar</button>
                            <button type="button" onClick={() => setIsAddingList(false)} className="px-4 py-3 text-slate-400 font-bold text-[10px] uppercase">Sair</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setIsAddingList(true)} className="w-full py-12 border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-black flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors"><Plus size={24} /></div>
                        <span className="text-xs uppercase tracking-[0.2em]">Nova Etapa</span>
                    </button>
                )}
            </div>
          )}
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskModal 
          projectId={id!}
          listaId={selectedListaId!}
          initialStatus={listas.find(l => l.id === selectedListaId)?.nome || 'PENDENTE'}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </MainLayout>
  );
};