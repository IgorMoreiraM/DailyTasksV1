package br.com.dailytasks.v1.dto;

// DTO para atualizar nome/descrição da equipe
public record EquipeUpdateDTO(
        String nome,
        String descricao
) {}