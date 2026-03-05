package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.ListaTarefa;

/**
 * Data Transfer Object (DTO) para listagem simplificada de categorias.
 * Agora vinculado à entidade Projeto.
 * * @author Equipe Daily Tasks
 * @version 1.1
 */
public record ListaDeTarefasResponseDTO(
        Long id,
        String nome,
        String nomeProjeto
) {
    /**
     * Construtor auxiliar para conversão rápida de Entidade para DTO.
     * Atualizado: removeu-se a referência ao getEquipe().
     * * @param lista Objeto vindo do banco de dados.
     */
    public ListaDeTarefasResponseDTO(ListaTarefa lista) {
        this(
                lista.getId(),
                lista.getNome(),
                // Ajuste crítico: agora buscamos o nome através do Projeto
                lista.getProjeto() != null ? lista.getProjeto().getNome() : "Sem Projeto"
        );
    }
}