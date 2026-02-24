package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;

// JpaRepository<TipoDaEntidade, TipoDoID>
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    // O Spring Data JPA entende o nome deste método e cria a query:
    // "SELECT * FROM funcionarios WHERE username = ?"
    UserDetails findByUsername(String username);
}