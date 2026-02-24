package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.UserRole;

// Usamos @NotNull ou @NotBlank para validação futura
public record FuncionarioCreateDTO(
        String username,
        String nomeCompleto,
        String password,
        UserRole role
) {}