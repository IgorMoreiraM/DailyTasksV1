package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.FuncionarioCreateDTO;
import br.com.dailytasks.v1.dto.FuncionarioResponseDTO;
import br.com.dailytasks.v1.dto.FuncionarioUpdateDTO;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import br.com.dailytasks.v1.repository.EmpresaRepository;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller de Gestão de Usuários com Multi-tenancy.
 * Versão 5.0: Suporte a Soft Delete, Fotos de Perfil e Isolamento de Dados.
 */
@RestController
@RequestMapping("/funcionarios")
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * CRIAÇÃO DE USUÁRIOS:
     * MASTER: Cria Gestores vinculados a empresas específicas.
     * GESTOR: Cria sua equipe vinculada automaticamente à sua empresa.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> criarFuncionario(@RequestBody FuncionarioCreateDTO data, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        if (repository.findByUsername(data.username()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Erro: Este nome de usuário já está em uso.");
        }

        if (logado.getRole() == UserRole.GESTOR &&
                (data.role() == UserRole.MASTER || data.role() == UserRole.GESTOR)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Erro: Você não tem permissão para criar usuários deste nível.");
        }

        Funcionario novo = new Funcionario();
        novo.setUsername(data.username());
        novo.setNomeCompleto(data.nomeCompleto());
        novo.setPassword(passwordEncoder.encode(data.password()));
        novo.setRole(data.role());
        novo.setSenhaTemporaria(true);
        novo.setAtivo(true); // Todo novo usuário nasce ativo

        if (logado.getRole() == UserRole.MASTER) {
            if (data.empresaId() == null) {
                return ResponseEntity.badRequest().body("Erro: O MASTER deve informar o ID da empresa.");
            }
            var empresa = empresaRepository.findById(data.empresaId());
            if (empresa.isEmpty()) return ResponseEntity.status(404).body("Empresa destino não encontrada.");
            novo.setEmpresa(empresa.get());
        } else {
            if (logado.getEmpresa() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro: Seu usuário não possui empresa vinculada.");
            }
            novo.setEmpresa(logado.getEmpresa());
        }

        Funcionario salvo = repository.save(novo);
        return ResponseEntity.status(HttpStatus.CREATED).body(new FuncionarioResponseDTO(salvo));
    }

    /**
     * LISTAGEM COM ISOLAMENTO:
     * Retorna todos os usuários (ativos e inativos) para fins de gestão.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<List<FuncionarioResponseDTO>> listarTodos(Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        List<Funcionario> lista;

        if (logado.getRole() == UserRole.MASTER) {
            lista = repository.findAll();
        } else {
            if (logado.getEmpresa() == null) return ResponseEntity.ok(List.of());

            Long empresaId = logado.getEmpresa().getId();
            lista = repository.findByEmpresaId(empresaId).stream()
                    .filter(f -> f.getRole() != UserRole.MASTER)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(convertToDTO(lista));
    }

    /**
     * UPLOAD DE FOTO DE PERFIL:
     * Salva a string Base64 da imagem no banco de dados.
     */
    @PatchMapping("/{id}/upload-foto")
    public ResponseEntity<?> uploadFoto(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        String base64Image = payload.get("foto");

        return repository.findById(id).map(target -> {
            if (!logado.getId().equals(id) && logado.getRole() == UserRole.FUNCIONARIO) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            target.setFoto(base64Image);
            repository.save(target);
            return ResponseEntity.ok("Foto de perfil atualizada com sucesso!");
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * SOFT DELETE (DESATIVAÇÃO):
     * Em vez de apagar, mudamos o status para inativo.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> desativarFuncionario(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(target -> {
            if (logado.getRole() == UserRole.GESTOR &&
                    (target.getEmpresa() == null || !target.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            target.setAtivo(false); // Desativa o login
            repository.save(target);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * REATIVAÇÃO DE USUÁRIO:
     * Permite que um Gestor restaure o acesso de um colaborador inativo.
     */
    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> ativarFuncionario(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(target -> {
            if (logado.getRole() == UserRole.GESTOR &&
                    (target.getEmpresa() == null || !target.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            target.setAtivo(true);
            repository.save(target);
            return ResponseEntity.ok("Usuário reativado com sucesso.");
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * RESET DE SENHA:
     * Padrão temporário: 'tasks123'
     */
    @PatchMapping("/{id}/reset-senha")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> resetarSenha(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(target -> {
            if (logado.getRole() == UserRole.GESTOR) {
                if (target.getEmpresa() == null || !target.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
                }
            }

            target.setPassword(passwordEncoder.encode("tasks123"));
            target.setSenhaTemporaria(true);
            repository.save(target);
            return ResponseEntity.ok("Senha resetada.");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> atualizarFuncionario(@PathVariable Long id, @RequestBody FuncionarioUpdateDTO data, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(target -> {
            if (logado.getRole() == UserRole.GESTOR &&
                    (target.getEmpresa() == null || !target.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (data.nomeCompleto() != null) target.setNomeCompleto(data.nomeCompleto());
            if (data.role() != null) target.setRole(data.role());

            return ResponseEntity.ok(new FuncionarioResponseDTO(repository.save(target)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/alterar-senha")
    public ResponseEntity<?> alterarSenha(@RequestBody Map<String, String> payload, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        String novaSenha = payload.get("novaSenha");

        if (novaSenha == null || novaSenha.trim().length() < 6) {
            return ResponseEntity.badRequest().body("A senha deve ter no mínimo 6 caracteres.");
        }

        logado.setPassword(passwordEncoder.encode(novaSenha));
        logado.setSenhaTemporaria(false);
        repository.save(logado);

        return ResponseEntity.ok("Senha atualizada!");
    }

    private List<FuncionarioResponseDTO> convertToDTO(List<Funcionario> funcionarios) {
        return funcionarios.stream().map(FuncionarioResponseDTO::new).collect(Collectors.toList());
    }
}