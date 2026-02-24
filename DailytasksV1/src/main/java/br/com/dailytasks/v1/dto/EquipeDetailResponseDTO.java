package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Equipe;

import java.util.Set;
import java.util.stream.Collectors;

// DTO "completo" para a resposta de GET /equipes/{id}
public record EquipeDetailResponseDTO(
        Long id,
        String nome,
        String descricao,
        Set<FuncionarioMinimalResponseDTO> membros // Lista de membros
) {
    public EquipeDetailResponseDTO(Equipe equipe) {
        this(
                equipe.getId(),
                equipe.getNome(),
                equipe.getDescricao(),
                // Converte o Set<Funcionario> para Set<FuncionarioMinimalResponseDTO>
                equipe.getFuncionarios().stream()
                        .map(FuncionarioMinimalResponseDTO::new)
                        .collect(Collectors.toSet())
        );
    }
}