package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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

    @Column(columnDefinition = "TEXT") // Substitua @Lob por isto
    private String descricao;

    @Enumerated(EnumType.STRING) // Salva o nome do Enum (ex: "PENDENTE")
    @Column(nullable = false)
    private TaskStatus status;

    private LocalDate dataDeVencimento;

    // Relacionamento: Muitas Tarefas para UMA Lista
    // 'FetchType.LAZY' significa que só carrega a lista quando o método .getListaDeTarefas() for chamado.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lista_id", nullable = false) // Chave estrangeira
    @ToString.Exclude // Evita recursão infinita
    private ListaDeTarefas listaDeTarefas;

    // Relacionamento: Muitas Tarefas para UM Funcionário (o "atribuído")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = true) // Chave estrangeira
    @ToString.Exclude // Evita recursão infinita
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Funcionario funcionarioAtribuido;
}