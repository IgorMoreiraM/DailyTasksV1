package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/**
 * Entidade que representa a unidade de trabalho (Tarefa).
 * Implementa a regra de negócio de vinculação obrigatória a um Projeto
 * e opcional a uma Lista de Tarefas.
 * * @author Equipe Daily Tasks
 * @version 2.1
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
     * Este campo é essencial para o controle de prazos no Dashboard.
     */
    @Column(name = "data_de_vencimento")
    private LocalDate dataDeVencimento;

    /**
     * Status atual da tarefa (PENDENTE, EM_ANDAMENTO, CONCLUIDA, etc).
     * Mapeado como String para garantir legibilidade no banco de dados.
     */
    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    /**
     * Projeto ao qual esta tarefa pertence.
     * Vínculo obrigatório (optional = false).
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    /**
     * Lista de tarefas específica dentro de um projeto.
     * Vínculo opcional, permitindo que tarefas existam fora de listas.
     */
    @ManyToOne
    @JoinColumn(name = "lista_id")
    private ListaTarefa listaTarefa;

    /**
     * Funcionário responsável pela execução da tarefa.
     * Utilizado para filtrar as "Minhas Tarefas" no Dashboard do funcionário.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "funcionario_id")
    private Funcionario funcionarioAtribuido;
}