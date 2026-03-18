package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/**
 * Entidade que representa a unidade de trabalho (Tarefa).
 * Versão 4.0: Implementa isolamento de dados por Empresa (Multi-tenancy).
 * * @author Equipe Daily Tasks
 * @version 4.0
 */
@Entity(name = "Tarefa")
@Table(name = "tarefas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Tarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    /**
     * Data limite para a conclusão da tarefa.
     */
    @Column(name = "data_de_vencimento")
    private LocalDate dataDeVencimento;

    /**
     * Status atual da tarefa (PENDENTE, EM_ANDAMENTO, CONCLUIDA, etc).
     */
    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    /**
     * ISOLAMENTO POR EMPRESA:
     * Vincula a tarefa à empresa proprietária do projeto.
     * Crucial para filtros globais de Dashboard e segurança.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    /**
     * Projeto ao qual esta tarefa pertence.
     * Vínculo obrigatório.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    /**
     * Lista de tarefas específica dentro de um projeto.
     * Vínculo opcional.
     */
    @ManyToOne
    @JoinColumn(name = "lista_id")
    private ListaTarefa listaTarefa;

    /**
     * Funcionário responsável pela execução da tarefa.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "funcionario_id")
    private Funcionario funcionarioAtribuido;
}