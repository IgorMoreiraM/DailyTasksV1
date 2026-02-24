package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
// Imports específicos do Lombok (substituindo @Data)
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
// Imports do Spring Security
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity(name = "Funcionario")
@Table(name = "funcionarios")
// --- Substituímos @Data por anotações específicas ---
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id") // Define que equals/hashCode usam APENAS o ID
// ----------------------------------------------------
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    // --- Relacionamento ManyToMany com Equipe ---
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "funcionario_equipe",
            joinColumns = @JoinColumn(name = "funcionario_id"),
            inverseJoinColumns = @JoinColumn(name = "equipe_id")
    )
    @ToString.Exclude // <-- Importante: Exclui este campo do toString()
    private Set<Equipe> equipes = new HashSet<>();

    // --- Métodos obrigatórios do UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Define as "Permissões" (Roles) do usuário
        if (this.role == UserRole.ADMIN) {
            // Um ADMIN tem ambas as permissões
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_FUNCIONARIO"));
        } else {
            // Um FUNCIONARIO tem apenas a sua
            return List.of(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"));
        }
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}