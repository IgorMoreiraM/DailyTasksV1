import { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MainLayout } from '../components/MainLayout';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Plus, 
  Trash2, 
  ExternalLink, 
  UserPlus, 
  ShieldCheck,
  Globe,
  Activity
} from 'lucide-react';
import { EmpresaResponseDTO } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const MasterPanel = () => {
  const [empresas, setEmpresas] = useState<EmpresaResponseDTO[]>([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Controle de Modais
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Estados de Formulário
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: '', cnpj: '' });
  const [gestorForm, setGestorForm] = useState({ 
    nomeCompleto: '', 
    username: '', 
    password: '', 
    empresaId: '' 
  });

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [resEmpresas, resFuncs] = await Promise.all([
        api.get('/empresas'),
        api.get('/funcionarios') // O Master vê todos os funcionários do sistema
      ]);
      setEmpresas(resEmpresas.data);
      setTotalUsuarios(resFuncs.data.length);
    } catch (err) {
      console.error("Erro ao carregar ecossistema:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMasterData(); }, []);

  // Criar Empresa (Tenant)
  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/empresas', novaEmpresa);
      alert("Nova célula empresarial integrada!");
      setShowModal(false);
      setNovaEmpresa({ nome: '', cnpj: '' });
      fetchMasterData();
    } catch (err) {
      alert("Falha na integração da empresa.");
    }
  };

  // Provisionar Gestor (Admin do Cliente)
  const handleCreateGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Enviamos o empresaId como Number para bater com o Long do Java
      await api.post('/funcionarios', {
        ...gestorForm,
        role: 'GESTOR',
        empresaId: Number(gestorForm.empresaId)
      });
      alert(`Acesso GESTOR provisionado com sucesso!`);
      setShowUserModal(false);
      setGestorForm({ nomeCompleto: '', username: '', password: '', empresaId: '' });
      fetchMasterData();
    } catch (err) {
      alert("Erro ao provisionar acesso. Verifique se o login já existe.");
    }
  };

  const handleDeleteEmpresa = async (id: number) => {
    if (!window.confirm("Ação Crítica: Remover esta empresa apagará todos os dados vinculados. Confirmar?")) return;
    try {
      await api.delete(`/empresas/${id}`);
      fetchMasterData();
    } catch (err) {
      alert("Bloqueio de Segurança: A empresa possui registros ativos.");
    }
  };

  const chartData = {
    labels: empresas.map(e => e.nome),
    datasets: [{
      data: empresas.map(() => 1), // Futuramente pode ser número de tarefas/empresa
      backgroundColor: ['#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'],
      hoverOffset: 15,
      borderWidth: 0,
    }]
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* HEADER MASTER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-rose-600" size={32} />
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Central de Infraestrutura</h1>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Globe size={14} /> Monitoramento Global de Instâncias Daily Tasks
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 uppercase text-[10px] tracking-[0.15em]"
            >
              <UserPlus size={18} /> Provisionar Gestor
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase text-[10px] tracking-[0.15em]"
            >
              <Plus size={18} /> Integrar Unidade
            </button>
          </div>
        </div>

        {/* DASHBOARD DE INFRA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Building2 className="text-indigo-600 mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Empresas Ativas</p>
            <p className="text-5xl font-black text-slate-800 mt-2">{empresas.length}</p>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <Users className="text-emerald-500 mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total de Usuários</p>
            <p className="text-5xl font-black text-slate-800 mt-2">{totalUsuarios}</p>
          </div>

          <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-rose-200">
            <Activity className="text-rose-200 mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Status do Sistema</p>
            <p className="text-4xl font-black mt-2 tracking-tighter">ESTÁVEL</p>
          </div>
        </div>

        {/* LISTAGEM E GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <h2 className="w-full text-xl font-black text-slate-800 mb-10 flex items-center gap-2">
                <span className="w-2 h-6 bg-rose-500 rounded-full"></span> Distribuição de Clientes
            </h2>
            <div className="h-[300px] w-full">
              {empresas.length > 0 ? (
                <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300 italic font-medium">Aguardando novos clientes...</div>
              )}
            </div>
          </section>

          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span> Unidades Operacionais
            </h2>
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {empresas.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] hover:bg-white hover:shadow-lg transition-all group border border-transparent hover:border-slate-100">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg tracking-tight">{emp.nome}</h4>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{emp.cnpj || 'CNPJ não registrado'}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-colors" title="Visualizar Instância"><ExternalLink size={18} /></button>
                    <button onClick={() => handleDeleteEmpresa(emp.id)} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-colors" title="Excluir Empresa"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* MODAL: INTEGRAÇÃO DE EMPRESA */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Integrar Cliente</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Provisione uma nova célula isolada no ecossistema.</p>
              
              <form onSubmit={handleCreateEmpresa} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Fantasia</label>
                  <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-rose-500" placeholder="Ex: Corporação Acme" value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CNPJ</label>
                  <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-rose-500" placeholder="00.000.000/0001-00" value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} required />
                </div>
                <div className="pt-4 space-y-3">
                  <button type="submit" className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all uppercase text-xs tracking-widest">Efetivar Integração</button>
                  <button type="button" onClick={() => setShowModal(false)} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PROVISIONAMENTO DE GESTOR */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Provisionar Gestor</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Defina o administrador principal da instância selecionada.</p>
              
              <form onSubmit={handleCreateGestor} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Instância Destino</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-rose-600 outline-none cursor-pointer"
                    value={gestorForm.empresaId}
                    onChange={e => setGestorForm({...gestorForm, empresaId: e.target.value})}
                    required
                  >
                    <option value="">Selecione a Unidade...</option>
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                  </select>
                </div>
                
                <input placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" onChange={e => setGestorForm({...gestorForm, nomeCompleto: e.target.value})} required />
                <input placeholder="Login de Acesso" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" onChange={e => setGestorForm({...gestorForm, username: e.target.value})} required />
                <input type="password" placeholder="Senha Provisória" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" onChange={e => setGestorForm({...gestorForm, password: e.target.value})} required />

                <div className="pt-4 space-y-3">
                  <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest">Liberar Acesso</button>
                  <button type="button" onClick={() => setShowUserModal(false)} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest">Voltar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};