package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    // O nome deve ser findBy + NomeDoCampoNoModel + Id
    // Se no Tarefa.java o campo é 'listaTarefa', o método DEVE ser este:
    List<Tarefa> findByListaTarefaId(Long listaId);

    // Se o campo for 'funcionarioAtribuido', o método deve ser este:
    List<Tarefa> findByFuncionarioAtribuidoId(Long funcionarioId);

    // Se você tiver um método para buscar por projeto:
    List<Tarefa> findByProjetoId(Long projetoId);
}