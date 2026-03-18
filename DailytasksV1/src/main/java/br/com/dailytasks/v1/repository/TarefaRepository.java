package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repositório para gestão de persistência da entidade Tarefa.
 * Versão 4.0: Suporte total a Multi-tenancy (Isolamento por Empresa).
 * * @author Equipe Daily Tasks
 * @version 4.0
 */
@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    /**
     * MÉTODO DE ISOLAMENTO (Multi-tenancy):
     * Busca todas as tarefas que pertencem a uma empresa específica.
     * @param empresaId ID da empresa para filtragem global.
     */
    List<Tarefa> findByEmpresaId(Long empresaId);

    /**
     * Busca tarefas vinculadas a uma lista específica (Ex: To-Do, Doing, Done).
     */
    List<Tarefa> findByListaTarefaId(Long listaId);

    /**
     * Busca todas as tarefas atribuídas a um funcionário específico.
     * Utilizado para a visão "Minhas Tarefas".
     */
    List<Tarefa> findByFuncionarioAtribuidoId(Long funcionarioId);

    /**
     * Busca todas as tarefas de um projeto específico.
     */
    List<Tarefa> findByProjetoId(Long projetoId);

    /**
     * Busca tarefas por projeto e status para métricas e gráficos.
     */
    long countByProjetoIdAndStatus(Long projetoId, String status);

    /**
     * (Novo) Busca tarefas de um funcionário, garantindo o isolamento da empresa.
     * Segurança extra para evitar que IDs de funcionários de outras empresas sejam acessados.
     */
    List<Tarefa> findByFuncionarioAtribuidoIdAndEmpresaId(Long funcionarioId, Long empresaId);
}