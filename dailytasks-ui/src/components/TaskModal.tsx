import { useState, useEffect } from 'react';
import api from '../api';
import { Funcionario } from '../types';
import { 
  X, 
  Target, 
  User, 
  Calendar, 
  AlignLeft, 
  Loader2 
} from 'lucide-react';

interface TaskModalProps {
  projectId: string;
  listaId: number; // Agora obrigatório para o Kanban funcionar
  initialStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskModal = ({ projectId, listaId, initialStatus, onClose, onSuccess }: TaskModalProps) => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    dataDeVencimento: '',
    funcionarioId: '',
  });

  useEffect(() => {
    // Carrega apenas os membros da empresa (Backend já filtra via JWT)
    api.get('/funcionarios')
      .then(res => setFuncionarios(res.data))
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tarefas', {
        ...form,
        projetoId: Number(projectId),
        listaId: Number(listaId),
        status: initialStatus,
        funcionarioId: Number(form.funcionarioId)
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao criar tarefa. Verifique se todos os campos estão corretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative animate-in zoom-in-95 duration-200">
        
        {/* BOTÃO FECHAR */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <header className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">
            Nova Demanda
          </h2>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">
            Coluna: {initialStatus.replace('_', ' ')}
          </p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* TÍTULO */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título</label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                placeholder="O que precisa ser feito?"
                value={form.titulo}
                onChange={e => setForm({...form, titulo: e.target.value})}
                required
              />
            </div>
          </div>

          {/* RESPONSÁVEL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Responsável</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-indigo-600 outline-none appearance-none cursor-pointer"
                value={form.funcionarioId}
                onChange={e => setForm({...form, funcionarioId: e.target.value})}
                required
              >
                <option value="">Delegar para...</option>
                {funcionarios.map(f => (
                  <option key={f.id} value={f.id}>{f.nomeCompleto}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DATA E PRAZO */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prazo Final</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="date"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 outline-none"
                value={form.dataDeVencimento}
                onChange={e => setForm({...form, dataDeVencimento: e.target.value})}
                required
              />
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Instruções</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-slate-300" size={16} />
              <textarea 
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
                placeholder="Detalhe os requisitos desta tarefa..."
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />
            </div>
          </div>

          {/* AÇÕES */}
          <div className="pt-4 flex gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Efetivar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};