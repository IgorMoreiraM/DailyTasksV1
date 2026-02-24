package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.ListaDeTarefasCreateDTO;
import br.com.dailytasks.v1.dto.ListaDeTarefasResponseDTO;
import br.com.dailytasks.v1.model.Equipe;
import br.com.dailytasks.v1.model.ListaDeTarefas;
import br.com.dailytasks.v1.repository.EquipeRepository;
import br.com.dailytasks.v1.repository.ListaDeTarefasRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.dailytasks.v1.dto.ListaDeTarefasDetailResponseDTO;
import br.com.dailytasks.v1.dto.ListaDeTarefasUpdateDTO;
import java.util.List;
import java.util.stream.Collectors;

import java.util.Optional;

@RestController
@RequestMapping("/listas-tarefas")
public class ListaDeTarefasController {

    @Autowired
    private ListaDeTarefasRepository listaRepository;

    @Autowired
    private EquipeRepository equipeRepository;

    // Endpoint para criar uma nova Lista de Tarefas (Exclusivo Admin)
    @PostMapping
    public ResponseEntity<?> criarLista(@RequestBody ListaDeTarefasCreateDTO data) {
        // 1. Busca a Equipe pelo ID fornecido no DTO
        Optional<Equipe> equipeOpt = equipeRepository.findById(data.equipeId());
        if (equipeOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Equipe com ID " + data.equipeId() + " não encontrada.");
        }

        // 2. Cria a nova entidade ListaDeTarefas
        ListaDeTarefas novaLista = new ListaDeTarefas();
        novaLista.setNome(data.nome());
        novaLista.setEquipe(equipeOpt.get()); // Associa a equipe encontrada

        // 3. Salva no banco
        ListaDeTarefas listaSalva = listaRepository.save(novaLista);

        // 4. Retorna um DTO de resposta
        return ResponseEntity.status(201).body(new ListaDeTarefasResponseDTO(listaSalva));
    }

    @GetMapping
    public ResponseEntity<List<ListaDeTarefasResponseDTO>> listarListas() {
        List<ListaDeTarefasResponseDTO> listas = listaRepository.findAll()
                .stream()
                .map(ListaDeTarefasResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listas);
    }

    /**
     * Endpoint 3: Buscar detalhes de UMA lista (GET por ID)
     * Rota: GET http://localhost:8080/listas-tarefas/{id}
     * Protegido: Qualquer usuário AUTENTICADO (Funcionário)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getListaPorId(@PathVariable Long id) {
        Optional<ListaDeTarefas> listaOpt = listaRepository.findById(id);

        if (listaOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Lista de Tarefas com ID " + id + " não encontrada.");
        }

        // Converte a entidade para o DTO detalhado (com tarefas)
        ListaDeTarefasDetailResponseDTO listaDTO = new ListaDeTarefasDetailResponseDTO(listaOpt.get());
        return ResponseEntity.ok(listaDTO);
    }

    /**
     * Endpoint 4: Atualizar uma lista (PUT)
     * Rota: PUT http://localhost:8080/listas-tarefas/{id}
     * Protegido: Apenas ADMIN
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarLista(
            @PathVariable Long id,
            @RequestBody ListaDeTarefasUpdateDTO data) {

        Optional<ListaDeTarefas> listaOpt = listaRepository.findById(id);
        if (listaOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Lista de Tarefas com ID " + id + " não encontrada.");
        }

        ListaDeTarefas lista = listaOpt.get();
        lista.setNome(data.nome()); // Atualiza o nome

        ListaDeTarefas listaSalva = listaRepository.save(lista);

        return ResponseEntity.ok(new ListaDeTarefasResponseDTO(listaSalva));
    }

    /**
     * Endpoint 5: Deletar uma lista (DELETE)
     * Rota: DELETE http://localhost:8080/listas-tarefas/{id}
     * Protegido: Apenas ADMIN
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarLista(@PathVariable Long id) {

        if (!listaRepository.existsById(id)) {
            return ResponseEntity.status(404).body("Lista de Tarefas com ID " + id + " não encontrada.");
        }

        // Graças ao 'cascade = CascadeType.ALL' na entidade ListaDeTarefas (no campo 'tarefas'),
        // ao deletar a lista, o JPA também deletará todas as tarefas associadas.
        listaRepository.deleteById(id);

        return ResponseEntity.noContent().build(); // 204 No Content
    }
}