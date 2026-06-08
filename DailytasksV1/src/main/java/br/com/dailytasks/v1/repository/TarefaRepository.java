package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    List<Tarefa> findByEmpresaId(Long empresaId);

    List<Tarefa> findByListaTarefaId(Long listaId);

    List<Tarefa> findByFuncionarioAtribuidoId(Long funcionarioId);

    List<Tarefa> findByProjetoId(Long projetoId);

    long countByProjetoIdAndStatus(Long projetoId, String status);

    List<Tarefa> findByFuncionarioAtribuidoIdAndEmpresaId(Long funcionarioId, Long empresaId);
}