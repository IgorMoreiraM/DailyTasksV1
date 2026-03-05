package br.com.dailytasks.v1.dto;

import java.time.LocalDate;

/**
 * Data Transfer Object (DTO) para a criação de novas tarefas.
 * Define os campos necessários que o Administrador deve enviar via Frontend.
 * * RN01: O vínculo com um Projeto é obrigatório.
 * RN02: O vínculo com uma Lista é opcional, permitindo flexibilidade na organização.
 * * @param titulo Nome resumido da atividade.
 * @param descricao Detalhamento técnico ou instruções da tarefa.
 * @param dataDeVencimento Prazo limite para conclusão (LocalDate).
 * @param listaId Identificador da lista vinculada (pode ser nulo).
 * @param projetoId Identificador do projeto pai (obrigatório).
 * @param funcionarioId Identificador do colaborador responsável pela execução.
 * * @author Equipe Daily Tasks
 * @version 2.0
 */
public record TarefaCreateDTO(
        String titulo,
        String descricao,
        LocalDate dataDeVencimento,
        Long listaId,
        Long projetoId,
        Long funcionarioId
) {
    /**
     * Nota: O uso de 'record' garante que este objeto seja imutável e
     * simplifica a desserialização do JSON enviado pelo Axios.
     */
}