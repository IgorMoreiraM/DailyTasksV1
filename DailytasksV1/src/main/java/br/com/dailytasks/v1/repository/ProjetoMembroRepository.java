package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.ProjetoMembro;
import br.com.dailytasks.v1.model.ProjetoMembro.ProjetoPapel; // Import essencial para o Enum
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositório para gerenciar os vínculos entre Funcionários e Projetos.
 * Fornece os métodos de verificação necessários para o PermissionService.
 * * @author Equipe Daily Tasks
 * @version 3.0
 */
@Repository
public interface ProjetoMembroRepository extends JpaRepository<ProjetoMembro, Long> {

    /**
     * Busca todos os vínculos de um projeto específico.
     */
    List<ProjetoMembro> findByProjetoId(Long projetoId);

    /**
     * Busca todos os projetos vinculados a um funcionário.
     */
    List<ProjetoMembro> findByFuncionarioId(Long funcionarioId);

    /**
     * Verifica se existe qualquer vínculo entre projeto e funcionário.
     */
    boolean existsByProjetoIdAndFuncionarioId(Long projetoId, Long funcionarioId);

    /**
     * VERIFICAÇÃO DE PODER:
     * Verifica se o funcionário possui um papel específico (ex: LIDER_PROJETO) em um projeto.
     * Este método resolve o erro de compilação no PermissionService.
     */
    boolean existsByProjetoIdAndFuncionarioIdAndPapel(Long projetoId, Long funcionarioId, ProjetoPapel papel);
}