import api from '../api';
import styles from '../pages/Home.module.css';

const STATUS_OPTIONS = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "BLOQUEADA",
  "CANCELADA" 
];

interface StatusSelectProps {
  tarefaId: number;
  statusAtual: string;
  onStatusChange: (tarefaId: number, novoStatus: string) => void;
}

export const StatusSelect = ({ tarefaId, statusAtual, onStatusChange }: StatusSelectProps) => {

  const handleSelectChange = async (novoStatus: string) => {
    if (novoStatus === statusAtual) return;

    try {
      // O seu endpoint espera um objeto { novoStatus: "..." }
      const response = await api.patch(`/tarefas/${tarefaId}/status`, {
        novoStatus: novoStatus
      });

      onStatusChange(tarefaId, response.data.status);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  return (
    <select
      className={styles.select}
      value={statusAtual}
      onChange={(e) => handleSelectChange(e.target.value)}
      style={{ 
        minWidth: '150px',
        // Dica: Adicione uma cor de borda condicional se quiser
        borderColor: statusAtual === 'BLOQUEADA' ? '#ef4444' : '#e5e7eb' 
      }}
    >
      {STATUS_OPTIONS.map(status => (
        <option key={status} value={status}>
          {/* O replace deixa "EM_ANDAMENTO" como "EM ANDAMENTO" para o usuário */}
          {status.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
};