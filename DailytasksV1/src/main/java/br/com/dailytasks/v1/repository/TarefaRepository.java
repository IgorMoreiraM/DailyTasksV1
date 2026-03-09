package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repositório para gestão de persistência da entidade Tarefa.
 * Fornece métodos de busca customizados para filtros de dashboard e projetos.
 * * @author Equipe Daily Tasks
 * @version 2.5
 */
@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    /**
     * Busca tarefas vinculadas a uma lista específica (Ex: To-Do, Doing, Done).
     * @param listaId ID da lista de tarefas.
     */
    List<Tarefa> findByListaTarefaId(Long listaId);

    /**
     * Busca todas as tarefas atribuídas a um funcionário específico.
     * Essencial para a visão "Minhas Tarefas" do colaborador logado.
     * @param funcionarioId ID do funcionário.
     */
    List<Tarefa> findByFuncionarioAtribuidoId(Long funcionarioId);

    /**
     * Busca todas as tarefas de um projeto específico.
     * Este método é o "coração" da nova ProjectDetailPage.tsx.
     * @param projetoId ID do projeto.
     */
    List<Tarefa> findByProjetoId(Long projetoId);

    /**
     * (Opcional) Busca tarefas por projeto e status.
     * Útil para gerar os dados do gráfico de rosca de um projeto específico.
     */
    long countByProjetoIdAndStatus(Long projetoId, String status);
}