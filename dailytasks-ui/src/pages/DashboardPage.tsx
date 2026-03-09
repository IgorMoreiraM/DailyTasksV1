import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { Tarefa, Projeto, UserRole } from '../types'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export const DashboardPage = () => {
  // Pegamos o role do contexto de autenticação para validar permissões globais
  const { username, role } = useAuth(); 
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Busca as tarefas atribuídas ao usuário e a lista de projetos 
   * para validar as permissões de "Líder".
   */
  const fetchData = async () => {
    try {
      const [resTarefas, resProjetos] = await Promise.all([
        api.get('/tarefas/minhas-tarefas'),
        api.get('/projetos')
      ]);
      setTarefas(resTarefas.data);
      setProjetos(resProjetos.data);
    } catch (err) {
      console.error("Erro ao carregar Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /**
   * Lógica do MODO GESTÃO:
   * Define se o usuário pode editar ou excluir uma tarefa baseada na hierarquia.
   */
  const podeGerenciar = (projetoId: number) => {
    // 1. MASTER e GESTOR têm permissão total e global
    if (role === 'MASTER' || role === 'GESTOR') return true;

    // 2. Se for GERENTE, verifica se ele possui o papel de LIDER no projeto desta tarefa
    const projeto = projetos.find(p => p.id === projetoId);
    return projeto?.meuPapel === 'LIDER_PROJETO';
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.put(`/tarefas/${id}`, { status: newStatus });
      setTarefas(prev => 
        prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t)
      );
    } catch (err) {
      alert("Erro ao atualizar o status.");
    }
  };

  const handleDeleteTarefa = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;
    try {
      await api.delete(`/tarefas/${id}`);
      setTarefas(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Você não tem permissão para excluir esta tarefa.");
    }
  };

  // --- Lógica do Gráfico de Progresso ---
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

  const renderStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-[10px] font-bold rounded-full uppercase ";
    switch (status.toUpperCase()) {
      case 'PENDENTE': return <span className={`${baseClasses} bg-amber-100 text-amber-700`}>Pendente</span>;
      case 'EM_ANDAMENTO': return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>Em curso</span>;
      case 'CONCLUIDA': return <span className={`${baseClasses} bg-green-100 text-green-700`}>Concluída</span>;
      case 'BLOQUEADA': return <span className={`${baseClasses} bg-red-100 text-red-700 border border-red-200`}>Bloqueada</span>;
      default: return <span className={`${baseClasses} bg-slate-100 text-slate-600`}>{status}</span>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Minhas Atribuições</h2>
            <p className="text-slate-500 text-sm">Olá, {username}. Nível de acesso: <span className="font-bold text-indigo-600">{role}</span></p>
          </div>
        </div>

        {/* Resumo Gráfico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="h-[220px] flex justify-center">
            {tarefas.length > 0 ? (
              <Doughnut data={dataChart} options={{ maintainAspectRatio: false }} />
            ) : (
              <div className="text-slate-400 italic self-center">Sem dados para exibir no gráfico</div>
            )}
          </div>
        </div>

        {/* Listagem de Tarefas com Condicionais de Gestão */}
        <div className="grid gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            📋 Lista Detalhada {role !== 'FUNCIONARIO' && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400">Modo Gestão Ativado</span>}
          </h3>
          
          {loading ? (
            <div className="text-center py-10 text-slate-400 italic">Sincronizando tarefas...</div>
          ) : tarefas.length > 0 ? (
            tarefas.map(task => (
              <div 
                key={task.id} 
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase w-fit">
                        📁 {task.nomeProjeto}
                      </span>
                      {/* Selo de Líder: Aparece se o usuário for o gestor deste projeto específico */}
                      {podeGerenciar(task.projetoId) && role === 'GERENTE' && (
                        <span title="Você é líder deste projeto" className="text-[10px]">⭐</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800">{task.titulo}</h4>
                    <p className="text-xs text-slate-500">{task.descricao}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 justify-between md:justify-end">
                  {renderStatusBadge(task.status)}
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-xs font-bold py-1.5 px-3 bg-slate-50 rounded-lg border-none cursor-pointer focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_ANDAMENTO">Em curso</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="BLOQUEADA">Bloqueada</option>
                    </select>

                    {/* AÇÕES DE GESTÃO: Só renderizam se 'podeGerenciar' retornar true */}
                    {podeGerenciar(task.projetoId) && (
                      <div className="flex gap-1 ml-2 border-l pl-2 border-slate-100">
                        <button 
                          onClick={() => alert("Abrir modal de edição...")}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"
                          title="Editar tarefa"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteTarefa(task.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                          title="Excluir tarefa"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>  
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              Nenhuma tarefa encontrada para o seu perfil.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};