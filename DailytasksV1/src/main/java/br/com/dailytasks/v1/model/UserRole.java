package br.com.dailytasks.v1.model;

/**
 * Hierarquia de acesso do sistema Daily Tasks.
 */
public enum UserRole {
    MASTER,    // Acesso total, deleta e cria gestores.
    GESTOR,    // Passa demandas para gerentes, visualiza tudo abaixo.
    GERENTE,   // Controla projetos específicos; pode ser executor em outros.
    FUNCIONARIO // Apenas visualiza e executa suas tarefas.
}