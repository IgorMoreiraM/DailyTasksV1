package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.ListaDeTarefas;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListaDeTarefasRepository extends JpaRepository<ListaDeTarefas, Long> {
}