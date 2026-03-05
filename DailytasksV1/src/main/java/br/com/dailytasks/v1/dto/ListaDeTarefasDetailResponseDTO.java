package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.ListaTarefa;

/**
 * Data Transfer Object (DTO) para detalhamento de uma Lista de Tarefas.
 * Atualizado para refletir a nova hierarquia, onde a lista pertence a um Projeto.
 * * @author Equipe Daily Tasks
 * @version 1.1
 */
public record ListaDeTarefasDetailResponseDTO(
        Long id,
        String nome,
        Long projetoId,
        String nomeProjeto
) {
    /**
     * Construtor auxiliar para conversão da Entidade para DTO.
     * Substitui a antiga referência a 'getEquipe()' por 'getProjeto()'.
     * * @param lista Objeto de entidade vindo do banco de dados.
     */
    public ListaDeTarefasDetailResponseDTO(ListaTarefa lista) {
        this(
                lista.getId(),
                lista.getNome(),
                // Mapeamento corrigido: Agora buscamos dados do Projeto pai
                lista.getProjeto().getId(),
                lista.getProjeto().getNome()
        );
    }
}