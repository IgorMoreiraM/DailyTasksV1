package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.ListaTarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório padronizado para a entidade ListaTarefa.
 */
@Repository
public interface ListaTarefasRepository extends JpaRepository<ListaTarefa, Long> {
}