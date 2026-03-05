import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const { isAuthenticated, isAdmin, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/login', { username, password });
      login(response.data.token);
    } catch (err: any) {
      setError('Usuário ou senha incorretos.');
    }
  };

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <div className="fixed inset-0 bg-[#fdfbf7] flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 flex flex-col items-center fade-in">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-3xl">
          📝
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Daily Tasks</h2>
        <p className="text-slate-500 mb-8 text-center">Faça login para gerenciar suas tarefas e equipe.</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Usuário</label>
            <input
              type="text"
              placeholder="ex: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-all mt-2 shadow-lg shadow-amber-600/20">
            Entrar no Sistema
          </button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};