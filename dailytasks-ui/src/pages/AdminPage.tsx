import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
// Importa os estilos da Home (Home.module.css)
import styles from './Home.module.css'; 

// --- Interfaces ---
interface Tarefa { id: number; titulo: string; status: string; nomeFuncionario: string; }
interface Funcionario { id: number; nomeCompleto: string; role: string; }
interface Lista {
  id: number;
  nome: string;
  equipeId: number;
}

export const AdminPage = () => {
  // 1. Obtém os novos itens do AuthContext
  const { username, adminDataVersion, refreshAdminData } = useAuth();
  const navigate = useNavigate();

  // --- Estados da Página ---
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Estados do Formulário de Funcionário ---
  const [newNome, setNewNome] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('FUNCIONARIO');
  const [formError, setFormError] = useState('');

  // 2. useEffect agora "ouve" o adminDataVersion
  useEffect(() => {
    console.log("[AdminPage] useEffect executado (versão: " + adminDataVersion + ")");
    const carregarDadosAdmin = async () => {
      setLoading(true);
      try {
        const [tarefasRes, funcionariosRes, listasRes] = await Promise.all([
            api.get('/tarefas'),
            api.get('/funcionarios'),
            api.get('/listas-tarefas')
        ]);
        
        setTarefas(tarefasRes.data);
        setFuncionarios(funcionariosRes.data);
        setListas(listasRes.data);

      } catch (err) {
        console.error("Falha ao carregar dados do Admin:", err);
        setError("Não foi possível carregar os dados da dashboard.");
      } finally {
        setLoading(false);
      }
    };
    carregarDadosAdmin();
  }, [adminDataVersion]); // <-- Dependência ATUALIZADA

  // --- Handler para adicionar funcionário ---
  const handleAddFuncionario = async (e: FormEvent) => {
    e.preventDefault(); 
    setFormError('');

    try {
      // Chama a API (sem guardar 'response', pois não precisamos mais)
      await api.post('/funcionarios', {
        nomeCompleto: newNome,
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      
      // 3. Dispara o sinal para recarregar TUDO
      refreshAdminData(); 

      // 4. Limpa o formulário
      setNewNome('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('FUNCIONARIO');
    } catch (err: any) {
      console.error("Erro ao adicionar funcionário:", err);
      setFormError(err.response?.data?.message || "Erro ao criar funcionário.");
    }
  };

  // --- Lógica de Renderização ---

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}><p>A carregar dashboard...</p></main>
        <footer className={styles.footer}>
          <a href="#">Sobre nós</a>
          <a href="#">Contate-nos</a>
          <a href="#">Termos e Condições</a>
        </footer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className={styles.main}><p>{error}</p></main> 
        <footer className={styles.footer}>
          <a href="#">Sobre nós</a>
          <a href="#">Contate-nos</a>
          <a href="#">Termos e Condições</a>
        </footer>
      </>
    );
  }

  return (
    <> 
      <Header />

      {/* --- Secção de Perfil --- */}
      <section className={styles.profileBanner}>
        <div className={styles.profileInfo}>
          <div className={styles.profileImage} id="profileImage"></div>
          <div className={styles.profileDetails}>
            <h2 id="profileName">{username}</h2> 
            <span className={styles.role} id="profileRole">Administrador</span>
            <p id="profileMessage">Mantenha-se produtivo</p>
          </div>
        </div>
      </section>

      {/* --- Secção de Boas-vindas --- */}
      <section className={styles.welcome}>
        <h2>Bem-vindo</h2>
        <p>Gerencie suas tarefas de forma eficiente</p>
      </section>

      {/* --- Conteúdo Principal --- */}
      <main className={styles.main}>
        
        {/* --- Secção Equipa --- */}
        <section className={styles.teamSection}>
          <h3>Equipa</h3>
          
          <form onSubmit={handleAddFuncionario} className={styles.form}>
            <input
              type="text"
              placeholder="Nome do funcionário"
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="text" 
              placeholder="Username (E-mail de login)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={styles.input}
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              required
              className={styles.select}
            >
              <option value="FUNCIONARIO">Funcionário</option>
              <option value="ADMIN">Administrador</option>
            </select>
            
            <button type="submit" className={styles.button}>Adicionar Funcionário</button>
            {formError && <p className={styles.errorMessage}>{formError}</p>}
          </form>

          <div id="employeeList" className={styles.employeeList}>
            {funcionarios.length > 0 ? (
              funcionarios.map(func => (
                <div key={func.id} className={styles.employeeCard}>
                  <h4>{func.nomeCompleto}</h4>
                  <p>{func.role}</p>
                </div>
              ))
            ) : ( <p>Nenhum funcionário encontrado.</p> )}
          </div>
        </section>

        {/* --- Secção Tarefas --- */}
        <section className={styles.featuredTasks}>
          <h3>Painel de Administração de Tarefas</h3>
          <div id="taskList" className={styles.taskListContainer}>
            {tarefas.length > 0 ? (
              tarefas.map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <h4>{task.titulo}</h4>
                  <p>Status: {task.status}</p>
                  <p>Atribuído a: {task.nomeFuncionario}</p>
                </div>
              ))
            ) : ( <p>Nenhuma tarefa encontrada.</p> )}
          </div>
        </section>

        {/* --- Secção Listas --- */}
        <section className={styles.recentLists}>
          <h3>Painel de Administração de Listas</h3>
          
          <button 
            className={styles.button} 
            onClick={() => navigate('/criar')}
          >
            Criar Nova Lista ou Tarefa
          </button>
          
          <div id="listsContainer" className={styles.listContainer}>
             {listas.length > 0 ? (
                listas.map(lista => (
                  <div key={lista.id} className={styles.listCard}> 
                    <h4>{lista.nome}</h4>
                  </div>
                ))
             ) : (
                <p>Nenhuma lista encontrada.</p>
             )}
          </div>
        </section>
      </main>

      {/* --- Rodapé --- */}
      <footer className={styles.footer}>
        <a href="#">Sobre nós</a>
        <a href="#">Contate-nos</a>
        <a href="#">Termos e Condições</a>
      </footer>
    </>
  );
};