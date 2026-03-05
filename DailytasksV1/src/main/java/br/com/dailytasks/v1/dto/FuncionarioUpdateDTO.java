package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.UserRole;

/**
 * Data Transfer Object (DTO) destinado à atualização de colaboradores.
 * * Este DTO é utilizado no fluxo de edição do Administrador.
 * Note que campos como 'username' e 'password' foram omitidos intencionalmente:
 * 1. O 'username' é a identidade única do usuário no sistema e não deve ser alterado.
 * 2. A senha ('password') deve ter um fluxo de atualização próprio por questões de segurança.
 * * @param nomeCompleto O novo nome do colaborador (opcional).
 * @param role O novo nível de acesso ou cargo do colaborador (opcional).
 * * @author Equipe Daily Tasks
 * @version 1.0
 */
public record FuncionarioUpdateDTO(
        String nomeCompleto,
        UserRole role
) {
    /* * Nota Técnica:
     * O Jackson (biblioteca de JSON do Spring) mapeia automaticamente
     * Strings recebidas do Frontend para o Enum 'UserRole'.
     */
}