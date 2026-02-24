import api from '../api';
import styles from '../pages/Home.module.css'; // Vamos reutilizar os estilos .select e .button

// Define os status possíveis
// (Deve corresponder ao seu Enum 'TaskStatus.java' no backend)
const STATUS_OPTIONS = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "BLOQUEADA"
];

interface StatusSelectProps {
  tarefaId: number;
  statusAtual: string;
  // Esta é uma função que o componente "pai" (DashboardPage) nos passa
  // para que possamos atualizar o estado lá
  onStatusChange: (tarefaId: number, novoStatus: string) => void;
}

export const StatusSelect = ({ tarefaId, statusAtual, onStatusChange }: StatusSelectProps) => {

  const handleSelectChange = async (novoStatus: string) => {
    if (novoStatus === statusAtual) {
      return; // Não faz nada se o status for o mesmo
    }

    try {
      // 1. Chama o endpoint do backend que já criámos
      // PATCH /tarefas/{id}/status
      const response = await api.patch(`/tarefas/${tarefaId}/status`, {
        novoStatus: novoStatus
      });

      // 2. Avisa o componente "pai" (DashboardPage) que o status mudou,
      // enviando a tarefa completa e atualizada de volta
      onStatusChange(tarefaId, response.data.status);

    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      // (Numa app real, mostraríamos um erro ao utilizador)
    }
  };

  return (
    <select
      className={styles.select}
      value={statusAtual}
      onChange={(e) => handleSelectChange(e.target.value)}
      style={{ minWidth: '150px' }} // Um pequeno estilo inline
    >
      {STATUS_OPTIONS.map(status => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
};