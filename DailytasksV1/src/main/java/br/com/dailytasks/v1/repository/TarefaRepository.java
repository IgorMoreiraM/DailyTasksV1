package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    // Query customizada para o Funcionário ver suas tarefas
    // "Encontre Tarefas pelo ID do campo 'funcionarioAtribuido'"
    List<Tarefa> findByFuncionarioAtribuidoId(Long funcionarioId);

    // Query customizada para o Admin ver tarefas de uma lista
    // "Encontre Tarefas pelo ID do campo 'listaDeTarefas'"
    List<Tarefa> findByListaDeTarefasId(Long listaId);
}