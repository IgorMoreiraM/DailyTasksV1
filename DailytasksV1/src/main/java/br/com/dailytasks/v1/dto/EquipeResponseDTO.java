package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Equipe;

public record EquipeResponseDTO(
        Long id,
        String nome,
        String descricao
) {
    public EquipeResponseDTO(Equipe equipe) {
        this(equipe.getId(), equipe.getNome(), equipe.getDescricao());
    }
}