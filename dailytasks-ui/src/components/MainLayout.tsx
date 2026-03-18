import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Building2, PlusCircle, ShieldCheck, LogOut, Rocket } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isMaster = role === 'MASTER';
  const isGestor = role === 'GESTOR';
  const isGerente = role === 'GERENTE';

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      
      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* LOGO DINÂMICA */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate(isMaster ? '/master' : '/dashboard')}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMaster ? 'bg-rose-600 shadow-lg shadow-rose-100' : 'bg-indigo-600 shadow-lg shadow-indigo-100'}`}>
              <Rocket className="text-white group-hover:rotate-12 transition-transform" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 leading-none tracking-tight text-lg">Daily Tasks</span>
              <span className={`text-[9px] uppercase font-bold tracking-[0.2em] ${isMaster ? 'text-rose-500' : 'text-indigo-500'}`}>
                {isMaster ? 'Painel Master' : 'SaaS Edition'}
              </span>
            </div>
          </div>

          {/* NAVEGAÇÃO EXCLUSIVA POR CARGO */}
          <nav className="hidden lg:flex bg-slate-100/80 p-1.5 rounded-2xl gap-1">
            
            {/* --- VISÃO MASTER --- */}
            {isMaster && (
              <button 
                onClick={() => navigate('/master')}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${isActive('/master') ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
              >
                <ShieldCheck size={14} /> CENTRAL MASTER
              </button>
            )}

            {/* --- VISÃO OPERACIONAL (Não aparece para Master) --- */}
            {!isMaster && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${isActive('/dashboard') ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                >
                  <LayoutDashboard size={14} /> DASHBOARD
                </button>

                {/* GESTÃO: Apenas para Gestor (Dono da conta do cliente) */}
                {isGestor && (
                  <button 
                    onClick={() => navigate('/admin')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${isActive('/admin') ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                  >
                    <Building2 size={14} /> GESTÃO
                  </button>
                )}

                {/* CRIAR: Para Gestor e Gerente */}
                {(isGestor || isGerente) && (
                  <button 
                    onClick={() => navigate('/criar')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${isActive('/criar') ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                  >
                    <PlusCircle size={14} /> CRIAR
                  </button>
                )}
              </>
            )}
          </nav>

          {/* PERFIL E LOGOUT */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-black text-slate-900 leading-none mb-1">{username}</p>
              <div className="flex justify-end">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                  isMaster ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                  isGestor ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {isMaster ? 'Root Admin' : role}
                </span>
              </div>
            </div>
            
            <button 
              onClick={logout} 
              className="w-12 h-12 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl border border-slate-200 transition-all shadow-sm group"
              title="Encerrar Sessão"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Daily Tasks</p>
            <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Gerenciamento Multi-empresa</p>
          </div>
          <div className="flex gap-8">
            <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase">Segurança</button>
            <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase">Suporte</button>
          </div>
        </div>
      </footer>
    </div>
  );
};