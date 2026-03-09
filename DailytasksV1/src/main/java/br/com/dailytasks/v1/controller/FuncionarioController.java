package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.FuncionarioCreateDTO;
import br.com.dailytasks.v1.dto.FuncionarioResponseDTO;
import br.com.dailytasks.v1.dto.FuncionarioUpdateDTO;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller definitivo para gestão de usuários e segurança.
 * Implementa hierarquia de cargos e fluxo de recuperação de acesso.
 * * @author Equipe Daily Tasks
 * @version 3.5
 */
@RestController
@RequestMapping("/funcionarios")
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * RESET DE SENHA (Funcionalidade "Esqueci minha senha")
     * Realizado por um superior. Define senha padrão e reativa trava de troca.
     */
    @PatchMapping("/{id}/reset-senha")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> resetarSenha(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(target -> {
            // SEGURANÇA: Gestor não mexe na senha do Master (você)
            if (logado.getRole() == UserRole.GESTOR && target.getRole() == UserRole.MASTER) {
                return ResponseEntity.status(403).body("Erro: Você não tem permissão para resetar a senha de um MASTER.");
            }

            // Define a senha provisória e ativa a flag de troca obrigatória
            target.setPassword(passwordEncoder.encode("tasks123"));
            target.setSenhaTemporaria(true);

            repository.save(target);

            return ResponseEntity.ok("Senha resetada para 'tasks123'. O usuário deverá trocá-la ao logar.");
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * AUTOGESTÃO: Troca de senha no primeiro acesso ou via perfil.
     */
    @PatchMapping("/alterar-senha")
    public ResponseEntity<?> alterarSenha(@RequestBody Map<String, String> payload, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        String novaSenha = payload.get("novaSenha");

        if (novaSenha == null || novaSenha.trim().length() < 6) {
            return ResponseEntity.badRequest().body("Erro: A nova senha deve ter no mínimo 6 caracteres.");
        }

        logado.setPassword(passwordEncoder.encode(novaSenha));
        logado.setSenhaTemporaria(false); // Libera o acesso definitivo

        repository.save(logado);

        return ResponseEntity.ok().body("Senha atualizada com sucesso! O acesso está liberado.");
    }

    /**
     * LISTAGEM DE GESTORES (Clientes) - Apenas para o MASTER.
     */
    @GetMapping("/gestores")
    @PreAuthorize("hasRole('MASTER')")
    public ResponseEntity<List<FuncionarioResponseDTO>> listarGestores() {
        List<Funcionario> gestores = repository.findByRole(UserRole.GESTOR);
        return ResponseEntity.ok(convertToDTO(gestores));
    }

    /**
     * CRIAÇÃO DE NOVOS MEMBROS.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> criarFuncionario(@RequestBody FuncionarioCreateDTO data, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        UserRole targetRole = data.role();

        if (logado.getRole() == UserRole.GESTOR &&
                (targetRole == UserRole.MASTER || targetRole == UserRole.GESTOR)) {
            return ResponseEntity.status(403).body("Erro: Você não pode criar usuários de nível GESTOR ou superior.");
        }

        Funcionario novo = new Funcionario();
        novo.setUsername(data.username());
        novo.setNomeCompleto(data.nomeCompleto());
        novo.setPassword(passwordEncoder.encode(data.password()));
        novo.setRole(targetRole);
        novo.setSenhaTemporaria(true); // Nasce com trava de primeiro acesso

        Funcionario salvo = repository.save(novo);
        return ResponseEntity.status(201).body(new FuncionarioResponseDTO(salvo));
    }

    /**
     * LISTAGEM GERAL COM FILTRO DE VISIBILIDADE.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<List<FuncionarioResponseDTO>> listarTodos(Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        List<Funcionario> lista;

        if (logado.getRole() == UserRole.MASTER) {
            lista = repository.findAll();
        } else {
            lista = repository.findAll().stream()
                    .filter(f -> f.getRole() != UserRole.MASTER)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(convertToDTO(lista));
    }

    /**
     * ATUALIZAÇÃO DE DADOS.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> atualizarFuncionario(
            @PathVariable Long id,
            @RequestBody FuncionarioUpdateDTO data,
            Authentication auth) {

        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id)
                .map(target -> {
                    if (logado.getRole() == UserRole.GESTOR &&
                            (data.role() == UserRole.MASTER || data.role() == UserRole.GESTOR)) {
                        return ResponseEntity.status(403).body("Erro: Não é permitido promover usuários a níveis superiores ao seu.");
                    }

                    if (data.nomeCompleto() != null) target.setNomeCompleto(data.nomeCompleto());
                    if (data.role() != null) target.setRole(data.role());

                    Funcionario atualizado = repository.save(target);
                    return ResponseEntity.ok(new FuncionarioResponseDTO(atualizado));
                })
                .orElse(ResponseEntity.status(404).build());
    }

    /**
     * EXCLUSÃO DE COLABORADOR.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> deletarFuncionario(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(target -> {
            if (logado.getRole() == UserRole.GESTOR && target.getRole() == UserRole.MASTER) {
                return ResponseEntity.status(403).body("Erro: Operação negada.");
            }

            try {
                repository.deleteById(id);
                return ResponseEntity.noContent().build();
            } catch (Exception e) {
                return ResponseEntity.status(409).body("Erro: Usuário possui dependências no sistema.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    private List<FuncionarioResponseDTO> convertToDTO(List<Funcionario> funcionarios) {
        return funcionarios.stream()
                .map(FuncionarioResponseDTO::new)
                .collect(Collectors.toList());
    }
}