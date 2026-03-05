package br.com.dailytasks.v1.model;

/**
 * Enumeração que define os perfis de acesso do sistema.
 * Estes valores são persistidos como String no banco de dados.
 * * @author Equipe Daily Tasks
 * @version 1.0
 */
public enum UserRole {
    /** Perfil com acesso total à gestão de funcionários e tarefas. */
    ADMIN("admin"),

    /** Perfil de colaborador padrão com acesso às suas próprias tarefas. */
    FUNCIONARIO("funcionario");

    private String role;

    UserRole(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}