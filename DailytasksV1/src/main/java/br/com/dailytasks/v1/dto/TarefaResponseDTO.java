package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Tarefa;
import br.com.dailytasks.v1.model.TaskStatus;
import java.time.LocalDate;

public record TarefaResponseDTO(
        Long id,
        String titulo,
        String descricao,
        TaskStatus status,
        LocalDate dataDeVencimento,
        Long listaId,
        Long funcionarioId,
        String nomeFuncionario // Bônus: mostrar o nome do atribuído
) {
    // Construtor auxiliar para facilitar a conversão
    public TarefaResponseDTO(Tarefa tarefa) {
        this(
                tarefa.getId(),
                tarefa.getTitulo(),
                tarefa.getDescricao(),
                tarefa.getStatus(),
                tarefa.getDataDeVencimento(),
                tarefa.getListaDeTarefas().getId(),
                tarefa.getFuncionarioAtribuido().getId(),
                tarefa.getFuncionarioAtribuido().getNomeCompleto()
        );
    }
}