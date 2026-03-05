import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { Tarefa } from '../types'; // Importando nosso novo tipo
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export const DashboardPage = () => {
  const { username } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTarefas = async () => {
    try {
      const response = await api.get('/tarefas/minhas-tarefas');
      setTarefas(response.data);
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTarefas(); }, []);

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

  // --- Lógica do Gráfico ---
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
      default: return <span className={`${baseClasses} bg-slate-100 text-slate-600`}>{status}</span>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Minhas Atribuições</h2>
          <p className="text-slate-500 text-sm">Olá, {username}. Gerencie suas tarefas por projeto.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="h-[220px] flex justify-center">
            {tarefas.length > 0 ? <Doughnut data={dataChart} options={{ maintainAspectRatio: false }} /> : <div className="text-slate-400 italic">Sem dados</div>}
          </div>
        </div>

        <div className="grid gap-4">
          <h3 className="font-bold text-slate-800">Lista Detalhada</h3>
          {loading ? (
            <div className="text-center py-10">Carregando...</div>
          ) : (
            tarefas.map(task => (
              <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    {/* NOVO: Badge do Projeto vindo do Backend */}
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase w-fit">
                      📁 {task.nomeProjeto}
                    </span>
                    <h4 className="font-bold text-slate-800">{task.titulo}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">
                      {task.nomeLista ? `Lista: ${task.nomeLista}` : 'Sem Lista Específica'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {renderStatusBadge(task.status)}
                  <select 
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="text-xs font-bold py-1.5 px-3 bg-slate-50 rounded-lg border-none cursor-pointer"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em curso</option>
                    <option value="CONCLUIDA">Concluída</option>
                  </select>
                </div>  
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};