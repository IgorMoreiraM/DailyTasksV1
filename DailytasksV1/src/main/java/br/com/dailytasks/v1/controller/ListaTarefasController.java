package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.model.ListaTarefa;
import br.com.dailytasks.v1.model.Projeto;
import br.com.dailytasks.v1.repository.ListaTarefasRepository;
import br.com.dailytasks.v1.repository.ProjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller para gestão de Listas de Tarefas.
 * Atualizado para a nova hierarquia: Lista -> Projeto.
 * * @author Equipe Daily Tasks
 */
@RestController
@RequestMapping("/listas")
public class ListaTarefasController {

    @Autowired
    private ListaTarefasRepository repository;

    @Autowired
    private ProjetoRepository projetoRepository;

    /**
     * Cria uma nova lista vinculada a um Projeto.
     * O erro "cannot find symbol setEquipe" foi resolvido alterando a associação para Projeto.
     */
    @PostMapping
    public ResponseEntity<?> criarLista(@RequestBody Map<String, Object> payload) {
        String nome = payload.get("nome").toString();
        Long projetoId = Long.valueOf(payload.get("projetoId").toString());

        Optional<Projeto> projetoOpt = projetoRepository.findById(projetoId);
        if (projetoOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Projeto não encontrado. A lista precisa de um projeto pai.");
        }

        ListaTarefa novaLista = new ListaTarefa();
        novaLista.setNome(nome);

        // CORREÇÃO AQUI: Trocamos setEquipe por setProjeto
        novaLista.setProjeto(projetoOpt.get());

        ListaTarefa salva = repository.save(novaLista);
        return ResponseEntity.status(201).body(salva);
    }

    @GetMapping
    public ResponseEntity<List<ListaTarefa>> listarTodas() {
        return ResponseEntity.ok(repository.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}