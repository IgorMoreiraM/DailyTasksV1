package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.List;

@Entity(name = "ListaDeTarefas")
@Table(name = "listas_de_tarefas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ListaDeTarefas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    // Relacionamento: Muitas Listas para UMA Equipe
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    @ToString.Exclude
    @OnDelete(action = OnDeleteAction.CASCADE) // Diz ao banco (SQL) para deletar em cascata
    private Equipe equipe;

    // Relacionamento: UMA Lista para MUITAS Tarefas
    // 'mappedBy' diz ao JPA: "A entidade 'Tarefa' gerencia este relacionamento (no campo 'listaDeTarefas')".
    // 'cascade = CascadeType.ALL': Se eu deletar uma Lista, delete todas as Tarefas nela.
    @OneToMany(mappedBy = "listaDeTarefas", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<Tarefa> tarefas = new ArrayList<>();
}