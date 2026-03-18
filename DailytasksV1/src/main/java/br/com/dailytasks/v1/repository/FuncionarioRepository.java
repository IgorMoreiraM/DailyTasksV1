package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositório para operações de persistência da entidade Funcionario.
 * Versão 4.0: Suporta isolamento de dados por Empresa (Multi-tenancy).
 * * @author Equipe Daily Tasks
 * @version 4.0
 */
@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    /**
     * Busca um funcionário pelo nome de usuário.
     * Utilizado pelo Spring Security e pelo filtro de autenticação.
     */
    Optional<Funcionario> findByUsername(String username);

    /**
     * Filtra funcionários com base no seu nível de acesso (Role).
     * Útil para o MASTER listar todos os GESTORES do sistema.
     */
    List<Funcionario> findByRole(UserRole role);

    /**
     * MÉTODO DE ISOLAMENTO (Multi-tenancy):
     * Filtra a equipe completa de uma empresa específica.
     * O Spring Data JPA entende o nome do método e gera o SQL:
     * "SELECT * FROM funcionarios WHERE empresa_id = ?"
     * * @param empresaId ID da empresa do Gestor logado.
     * @return Lista de funcionários que pertencem apenas a esta empresa.
     */
    List<Funcionario> findByEmpresaId(Long empresaId);
}