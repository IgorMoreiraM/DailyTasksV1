package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.UserRole;

// DTO para atualizar dados de um funcionário (Admin)
// Nota: Não incluímos 'username' (não deve ser mutável) nem 'password'.
public record FuncionarioUpdateDTO(
        String nomeCompleto,
        UserRole role
) {}