package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Interface de repositório para a entidade Projeto.
 * Versão 4.0: Implementa isolamento de dados por Empresa (Multi-tenancy).
 * * @author Equipe Daily Tasks
 * @version 4.0
 */
@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Long> {

    /**
     * MÉTODO DE ISOLAMENTO (Multi-tenancy):
     * Busca todos os projetos vinculados a uma empresa específica.
     * Garante que o Gestor da Empresa A nunca veja os projetos da Empresa B.
     * * O Spring Data JPA converte este nome em:
     * "SELECT * FROM projetos WHERE empresa_id = ?"
     * * @param empresaId ID da empresa para filtragem.
     * @return Lista de projetos exclusivos daquela empresa.
     */
    List<Projeto> findByEmpresaId(Long empresaId);
}