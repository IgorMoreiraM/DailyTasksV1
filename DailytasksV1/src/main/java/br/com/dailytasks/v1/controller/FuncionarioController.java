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

/**
 * Controller responsável pela gestão de colaboradores (Funcionários).
 * Fornece endpoints para criação, listagem, atualização e exclusão.
 * * @author Equipe Daily Tasks
 * @version 1.0
 */
@RestController
@RequestMapping("/funcionarios")
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Registra um novo funcionário no sistema.
     * Criptografa a senha utilizando BCrypt antes da persistência.
     * * @param data DTO contendo username, password, nomeCompleto e role.
     * @return ResponseEntity com o DTO do funcionário criado e status 201.
     */
    @PostMapping
    public ResponseEntity<FuncionarioResponseDTO> criarFuncionario(@RequestBody FuncionarioCreateDTO data) {
        // Criptografia da senha por segurança
        String senhaCriptografada = passwordEncoder.encode(data.password());

        Funcionario novoFuncionario = new Funcionario();
        novoFuncionario.setUsername(data.username());
        novoFuncionario.setNomeCompleto(data.nomeCompleto());
        novoFuncionario.setPassword(senhaCriptografada);
        novoFuncionario.setRole(data.role());

        Funcionario funcionarioSalvo = repository.save(novoFuncionario);

        // Retorno seguro (sem expor a senha no JSON)
        return ResponseEntity.status(201).body(new FuncionarioResponseDTO(funcionarioSalvo));
    }

    /**
     * Lista todos os funcionários cadastrados.
     * * @return Lista de DTOs representativos dos funcionários.
     */
    @GetMapping
    public ResponseEntity<List<FuncionarioResponseDTO>> listarFuncionarios() {
        List<Funcionario> funcionarios = repository.findAll();

        List<FuncionarioResponseDTO> funcionariosDTO = funcionarios.stream()
                .map(FuncionarioResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(funcionariosDTO);
    }

    /**
     * Atualiza os dados de um funcionário existente (Nome ou Cargo).
     * * @param id Identificador único do funcionário.
     * @param data DTO com os campos opcionais para atualização.
     * @return FuncionarioResponseDTO atualizado ou 404 caso não encontrado.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarFuncionario(
            @PathVariable Long id,
            @RequestBody FuncionarioUpdateDTO data) {

        return repository.findById(id)
                .map(funcionario -> {
                    // Atualização condicional: apenas campos enviados no JSON
                    if (data.nomeCompleto() != null) funcionario.setNomeCompleto(data.nomeCompleto());
                    if (data.role() != null) funcionario.setRole(data.role());

                    Funcionario atualizado = repository.save(funcionario);
                    return ResponseEntity.ok(new FuncionarioResponseDTO(atualizado));
                })
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * Remove um funcionário do banco de dados.
     * Nota: Operações de exclusão podem falhar se houver tarefas vinculadas (Integridade Referencial).
     * * @param id Identificador único do funcionário.
     * @return Status 204 (No Content) em caso de sucesso ou 404 se não existir.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarFuncionario(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(404).body("Funcionário com ID " + id + " não encontrado.");
        }

        try {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Caso existam tarefas vinculadas sem DELETE CASCADE no banco
            return ResponseEntity.status(409).body("Erro: O funcionário possui tarefas vinculadas e não pode ser excluído.");
        }
    }
}