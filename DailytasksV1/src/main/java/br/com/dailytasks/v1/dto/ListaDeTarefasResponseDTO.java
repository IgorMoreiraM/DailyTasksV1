package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.ListaDeTarefas;

// DTO de resposta. Mostra o ID da equipe, mas não a equipe inteira (para evitar loops).
public record ListaDeTarefasResponseDTO(
        Long id,
        String nome,
        Long equipeId
) {
    // Construtor auxiliar para facilitar a conversão
    public ListaDeTarefasResponseDTO(ListaDeTarefas lista) {
        this(lista.getId(), lista.getNome(), lista.getEquipe().getId());
    }
}