package br.com.dailytasks.v1.dto;

import java.time.LocalDate;

public record TarefaCreateDTO(
        String titulo,
        String descricao,
        LocalDate dataDeVencimento,
        Long listaId, // ID da Lista onde a tarefa entrará
        Long funcionarioId // ID do Funcionário que será atribuído
) {}