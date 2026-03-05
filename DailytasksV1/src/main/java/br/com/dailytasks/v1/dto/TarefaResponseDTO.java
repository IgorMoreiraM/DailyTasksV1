package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Tarefa;
import br.com.dailytasks.v1.model.TaskStatus;
import java.time.LocalDate;

/**
 * Data Transfer Object (DTO) para representação detalhada de uma Tarefa.
 * Consolida informações do Projeto (obrigatório), Lista (opcional) e Responsável.
 * * @author Equipe Daily Tasks
 * @version 2.1
 */
public record TarefaResponseDTO(
        Long id,
        String titulo,
        String descricao,
        TaskStatus status,
        LocalDate dataDeVencimento,

        // Dados do Projeto (Obrigatório na nova hierarquia)
        Long projetoId,
        String nomeProjeto,

        // Dados da Lista (Opcional)
        Long listaId,
        String nomeLista,

        // Dados do Responsável (Funcionário Atribuído)
        Long funcionarioId,
        String nomeFuncionario
) {
    /**
     * Construtor auxiliar para conversão da Entidade Tarefa para DTO.
     * Ajustado para referenciar 'getListaTarefa()' conforme definido no Model.
     * * @param tarefa Objeto de entidade vindo do banco de dados.
     */
    public TarefaResponseDTO(Tarefa tarefa) {
        this(
                tarefa.getId(),
                tarefa.getTitulo(),
                tarefa.getDescricao(),
                tarefa.getStatus(),
                tarefa.getDataDeVencimento(),

                // Mapeamento do Projeto
                tarefa.getProjeto().getId(),
                tarefa.getProjeto().getNome(),

                // Mapeamento da Lista (Atenção ao nome do método: getListaTarefa)
                tarefa.getListaTarefa() != null ? tarefa.getListaTarefa().getId() : null,
                tarefa.getListaTarefa() != null ? tarefa.getListaTarefa().getNome() : "Sem lista",

                // Mapeamento do Funcionário Atribuído
                tarefa.getFuncionarioAtribuido().getId(),
                tarefa.getFuncionarioAtribuido().getNomeCompleto()
        );
    }
}