package br.com.dailytasks.v1.dto;

import br.com.dailytasks.v1.model.ListaDeTarefas;

import java.util.List;
import java.util.stream.Collectors;

// DTO para GET /listas-tarefas/{id} (mostra as tarefas)
public record ListaDeTarefasDetailResponseDTO(
        Long id,
        String nome,
        Long equipeId,
        List<TarefaResponseDTO> tarefas // Lista de tarefas
) {
    public ListaDeTarefasDetailResponseDTO(ListaDeTarefas lista) {
        this(
                lista.getId(),
                lista.getNome(),
                lista.getEquipe().getId(),
                // Converte a List<Tarefa> para List<TarefaResponseDTO>
                lista.getTarefas().stream()
                        .map(TarefaResponseDTO::new)
                        .collect(Collectors.toList())
        );
    }
}