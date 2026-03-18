import { useState, useEffect, FormEvent } from 'react';
import api from '../api';
import { MainLayout } from '../components/MainLayout';
import { SuccessModal } from '../components/SuccessModal';
import { Projeto, Lista, Funcionario } from '../types';
import { 
  Rocket, 
  CheckSquare, 
  Plus, 
  FolderPlus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CreatePage = () => {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  
  // Estados de Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastCreatedTask, setLastCreatedTask] = useState('');

  // --- ESTADOS DOS FORMULÁRIOS ---
  
  // 1. Projeto
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  
  // 2. Tarefa
  const [taskForm, setTaskForm] = useState({
    titulo: '',
    projetoId: '',
    listaId: '',
    funcionarioId: '',
    dataDeVencimento: ''
  });

  const fetchData = async () => {
    try {
      const [resFunc, resProj, resList] = await Promise.all([
        api.get('/funcionarios'),
        api.get('/projetos'),
        api.get('/listas')
      ]);
      setFuncionarios(resFunc.data);
      setProjetos(resProj.data);
      setListas(resList.data);
    } catch (err) { 
      console.error("Erro ao carregar dados:", err); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projetos', { nome: projectName, descricao: projectDesc });
      alert("Projeto criado com sucesso!");
      setProjectName(''); setProjectDesc('');
      fetchData();
    } catch (err) { alert("Erro ao criar projeto."); }
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tarefas', {
        titulo: taskForm.titulo,
        funcionarioId: Number(taskForm.funcionarioId),
        dataDeVencimento: taskForm.dataDeVencimento,
        projetoId: Number(taskForm.projetoId),
        listaId: taskForm.listaId ? Number(taskForm.listaId) : null
      });
      
      setLastCreatedTask(taskForm.titulo);
      setIsModalOpen(true);
      setTaskForm({ ...taskForm, titulo: '', dataDeVencimento: '' });
    } catch (err) { alert("Erro ao lançar tarefa."); }
  };

  // --- AQUI ESTAVA O ERRO: Definição da variável de filtragem ---
  const listasFiltradas = listas.filter(l => l.projeto?.id === Number(taskForm.projetoId));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        <div className="border-b border-slate-100 pb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Central de Demandas</h1>
          <p className="text-slate-500 font-medium">Crie estruturas de projetos e delegue tarefas para a equipe.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CARD: NOVO PROJETO */}
          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 h-fit">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <FolderPlus size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800">Novo Projeto</h2>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-5">
              <input 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                placeholder="Nome do Projeto"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                required
              />
              <textarea 
                className="w-full p-4 bg-slate-50 border-none rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none text-sm"
                placeholder="Descrição rápida..."
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
              />
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 uppercase text-[10px] tracking-widest">
                Criar Projeto
              </button>
            </form>
          </section>

          {/* CARD: LANÇAR TAREFA (Ocupa 2 colunas) */}
          <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-indigo-50 space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                <CheckSquare size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Lançar Tarefa</h2>
            </div>

            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título da Tarefa</label>
                  <input 
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600 text-lg"
                    placeholder="O que deve ser feito?"
                    value={taskForm.titulo}
                    onChange={e => setTaskForm({...taskForm, titulo: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Projeto</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[10px] uppercase tracking-widest outline-none"
                      value={taskForm.projetoId}
                      onChange={e => setTaskForm({...taskForm, projetoId: e.target.value})}
                      required
                    >
                      <option value="">Selecionar...</option>
                      {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Coluna</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[10px] uppercase tracking-widest outline-none"
                      value={taskForm.listaId}
                      onChange={e => setTaskForm({...taskForm, listaId: e.target.value})}
                    >
                      <option value="">Opcional...</option>
                      {listasFiltradas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Responsável</label>
                  <select 
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-indigo-600 outline-none"
                    value={taskForm.funcionarioId}
                    onChange={e => setTaskForm({...taskForm, funcionarioId: e.target.value})}
                    required
                  >
                    <option value="">Quem executará?</option>
                    {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nomeCompleto}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Limite</label>
                  <input 
                    type="date"
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 outline-none"
                    value={taskForm.dataDeVencimento}
                    onChange={e => setTaskForm({...taskForm, dataDeVencimento: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="md:col-span-2 bg-indigo-600 text-white font-black py-5 rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                <Plus size={20} /> Efetivar Tarefa
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* MODAL DE SUCESSO */}
      <SuccessModal 
        isOpen={isModalOpen}
        taskTitle={lastCreatedTask}
        onClose={() => setIsModalOpen(false)}
        onGoToDashboard={() => navigate('/dashboard')}
      />
    </MainLayout>
  );
};