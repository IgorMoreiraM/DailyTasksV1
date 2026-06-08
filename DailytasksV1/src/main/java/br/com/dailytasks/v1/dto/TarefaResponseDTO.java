package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.Tarefa;

public record TarefaResponseDTO(
        Long    id,
        String  titulo,
        String  descricao,
        String  status,
        String  dataDeVencimento,
        Long    projetoId,
        String  nomeProjeto,
        Long    listaId,
        String  nomeLista,
        Long    funcionarioId,
        String  nomeFuncionario,
        String  username
) {
    public TarefaResponseDTO(Tarefa t) {
        this(
                t.getId(),
                t.getTitulo(),
                t.getDescricao(),
                t.getStatus() != null ? t.getStatus().name() : null,
                t.getDataDeVencimento() != null ? t.getDataDeVencimento().toString() : null,
                t.getProjeto() != null ? t.getProjeto().getId()   : null,
                t.getProjeto() != null ? t.getProjeto().getNome() : null,
                t.getListaTarefa() != null ? t.getListaTarefa().getId()   : null,
                t.getListaTarefa() != null ? t.getListaTarefa().getNome() : "Sem lista",
                t.getFuncionarioAtribuido() != null ? t.getFuncionarioAtribuido().getId()          : null,
                t.getFuncionarioAtribuido() != null ? t.getFuncionarioAtribuido().getNomeCompleto() : null,
                t.getFuncionarioAtribuido() != null ? t.getFuncionarioAtribuido().getUsername()     : null
        );
    }
}