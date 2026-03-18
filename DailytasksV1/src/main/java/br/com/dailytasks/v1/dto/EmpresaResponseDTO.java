package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Empresa;

/**
 * DTO para retorno de dados da Empresa.
 * Utiliza Java Record para garantir imutabilidade e clareza.
 * * @author Equipe Daily Tasks
 * @version 1.0
 */
public record EmpresaResponseDTO(
        Long id,
        String nome,
        String cnpj
) {
    /**
     * Construtor secundário para facilitar a conversão da Entidade para DTO.
     * Permite usar: new EmpresaResponseDTO(empresaEntity)
     * * @param empresa Objeto da entidade JPA Empresa.
     */
    public EmpresaResponseDTO(Empresa empresa) {
        this(
                empresa.getId(),
                empresa.getNome(),
                empresa.getCnpj()
        );
    }
}