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
 * Entidade central de usuário.
 * Implementa UserDetails para integração total com Spring Security.
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
     * Foto de perfil em Base64.
     */
    @Column(columnDefinition = "TEXT")
    private String foto;

    /**
     * Soft Delete: Usuário desativado não consegue logar (isEnabled).
     */
    @Column(nullable = false)
    private boolean ativo = true;

    /**
     * Flag para forçar troca de senha no primeiro login.
     */
    @Column(nullable = false)
    private boolean senhaTemporaria = true;

    /**
     * Nível de acesso (MASTER, GESTOR, GERENTE, FUNCIONARIO).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /**
     * Vínculo Multi-empresa.
     * Se este campo estiver nulo para um GESTOR, as travas do Controller darão 403.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    /**
     * Equipes às quais o colaborador pertence.
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
     * CONFIGURAÇÃO DE HIERARQUIA DE PERMISSÕES:
     * O Spring Security exige o prefixo "ROLE_" aqui para que o hasRole() funcione.
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

    /* --- Métodos do Contrato UserDetails --- */

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

    /**
     * Se o campo 'ativo' for false, o Spring bloqueia o acesso imediatamente.
     */
    @Override
    public boolean isEnabled() {
        return this.ativo;
    }
}