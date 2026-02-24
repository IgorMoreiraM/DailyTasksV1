package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.TaskStatus;
import java.time.LocalDate;

// DTO para o Admin fazer uma atualização COMPLETA de uma tarefa
public record TarefaUpdateDTO(
        String titulo,
        String descricao,
        LocalDate dataDeVencimento,
        TaskStatus status,
        Long funcionarioId // Permite reatribuir a tarefa
) {}