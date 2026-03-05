package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;

@Entity(name = "ListaTarefa")
@Table(name = "listas_tarefas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ListaTarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    /**
     * Vínculo hierárquico com o Projeto.
     * Substitui a antiga associação direta com Equipe.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;
}