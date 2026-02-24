package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Funcionario;

// DTO "leve" apenas para listar membros de uma equipe
public record FuncionarioMinimalResponseDTO(
        Long id,
        String nomeCompleto
) {
    public FuncionarioMinimalResponseDTO(Funcionario funcionario) {
        this(funcionario.getId(), funcionario.getNomeCompleto());
    }
}