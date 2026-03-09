package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.model.ListaTarefa;
import br.com.dailytasks.v1.model.Projeto;
import br.com.dailytasks.v1.repository.ListaTarefasRepository;
import br.com.dailytasks.v1.repository.ProjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller para gestão de Listas de Tarefas (Colunas do Kanban).
 * Regra de Negócio:
 * - MASTER e GESTOR: Criam, editam e excluem listas (colunas).
 * - GERENTE e FUNCIONARIO: Apenas visualizam as listas dentro dos projetos.
 * * @author Equipe Daily Tasks
 * @version 2.7
 */
@RestController
@RequestMapping("/listas")
public class ListaTarefasController {

    @Autowired
    private ListaTarefasRepository repository;

    @Autowired
    private ProjetoRepository projetoRepository;

    /**
     * Cria uma nova coluna (lista) vinculada a um Projeto.
     * Liberado para MASTER e GESTOR.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> criarLista(@RequestBody Map<String, Object> payload) {
        if (!payload.containsKey("nome") || !payload.containsKey("projetoId")) {
            return ResponseEntity.badRequest().body("Campos 'nome' e 'projetoId' são obrigatórios.");
        }

        String nome = payload.get("nome").toString();
        Long projetoId = Long.valueOf(payload.get("projetoId").toString());

        Optional<Projeto> projetoOpt = projetoRepository.findById(projetoId);
        if (projetoOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Erro: O Projeto pai informado não existe.");
        }

        ListaTarefa novaLista = new ListaTarefa();
        novaLista.setNome(nome);
        novaLista.setProjeto(projetoOpt.get()); // Associação correta conforme o modelo

        ListaTarefa salva = repository.save(novaLista);
        return ResponseEntity.status(201).body(salva);
    }

    /**
     * Lista todas as colunas de todos os projetos (Visão Administrativa).
     */
    @GetMapping
    public ResponseEntity<List<ListaTarefa>> listarTodas() {
        return ResponseEntity.ok(repository.findAll());
    }

    /**
     * Retorna as listas de um projeto específico.
     * Útil para o frontend montar o Kanban dinamicamente.
     */
    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<ListaTarefa>> listarPorProjeto(@PathVariable Long projetoId) {
        // Nota: O nome do método no repository deve ser findByProjetoId
        return ResponseEntity.ok(repository.findByProjetoId(projetoId));
    }

    /**
     * Atualiza o nome de uma coluna.
     * Restrito a MASTER e GESTOR.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return repository.findById(id)
                .map(lista -> {
                    if (payload.containsKey("nome")) lista.setNome(payload.get("nome"));
                    return ResponseEntity.ok(repository.save(lista));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Exclui uma coluna do Kanban.
     * Restrito a MASTER e GESTOR.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();

        try {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Caso a lista possua tarefas vinculadas (dependendo da sua regra de Cascade)
            return ResponseEntity.status(409).build();
        }
    }
}