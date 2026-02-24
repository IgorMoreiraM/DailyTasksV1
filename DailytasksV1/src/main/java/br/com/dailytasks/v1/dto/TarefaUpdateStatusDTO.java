package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.TaskStatus;

// DTO simples para receber o novo status da tarefa
public record TarefaUpdateStatusDTO(
        TaskStatus novoStatus
) {}