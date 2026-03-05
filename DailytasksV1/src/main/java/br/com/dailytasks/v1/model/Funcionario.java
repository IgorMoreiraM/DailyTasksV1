package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Entidade que representa um Colaborador (Funcionário) no sistema.
 * Implementa {@link UserDetails} para integração nativa com o Spring Security.
 * * @author Equipe Daily Tasks
 * @version 1.1
 */
@Entity(name = "Funcionario")
@Table(name = "funcionarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Funcionario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String nomeCompleto;

    @Column(nullable = false)
    private String password;

    /**
     * Define o perfil de acesso do usuário.
     * Mapeado como STRING no banco de dados para facilitar a leitura via SQL.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /**
     * Relacionamento Muitos-para-Muitos com as Equipes.
     * Utiliza EAGER para carregar as equipes junto com o funcionário durante a autenticação.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "funcionario_equipe",
            joinColumns = @JoinColumn(name = "funcionario_id"),
            inverseJoinColumns = @JoinColumn(name = "equipe_id")
    )
    @ToString.Exclude
    private Set<Equipe> equipes = new HashSet<>();

    /**
     * Converte o atributo 'role' em uma coleção de {@link GrantedAuthority}.
     * O Spring Security utiliza este método para decidir se o usuário pode acessar
     * rotas protegidas por .hasRole() ou .hasAuthority().
     * * @return Coleção de autoridades (permissões) do usuário.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Se a role for ADMIN, concedemos o acesso de ADMIN e o de FUNCIONARIO (hierarquia)
        if (this.role == UserRole.ADMIN) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_FUNCIONARIO")
            );
        }

        // Caso contrário, apenas a permissão padrão de funcionário
        return List.of(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"));
    }

    /* --- Métodos de Implementação UserDetails --- */

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    /**
     * Indica se a conta do usuário expirou.
     * @return true (conta sempre ativa).
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Indica se o usuário está bloqueado ou desbloqueado.
     * @return true (nunca bloqueado via sistema).
     */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /**
     * Indica se as credenciais (senha) expiraram.
     * @return true (não expira).
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Indica se o usuário está habilitado.
     * @return true (sempre habilitado).
     */
    @Override
    public boolean isEnabled() {
        return true;
    }
}