package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Long> {

    List<Projeto> findByEmpresaId(Long empresaId);

    boolean existsByIdAndEmpresaId(Long id, Long empresaId);

    @Query("SELECT DISTINCT t.projeto FROM Tarefa t WHERE t.funcionarioAtribuido.id = :funcionarioId AND t.projeto.empresa.id = :empresaId")
    List<Projeto> findByFuncionarioAtribuidoIdAndEmpresaId(
            @Param("funcionarioId") Long funcionarioId,
            @Param("empresaId")    Long empresaId
    );
}