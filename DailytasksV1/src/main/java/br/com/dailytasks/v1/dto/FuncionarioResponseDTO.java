package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;

public record FuncionarioResponseDTO(
        Long    id,
        String  username,
        String  nomeCompleto,
        UserRole role,
        String  foto,
        boolean ativo,
        boolean senhaTemporaria,
        Long    empresaId,
        String  empresaNome
) {
    public FuncionarioResponseDTO(Funcionario f) {
        this(
                f.getId(),
                f.getUsername(),
                f.getNomeCompleto(),
                f.getRole(),
                f.getFoto(),
                f.isAtivo(),
                f.isSenhaTemporaria(),
                f.getEmpresa() != null ? f.getEmpresa().getId()   : null,
                f.getEmpresa() != null ? f.getEmpresa().getNome() : null
        );
    }
}