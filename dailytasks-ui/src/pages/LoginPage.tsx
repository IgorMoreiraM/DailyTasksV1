import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Rocket, Lock, User, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { isAuthenticated, role, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { username, password });
      // O login() do AuthContext deve salvar o token e decodificar o cargo (role)
      login(response.data.token);
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE REDIRECIONAMENTO INTELIGENTE ---
  if (isAuthenticated) {
    if (role === 'MASTER') return <Navigate to="/master" replace />;
    if (role === 'GESTOR') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 w-full max-w-md border border-slate-100 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        
        {/* LOGO ANIMADA */}
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-indigo-200 group transition-all">
          <Rocket className="text-white group-hover:rotate-12 transition-transform" size={32} />
        </div>

        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Daily Tasks</h2>
        <p className="text-slate-400 mb-10 text-center font-medium text-sm">
          Acesse sua central de produtividade <span className="text-indigo-600 font-bold"></span>
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* CAMPO USUÁRIO */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Usuário / Login</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                type="text"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* CAMPO SENHA */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* BOTÃO DE ENTRADA */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all mt-4 shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
          >
            {loading ? 'AUTENTICANDO...' : (
              <>
                ACESSAR PAINEL 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>

          {/* TRATAMENTO DE ERRO */}
          {error && (
            <div className="flex items-center gap-2 justify-center bg-red-50 text-red-500 p-3 rounded-xl border border-red-100 mt-2 animate-bounce">
              <AlertCircle size={16} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
        </form>

        <p className="mt-10 text-[9px] text-slate-300 font-black uppercase tracking-widest text-center">
          Enterprise Infrastructure • Secure Access
        </p>
      </div>
    </div>
  );
};