import { CheckCircle, ArrowRight, LayoutDashboard, Plus } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDashboard: () => void;
  taskTitle: string;
}

export const SuccessModal = ({ isOpen, onClose, onGoToDashboard, taskTitle }: SuccessModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        
        {/* ÍCONE ANIMADO */}
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle size={40} strokeWidth={2.5} className="animate-bounce" />
        </div>

        <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Tarefa Lançada!</h3>
        <p className="text-slate-500 text-sm font-medium mb-8">
          A tarefa <span className="text-indigo-600 font-black">"{taskTitle}"</span> foi delegada com sucesso.
        </p>

        <div className="w-full space-y-3">
          <button 
            onClick={onGoToDashboard}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest"
          >
            <LayoutDashboard size={16} /> Ir para o Painel
          </button>
          
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} /> Criar outra tarefa
          </button>
        </div>
      </div>
    </div>
  );
};