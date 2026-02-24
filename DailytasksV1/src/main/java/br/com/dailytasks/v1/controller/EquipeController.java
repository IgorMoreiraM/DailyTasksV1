package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.AssociacaoFuncionarioDTO;
import br.com.dailytasks.v1.dto.EquipeCreateDTO;
import br.com.dailytasks.v1.dto.EquipeResponseDTO;
import br.com.dailytasks.v1.dto.EquipeDetailResponseDTO;
import br.com.dailytasks.v1.dto.EquipeUpdateDTO;
import br.com.dailytasks.v1.dto.FuncionarioMinimalResponseDTO;
import br.com.dailytasks.v1.model.Equipe;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.repository.EquipeRepository;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller para gerenciar o CRUD de Equipes e suas associações.
 */
@RestController
@RequestMapping("/equipes") // O prefixo da URL para todos os métodos neste controller
public class EquipeController {

    @Autowired
    private EquipeRepository equipeRepository;

    @Autowired
    private FuncionarioRepository funcionarioRepository; // Necessário para a associação

    /**
     * Endpoint 1: Criar uma nova equipe (POST)
     * Rota: POST http://localhost:8080/equipes
     * Protegido: Apenas ADMIN
     */
    @PostMapping
    public ResponseEntity<EquipeResponseDTO> criarEquipe(@RequestBody EquipeCreateDTO data) {
        Equipe novaEquipe = new Equipe();
        novaEquipe.setNome(data.nome());
        novaEquipe.setDescricao(data.descricao());

        Equipe equipeSalva = equipeRepository.save(novaEquipe);

        // Retorna o DTO de resposta e o status 201 (Created)
        return ResponseEntity.status(201).body(new EquipeResponseDTO(equipeSalva));
    }

    /**
     * Endpoint 2: Listar todas as equipes (GET)
     * Rota: GET http://localhost:8080/equipes
     * Protegido: Qualquer usuário AUTENTICADO
     */
    @GetMapping
    public ResponseEntity<List<EquipeResponseDTO>> listarEquipes() {
        List<EquipeResponseDTO> equipes = equipeRepository.findAll()
                .stream()
                .map(EquipeResponseDTO::new) // Converte cada Equipe para EquipeResponseDTO
                .collect(Collectors.toList());

        return ResponseEntity.ok(equipes);
    }

    /**
     * Endpoint 3: Associar um funcionário a uma equipe (POST)
     * Rota: POST http://localhost:8080/equipes/{idEquipe}/associar-funcionario
     * Ex: POST http://localhost:8080/equipes/1/associar-funcionario
     * Protegido: Apenas ADMIN
     */
    @PostMapping("/{idEquipe}/associar-funcionario")
    public ResponseEntity<?> associarFuncionario(
            @PathVariable Long idEquipe, // Pega o 'idEquipe' da URL
            @RequestBody AssociacaoFuncionarioDTO data) { // Pega o 'funcionarioId' do JSON

        // 1. Busca a equipe no banco
        Optional<Equipe> equipeOpt = equipeRepository.findById(idEquipe);
        if (equipeOpt.isEmpty()) {
            // Retorna 404 Not Found se a equipe não existe
            return ResponseEntity.status(404).body("Equipe com ID " + idEquipe + " não encontrada.");
        }
        Equipe equipe = equipeOpt.get();

        // 2. Busca o funcionário no banco
        Optional<Funcionario> funcionarioOpt = funcionarioRepository.findById(data.funcionarioId());
        if (funcionarioOpt.isEmpty()) {
            // Retorna 404 Not Found se o funcionário não existe
            return ResponseEntity.status(404).body("Funcionário com ID " + data.funcionarioId() + " não encontrado.");
        }
        Funcionario funcionario = funcionarioOpt.get();

        // 3. Adiciona o funcionário à lista da equipe
        // E adiciona a equipe à lista do funcionário (necessário para o @ManyToMany)
        equipe.getFuncionarios().add(funcionario);
        funcionario.getEquipes().add(equipe);

        // 4. Salva o lado "owner" (dono) do relacionamento (@JoinTable)
        funcionarioRepository.save(funcionario);

        // Retorna 200 OK (sem corpo)
        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint 4: Buscar detalhes de UMA equipe (GET por ID)
     * Rota: GET http://localhost:8080/equipes/{id}
     * Protegido: Qualquer usuário AUTENTICADO (Funcionário)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getEquipePorId(@PathVariable Long id) {
        Optional<Equipe> equipeOpt = equipeRepository.findById(id);

        if (equipeOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Equipe com ID " + id + " não encontrada.");
        }

        // Converte a entidade Equipe para o DTO detalhado
        EquipeDetailResponseDTO equipeDTO = new EquipeDetailResponseDTO(equipeOpt.get());
        return ResponseEntity.ok(equipeDTO);
    }

    /**
     * Endpoint 5: Atualizar uma equipe (PUT)
     * Rota: PUT http://localhost:8080/equipes/{id}
     * Protegido: Apenas ADMIN
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarEquipe(
            @PathVariable Long id,
            @RequestBody EquipeUpdateDTO data) {

        Optional<Equipe> equipeOpt = equipeRepository.findById(id);
        if (equipeOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Equipe com ID " + id + " não encontrada.");
        }

        Equipe equipe = equipeOpt.get();

        // Atualiza os campos se eles foram fornecidos
        if (data.nome() != null) {
            equipe.setNome(data.nome());
        }
        if (data.descricao() != null) {
            equipe.setDescricao(data.descricao());
        }

        Equipe equipeSalva = equipeRepository.save(equipe);

        // Retorna o DTO de resposta simples (não o detalhado)
        return ResponseEntity.ok(new EquipeResponseDTO(equipeSalva));
    }

    /**
     * Endpoint 6: Deletar uma equipe (DELETE)
     * Rota: DELETE http://localhost:8080/equipes/{id}
     * Protegido: Apenas ADMIN
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarEquipe(@PathVariable Long id) {

        if (!equipeRepository.existsById(id)) {
            return ResponseEntity.status(404).body("Equipe com ID " + id + " não encontrada.");
        }

        // NOTA: Se esta equipe estiver associada a Listas de Tarefas,
        // o banco de dados dará erro de chave estrangeira.
        // Precisamos definir o que acontece com as listas (ex: deletar em cascata).

        equipeRepository.deleteById(id);

        return ResponseEntity.noContent().build(); // 204 No Content
    }
}