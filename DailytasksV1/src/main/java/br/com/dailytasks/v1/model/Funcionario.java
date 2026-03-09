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
 * Entidade que representa um Colaborador no sistema Daily Tasks.
 * Suporta hierarquia MASTER, GESTOR e GERENTE e controle de primeiro acesso.
 * * @author Equipe Daily Tasks
 * @version 3.0
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
     * Define se o usuário ainda utiliza a senha gerada pelo Gestor.
     * Se true, o Frontend deve obrigar a troca no primeiro acesso.
     */
    @Column(nullable = false)
    private boolean senhaTemporaria = true;

    /**
     * Define o nível de acesso global do usuário.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /**
     * Relacionamento com as Equipes.
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
     * Mapeia o UserRole para as permissões do Spring Security.
     * A hierarquia garante que um MASTER tenha todos os privilégios dos cargos inferiores.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == UserRole.MASTER) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_MASTER"),
                    new SimpleGrantedAuthority("ROLE_GESTOR"),
                    new SimpleGrantedAuthority("ROLE_GERENTE"),
                    new SimpleGrantedAuthority("ROLE_FUNCIONARIO")
            );
        }

        if (this.role == UserRole.GESTOR) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_GESTOR"),
                    new SimpleGrantedAuthority("ROLE_GERENTE"),
                    new SimpleGrantedAuthority("ROLE_FUNCIONARIO")
            );
        }

        if (this.role == UserRole.GERENTE) {
            return List.of(
                    new SimpleGrantedAuthority("ROLE_GERENTE"),
                    new SimpleGrantedAuthority("ROLE_FUNCIONARIO")
            );
        }

        return List.of(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"));
    }

    /* --- Implementação UserDetails (Padrão) --- */

    @Override
    public String getPassword() { return this.password; }

    @Override
    public String getUsername() { return this.username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}