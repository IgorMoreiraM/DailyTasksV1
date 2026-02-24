package br.com.dailytasks.v1.dto;

// DTO para criar uma nova lista. Precisa do nome da lista e o ID da equipe à qual pertence.
public record ListaDeTarefasCreateDTO(
        String nome,
        Long equipeId
) {}