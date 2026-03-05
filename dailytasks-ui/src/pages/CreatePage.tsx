import { useState, useEffect, FormEvent } from 'react';
import api from '../api';
import { MainLayout } from '../components/MainLayout';
import { Projeto, Lista, Funcionario } from '../types'; // Importando tipos centrais

export const CreatePage = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);

  // Estados dos Formulários
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [listName, setListName] = useState('');
  const [listProjectId, setListProjectId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskListaId, setTaskListaId] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDate, setTaskDate] = useState('');

  const fetchData = async () => {
    try {
      const [resFunc, resProj, resList] = await Promise.all([
        api.get('/funcionarios'),
        api.get('/projetos'),
        api.get('/listas')
      ]);
      setFuncionarios(resFunc.data);
      setProjetos(resProj.data);
      setListas(resList.data);
      
      if (resFunc.data.length > 0) setTaskAssignee(resFunc.data[0].id);
      if (resProj.data.length > 0) {
        setListProjectId(resProj.data[0].id);
        setTaskProjectId(resProj.data[0].id);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projetos', { nome: projectName, descricao: projectDesc });
      alert("Projeto criado!");
      setProjectName(''); setProjectDesc('');
      fetchData();
    } catch (err) { alert("Erro ao criar projeto."); }
  };

  const handleCreateList = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/listas', { 
        nome: listName,
        projetoId: Number(listProjectId) // Backend espera o ID puro agora
      });
      alert("Lista criada!");
      setListName('');
      fetchData();
    } catch (err) { alert("Erro ao criar lista."); }
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tarefas', {
        titulo: taskTitle,
        funcionarioId: Number(taskAssignee),
        dataDeVencimento: taskDate,
        projetoId: Number(taskProjectId),
        listaId: taskListaId ? Number(taskListaId) : null
      });
      alert("Tarefa lançada!");
      setTaskTitle('');
    } catch (err) { alert("Erro ao lançar tarefa."); }
  };

  // Filtragem dinâmica de listas baseada no projeto selecionado
  const listasFiltradas = listas.filter(l => l.projeto?.id === Number(taskProjectId));

  return (
    <MainLayout>
       {/* O conteúdo do Return permanece o mesmo do seu arquivo original, 
           porém agora com a lógica de tipos robusta por trás. */}
       {/* ... (Todo o seu JSX do CreatePage) ... */}
    </MainLayout>
  );
};