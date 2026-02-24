package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.FuncionarioCreateDTO;
import br.com.dailytasks.v1.dto.FuncionarioResponseDTO;
import br.com.dailytasks.v1.dto.FuncionarioUpdateDTO;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/funcionarios") // Todos endpoints aqui começam com /funcionarios
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Injetamos o BCrypt

    // Endpoint 1: Criar um novo funcionário (POST)
    // Rota: POST http://localhost:8080/funcionarios
    // Esta rota já está protegida para ADMINS no SecurityConfigurations
    @PostMapping
    public ResponseEntity<FuncionarioResponseDTO> criarFuncionario(@RequestBody FuncionarioCreateDTO data) {

        // Regra de negócio: Criptografar a senha antes de salvar
        String senhaCriptografada = passwordEncoder.encode(data.password());

        Funcionario novoFuncionario = new Funcionario();
        novoFuncionario.setUsername(data.username());
        novoFuncionario.setNomeCompleto(data.nomeCompleto());
        novoFuncionario.setPassword(senhaCriptografada);
        novoFuncionario.setRole(data.role());

        Funcionario funcionarioSalvo = repository.save(novoFuncionario);

        // Retorna um DTO de resposta, NUNCA a entidade com a senha
        return ResponseEntity.status(201).body(new FuncionarioResponseDTO(funcionarioSalvo));
    }

    // Endpoint 2: Listar todos os funcionários (GET)
    // Rota: GET http://localhost:8080/funcionarios
    // (Esta rota está protegida por padrão - "anyRequest().authenticated()")
    @GetMapping
    public ResponseEntity<List<FuncionarioResponseDTO>> listarFuncionarios() {
        List<Funcionario> funcionarios = repository.findAll();

        // Converte a lista de Entidades para uma lista de DTOs
        List<FuncionarioResponseDTO> funcionariosDTO = funcionarios.stream()
                .map(FuncionarioResponseDTO::new) // (funcionario -> new FuncionarioResponseDTO(funcionario))
                .collect(Collectors.toList());

        return ResponseEntity.ok(funcionariosDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarFuncionario(
            @PathVariable Long id,
            @RequestBody FuncionarioUpdateDTO data) {

        // 1. Busca o funcionário no banco
        Optional<Funcionario> funcionarioOpt = repository.findById(id);
        if (funcionarioOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Funcionário com ID " + id + " não encontrado.");
        }

        Funcionario funcionario = funcionarioOpt.get();

        // 2. Atualiza os dados (sem mexer na senha)
        if (data.nomeCompleto() != null) {
            funcionario.setNomeCompleto(data.nomeCompleto());
        }
        if (data.role() != null) {
            funcionario.setRole(data.role());
        }

        // 3. Salva o funcionário atualizado
        Funcionario funcionarioSalvo = repository.save(funcionario);

        // 4. Retorna o DTO de resposta
        return ResponseEntity.ok(new FuncionarioResponseDTO(funcionarioSalvo));
    }

    /**
     * Endpoint 4: Deletar um funcionário (DELETE)
     * Rota: DELETE http://localhost:8080/funcionarios/{id}
     * Protegido: Apenas ADMIN
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarFuncionario(@PathVariable Long id) {

        // 1. Verifica se o funcionário existe antes de deletar
        if (!repository.existsById(id)) {
            return ResponseEntity.status(404).body("Funcionário com ID " + id + " não encontrado.");
        }

        // 2. Deleta o funcionário
        // CUIDADO: Se o funcionário for dono de tarefas, isso pode quebrar
        // (Vamos tratar disso na Fase 22, ao atualizar Tarefa)
        repository.deleteById(id);

        // 3. Retorna 204 No Content (sucesso, sem corpo)
        return ResponseEntity.noContent().build();
    }
}