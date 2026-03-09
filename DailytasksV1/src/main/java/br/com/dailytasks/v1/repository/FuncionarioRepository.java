package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositório para operações de persistência da entidade Funcionario.
 * Utiliza Spring Data JPA para geração automática de queries.
 * * @author Equipe Daily Tasks
 * @version 2.0
 */
@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    /**
     * Busca um funcionário pelo nome de usuário.
     * Retorna um Optional para evitar NullPointerException e facilitar o tratamento no Seeder e Security.
     */
    Optional<Funcionario> findByUsername(String username);

    /**
     * Filtra funcionários com base no seu nível de acesso (Role).
     * Essencial para o MASTER visualizar apenas GESTORES e para GESTORES visualizarem sua equipe.
     * * @param role O papel a ser filtrado (ex: UserRole.GESTOR)
     * @return Lista de funcionários que possuem o papel especificado.
     */
    List<Funcionario> findByRole(UserRole role);
}