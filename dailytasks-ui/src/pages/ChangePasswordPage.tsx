import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export const ChangePasswordPage = () => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmar) return alert("As senhas não conferem!");

    try {
      await api.patch('/funcionarios/alterar-senha', { novaSenha });
      alert("Senha alterada! Por segurança, faça login novamente.");
      logout(); // Força um novo login com a senha nova
      navigate('/login');
    } catch (err) {
      alert("Erro ao alterar senha.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100">
        <div className="text-center mb-8">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-black text-slate-800 mt-4">Primeiro Acesso</h1>
          <p className="text-slate-500 text-sm">Por segurança, você precisa definir uma senha pessoal antes de continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nova Senha</label>
            <input 
              type="password" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmar Nova Senha</label>
            <input 
              type="password" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            ATUALIZAR E ENTRAR
          </button>
        </form>
      </div>
    </div>
  );
};