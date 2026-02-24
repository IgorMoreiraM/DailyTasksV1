import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext'; // 1. Importar useAuth
import styles from './CreatePage.module.css'; 

// --- Interfaces ---
interface Equipe { id: number; nome: string; }
interface Funcionario { id: number; nomeCompleto: string; }
interface Lista { id: number; nome: string; } 

export const CreatePage = () => {
  const navigate = useNavigate();
  // 2. Obter a função de refresh
  const { refreshAdminData } = useAuth(); 

  // --- Estados dos Dropdowns ---
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [listas, setListas] = useState<Lista[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Estados do Formulário de Lista ---
  const [listName, setListName] = useState('');
  const [listEquipeId, setListEquipeId] = useState(''); 
  const [formListError, setFormListError] = useState('');

  // --- Estados do Formulário de Tarefa ---
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescricao, setTaskDescricao] = useState('');
  const [taskDataVencimento, setTaskDataVencimento] = useState('');
  const [taskFuncionarioId, setTaskFuncionarioId] = useState('');
  const [taskListId, setTaskListId] = useState('');
  const [formTaskError, setFormTaskError] = useState('');

  // useEffect para carregar TUDO (Equipes, Funcionários, Listas)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [equipesRes, funcRes, listasRes] = await Promise.all([
          api.get('/equipes'),
          api.get('/funcionarios'),
          api.get('/listas-tarefas')
        ]);
        setEquipes(equipesRes.data);
        setFuncionarios(funcRes.data);
        setListas(listasRes.data);
      } catch (err) {
        setError('Falha ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Handlers ---
  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault();
    setFormListError('');
    try {
      await api.post('/listas-tarefas', {
        nome: listName,
        equipeId: Number(listEquipeId)
      });
      
      // 3. DISPARA O SINAL!
      refreshAdminData(); 
      
      navigate('/admin'); // Volta para a dashboard
    } catch (err: any) {
      setFormListError(err.response?.data?.message || 'Erro ao criar lista.');
    }
  };

  const handleCreateTask = async (e: FormEvent) => {
     e.preventDefault();
     setFormTaskError('');
     try {
        await api.post('/tarefas', {
            titulo: taskTitle,
            descricao: taskDescricao,
            dataDeVencimento: taskDataVencimento, // Formato YYYY-MM-DD
            listaId: Number(taskListId),
            funcionarioId: Number(taskFuncionarioId)
        });
        
        // 4. DISPARA O SINAL!
        refreshAdminData();
        
        navigate('/admin'); // Volta para a dashboard
     } catch (err: any) {
        console.error("Erro ao criar tarefa:", err);
        setFormTaskError(err.response?.data?.message || 'Erro ao criar tarefa.');
     }
  };

  // --- Renderização ---
  if (loading) {
    return ( <> <Header /> <main className={styles.main}><p>A carregar...</p></main> </> );
  }
  if (error) {
     return ( <> <Header /> <main className={styles.main}><p>{error}</p></main> </> );
  }

  return (
    <>
      <Header /> 
      
      <main className={styles.main}>
        
        {/* --- Formulário de Criar Lista --- */}
        <section className={styles.createListsSection}>
          <h3>Criar Nova Lista</h3>
          <form onSubmit={handleCreateList} className={styles.form}>
            <input
              type="text" id="listName" placeholder="Nome da lista"
              value={listName} onChange={(e) => setListName(e.target.value)}
              required className={styles.input}
            />
            <select
              id="listEquipe" value={listEquipeId}
              onChange={(e) => setListEquipeId(e.target.value)}
              required className={styles.select}
            >
              <option value="" disabled>Selecione uma Equipa...</option>
              {equipes.map(equipe => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.button}>Criar Lista</button>
            {formListError && <p className={styles.errorMessage}>{formListError}</p>} 
            {/* (Adicione .errorMessage ao seu CreatePage.module.css se necessário) */}
          </form>
        </section>

        {/* --- Formulário de Criar Tarefa --- */}
        <section className={styles.assignTasksSection}>
          <h3>Criar Nova Tarefa</h3>
          <form onSubmit={handleCreateTask} className={styles.form}>
            <input
              type="text" id="taskTitle" placeholder="Título da tarefa"
              value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
              required className={styles.input}
            />
            <input
              type="text" id="taskDescricao" placeholder="Descrição da tarefa"
              value={taskDescricao} onChange={(e) => setTaskDescricao(e.target.value)}
              className={styles.input}
            />
            <input
              type="date" id="taskData"
              value={taskDataVencimento} onChange={(e) => setTaskDataVencimento(e.target.value)}
              className={styles.input}
            />
            <select
              id="taskList" value={taskListId}
              onChange={(e) => setTaskListId(e.target.value)}
              required className={styles.select}
            >
              <option value="" disabled>Selecione uma Lista...</option>
              {listas.map(lista => (
                <option key={lista.id} value={lista.id}>
                  {lista.nome}
                </option>
              ))}
            </select>
            <select
              id="taskEmployees" value={taskFuncionarioId}
              onChange={(e) => setTaskFuncionarioId(e.target.value)}
              required className={styles.select}
            >
              <option value="" disabled>Selecione um Funcionário...</option>
              {funcionarios.map(func => (
                <option key={func.id} value={func.id}>
                  {func.nomeCompleto}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.button}>Adicionar Tarefa</button>
            {formTaskError && <p className={styles.errorMessage}>{formTaskError}</p>}
          </form>
        </section>
      </main>

      <footer className={styles.footer}>
        <a href="#">Sobre nós</a>
        <a href="#">Contate-nos</a>
        <a href="#">Termos e Condições</a>
      </footer>
    </>
  );
};