package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.ArrayList;

/**
 * Entidade que representa um Projeto dentro do sistema Daily Tasks.
 * Versão 4.0: Implementa isolamento de dados por Empresa (Multi-tenancy).
 * * @author Equipe Daily Tasks
 * @version 4.0
 */
@Entity(name = "Projeto")
@Table(name = "projetos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    /**
     * ISOLAMENTO POR EMPRESA:
     * Garante que o projeto pertença a um "Tenant" específico.
     * Fundamental para a segurança e isolamento entre clientes.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    /**
     * Um projeto pode conter várias listas de tarefas.
     * CascadeType.ALL garante que ao excluir um projeto, suas listas sumam também.
     */
    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<ListaTarefa> listas = new ArrayList<>();

    /**
     * Relacionamento direto com tarefas.
     */
    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<Tarefa> tarefas = new ArrayList<>();
}