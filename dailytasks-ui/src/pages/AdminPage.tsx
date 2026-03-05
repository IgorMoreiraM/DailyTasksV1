import { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MainLayout } from '../components/MainLayout';

/**
 * Registro de componentes essenciais do Chart.js para o gráfico de rosca.
 */
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Componente AdminPage
 * Responsável pela gestão centralizada de funcionários e visualização de métricas globais.
 * Permite as operações de CRUD (Create, Read, Update, Delete) de colaboradores.
 */
export const AdminPage = () => {
  // Estado para armazenar dados vindos da API
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário (Campos compartilhados e específicos)
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [role, setRole] = useState('FUNCIONARIO'); // Valor padrão comum
  const [usernameField, setUsernameField] = useState(''); // Necessário para criação
  const [passwordField, setPasswordField] = useState(''); // Necessário para criação
  const [editId, setEditId] = useState<number | null>(null);

  /**
   * Busca inicial de dados do Dashboard Administrativo.
   * Recupera a lista global de tarefas e o quadro de funcionários.
   */
  const fetchData = async () => {
    try {
      const [resT, resF] = await Promise.all([
        api.get('/tarefas'), 
        api.get('/funcionarios')
      ]);
      setTarefas(resT.data);
      setFuncionarios(resF.data);
    } catch (err) {
      console.error("Erro ao carregar dados administrativos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Processa a submissão do formulário.
   * Diferencia entre criação (POST) e atualização (PUT) com base no estado 'editId'.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        // Fluxo de Atualização (Conforme FuncionarioUpdateDTO)
        await api.put(`/funcionarios/${editId}`, { 
          nomeCompleto, 
          role 
        });
        alert("Dados do colaborador atualizados.");
      } else {
        // Fluxo de Criação (Conforme FuncionarioCreateDTO)
        // O erro 403 geralmente ocorre pela falta de 'username' ou 'password'
        await api.post('/funcionarios', { 
          username: usernameField,
          password: passwordField,
          nomeCompleto, 
          role 
        });
        alert("Novo colaborador cadastrado com sucesso.");
      }
      
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error("Erro na operação de funcionário:", err);
      // Tratamento amigável para erro de permissão (403)
      if (err.response?.status === 403) {
        alert("Erro 403: Você não tem permissão para realizar esta ação ou faltam campos obrigatórios.");
      } else {
        alert("Ocorreu um erro ao processar a requisição.");
      }
    }
  };

  /**
   * Remove um funcionário do sistema após confirmação.
   */
  const handleDelete = async (id: number) => {
    if (window.confirm("Remover este colaborador permanentemente?")) {
      try {
        await api.delete(`/funcionarios/${id}`);
        setFuncionarios(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        alert("Erro ao excluir funcionário. Verifique se ele possui tarefas pendentes.");
      }
    }
  };

  /**
   * Prepara o formulário para o modo de edição.
   */
  const startEdit = (emp: any) => {
    setEditId(emp.id);
    setNomeCompleto(emp.nomeCompleto);
    setRole(emp.role);
    // Campos de login não são editáveis neste fluxo por segurança
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Limpa todos os campos do formulário e redefine o modo para 'Criação'.
   */
  const resetForm = () => {
    setEditId(null);
    setNomeCompleto('');
    setRole('USER');
    setUsernameField('');
    setPasswordField('');
  };

  // Configuração dos dados para o gráfico de produtividade
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
      <section className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Seção de Gráficos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><span>📈</span> Status Global das Tarefas</h3>
            <div className="h-[300px] flex justify-center">
              <Doughnut data={dataChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            </div>
          </div>

          {/* Formulário de Gestão */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-slate-800 mb-6">
              {editId ? '📝 Editar Colaborador' : '👤 Novo Funcionário'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {!editId && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Usuário (Login)</label>
                    <input 
                      type="text" 
                      value={usernameField}
                      onChange={(e) => setUsernameField(e.target.value)}
                      placeholder="Ex: joao.silva" 
                      className="p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Senha Provisória</label>
                    <input 
                      type="password" 
                      value={passwordField}
                      onChange={(e) => setPasswordField(e.target.value)}
                      placeholder="No mínimo 6 caracteres" 
                      className="p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                      required 
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                  required 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nível de Acesso</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="FUNCIONARIO">Funcionário</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-700 transition-colors">
                  {editId ? 'Atualizar' : 'Cadastrar'}
                </button>
                {editId && (
                  <button type="button" onClick={resetForm} className="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-lg font-bold">
                    X
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Lista de Membros */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Equipe Daily Tasks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {funcionarios.map(emp => (
              <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                    {emp.nomeCompleto[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">{emp.nomeCompleto}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.role}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-50">
                  <button onClick={() => startEdit(emp)} className="text-[10px] font-bold text-slate-400 hover:text-amber-600 transition-colors">EDITAR</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors">EXCLUIR</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};