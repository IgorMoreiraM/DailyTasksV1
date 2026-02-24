import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import styles from './Home.module.css'; 
import { StatusSelect } from '../components/StatusSelect'; // 1. Importar o novo componente

interface Tarefa {
  id: number;
  titulo: string;
  status: string;
}

export const DashboardPage = () => {
  const { username } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMinhasTarefas = async () => {
      try {
        const response = await api.get('/tarefas/minhas-tarefas');
        setTarefas(response.data);
      } catch (err) {
        console.error('Falha ao buscar tarefas:', err);
        setError("Não foi possível carregar as suas tarefas.");
      } finally {
        setLoading(false);
      }
    };
    fetchMinhasTarefas();
  }, []);

  // 2. Nova função de callback que o StatusSelect irá chamar
  const handleStatusUpdated = (tarefaId: number, novoStatus: string) => {
    // Atualiza o estado local do React para refletir a mudança
    // sem precisar de recarregar a página
    setTarefas(tarefasAtuais => 
      tarefasAtuais.map(tarefa => 
        tarefa.id === tarefaId ? { ...tarefa, status: novoStatus } : tarefa
      )
    );
  };


  return (
    <>
      <Header />
      {/* ... (Secções profileBanner e welcome) ... */}

      <main className={styles.main}>
        <section className={styles.featuredTasks}>
          <h3>As Minhas Tarefas</h3>
          <div id="taskList" className={styles.taskListContainer}>
            
            {loading && <p>A carregar tarefas...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && tarefas.length > 0 && (
              tarefas.map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <h4>{task.titulo}</h4>
                  
                  {/* 3. Adicionar o componente de status */}
                  <StatusSelect 
                    tarefaId={task.id}
                    statusAtual={task.status}
                    onStatusChange={handleStatusUpdated}
                  />

                </div>
              ))
            )}

            {!loading && !error && tarefas.length === 0 && (
              <p>Você não tem nenhuma tarefa atribuída.</p>
            )}
            
          </div>
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