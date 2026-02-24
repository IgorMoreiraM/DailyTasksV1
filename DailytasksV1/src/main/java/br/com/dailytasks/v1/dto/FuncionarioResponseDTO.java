package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;

public record FuncionarioResponseDTO(
        Long id,
        String username,
        String nomeCompleto,
        UserRole role
) {
    // Construtor auxiliar para converter a Entidade Funcionario em DTO
    public FuncionarioResponseDTO(Funcionario funcionario) {
        this(
                funcionario.getId(),
                funcionario.getUsername(),
                funcionario.getNomeCompleto(),
                funcionario.getRole()
        );
    }
}