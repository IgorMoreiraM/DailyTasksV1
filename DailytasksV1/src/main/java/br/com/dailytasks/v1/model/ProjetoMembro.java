package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entidade de vínculo entre Funcionários e Projetos.
 * Resolve o desafio da hierarquia dinâmica: permite que um usuário seja
 * LIDER em um projeto e apenas COLABORADOR em outro.
 * * @author Equipe Daily Tasks
 * @version 1.0
 */
@Entity
@Table(name = "projeto_membros")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ProjetoMembro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * O Projeto ao qual o vínculo pertence.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    /**
     * O Funcionário/Usuário vinculado.
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "funcionario_id")
    private Funcionario funcionario;

    /**
     * Define o papel específico neste projeto.
     * Isso permite que um 'GERENTE' (Role Global) atue como 'COLABORADOR' aqui.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjetoPapel papel;

    /**
     * Enum interno para definir os papéis dentro do escopo do projeto.
     */
    public enum ProjetoPapel {
        LIDER_PROJETO,  // Pode criar listas e gerenciar tarefas de outros
        COLABORADOR     // Apenas executa as tarefas que lhe são atribuídas
    }
}