package br.com.dailytasks.v1.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "empresas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;

    @Column(unique = true)
    private String cnpj;

    @JsonIgnore
    @OneToMany(mappedBy = "empresa")
    private List<Funcionario> funcionarios;

    @JsonIgnore
    @OneToMany(mappedBy = "empresa")
    private List<Projeto> projetos;
}