package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.ListaTarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repositório padronizado para a entidade ListaTarefa.
 * Fornece inteligência para buscar as colunas do Kanban filtradas por projeto.
 * * @author Equipe Daily Tasks
 * @version 2.0
 */
@Repository
public interface ListaTarefasRepository extends JpaRepository<ListaTarefa, Long> {

    /**
     * Busca todas as listas (colunas) que pertencem a um projeto específico.
     * Este método resolve o erro 'cannot find symbol' no seu ListaTarefasController.
     * * @param projetoId ID do projeto vinculado.
     * @return Lista de colunas do Kanban do projeto informado.
     */
    List<ListaTarefa> findByProjetoId(Long projetoId);
}