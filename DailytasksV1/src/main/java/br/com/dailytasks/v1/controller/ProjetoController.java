package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.model.Projeto;
import br.com.dailytasks.v1.model.ProjetoMembro;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import br.com.dailytasks.v1.repository.ProjetoRepository;
import br.com.dailytasks.v1.repository.ProjetoMembroRepository;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import br.com.dailytasks.v1.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {

    @Autowired
    private ProjetoRepository repository;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    /**
     * Listagem com isolamento por empresa.
     * GESTOR     → todos os projetos da empresa
     * GERENTE/FUNCIONARIO → projetos como membro OU com tarefas atribuídas
     */
    @GetMapping
    public ResponseEntity<List<Projeto>> listarProjetos(Authentication authentication) {
        Funcionario logado = (Funcionario) authentication.getPrincipal();

        if (logado.getRole() == UserRole.MASTER) {
            return ResponseEntity.ok(repository.findAll());
        }

        if (logado.getEmpresa() == null) {
            return ResponseEntity.ok(List.of());
        }

        if (logado.getRole() == UserRole.GESTOR) {
            return ResponseEntity.ok(repository.findByEmpresaId(logado.getEmpresa().getId()));
        }

        // GERENTE e FUNCIONARIO
        Long funcId    = logado.getId();
        Long empresaId = logado.getEmpresa().getId();

        // 1. Projetos onde é membro explícito
        List<Projeto> comoMembro = projetoMembroRepository.findByFuncionarioId(funcId)
                .stream()
                .map(ProjetoMembro::getProjeto)
                .filter(p -> p.getEmpresa() != null && p.getEmpresa().getId().equals(empresaId))
                .collect(Collectors.toList());

        // 2. Projetos onde tem tarefas atribuídas
        List<Projeto> comTarefas = repository.findByFuncionarioAtribuidoIdAndEmpresaId(funcId, empresaId);

        // 3. Une sem duplicatas usando Map por ID
        Map<Long, Projeto> projetosMap = new HashMap<>();
        comoMembro.forEach(p -> projetosMap.put(p.getId(), p));
        comTarefas.forEach(p -> projetosMap.put(p.getId(), p));

        return ResponseEntity.ok(List.copyOf(projetosMap.values()));
    }

    /**
     * Busca por ID com trava de segurança por empresa.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(projeto -> {
            if (logado.getRole() != UserRole.MASTER &&
                    (projeto.getEmpresa() == null ||
                            !projeto.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }
            return ResponseEntity.ok(projeto);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Projeto não encontrado."));
    }

    /**
     * Criação de projeto — resposta limpa em Map para evitar referência circular.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> criarProjeto(@RequestBody Map<String, Object> payload, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        try {
            Projeto projeto = new Projeto();
            projeto.setNome(payload.get("nome").toString());
            projeto.setDescricao(payload.get("descricao") != null ? payload.get("descricao").toString() : "");

            if (logado.getRole() == UserRole.MASTER) {
                if (!payload.containsKey("empresaId")) {
                    return ResponseEntity.badRequest().body("Erro: Master deve informar o empresaId.");
                }
                Long empresaId = Long.valueOf(payload.get("empresaId").toString());
                projeto.setEmpresa(empresaRepository.findById(empresaId)
                        .orElseThrow(() -> new RuntimeException("Empresa não encontrada.")));
            } else {
                if (logado.getEmpresa() == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Gestor sem empresa vinculada.");
                }
                projeto.setEmpresa(logado.getEmpresa());
            }

            Projeto salvo = repository.save(projeto);

            Map<String, Object> response = new HashMap<>();
            response.put("id",       salvo.getId());
            response.put("nome",     salvo.getNome());
            response.put("descricao",salvo.getDescricao());
            if (salvo.getEmpresa() != null) {
                response.put("empresaId", salvo.getEmpresa().getId());
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro: " + e.getMessage());
        }
    }

    /**
     * Atualização de projeto.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> atualizarProjeto(
            @PathVariable Long id,
            @RequestBody Projeto dados,
            Authentication auth) {

        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(p -> {
            if (logado.getRole() != UserRole.MASTER &&
                    !p.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }
            p.setNome(dados.getNome());
            p.setDescricao(dados.getDescricao());
            Projeto salvo = repository.save(p);

            Map<String, Object> response = new HashMap<>();
            response.put("id",        salvo.getId());
            response.put("nome",      salvo.getNome());
            response.put("descricao", salvo.getDescricao());

            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Projeto não encontrado."));
    }

    /**
     * Exclusão de projeto.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> excluirProjeto(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(p -> {
            if (logado.getRole() != UserRole.MASTER &&
                    (p.getEmpresa() == null ||
                            !p.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Projeto não encontrado."));
    }

    /**
     * Adiciona membro ao projeto.
     */
    @PostMapping("/{id}/membros")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR')")
    public ResponseEntity<?> adicionarMembro(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication auth) {

        Funcionario logado = (Funcionario) auth.getPrincipal();

        return repository.findById(id).map(projeto -> {
            if (logado.getRole() != UserRole.MASTER &&
                    !projeto.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }

            Long   funcId   = Long.valueOf(payload.get("funcionarioId").toString());
            String papelStr = payload.get("papel").toString();

            return funcionarioRepository.findById(funcId).map(func -> {
                if (logado.getRole() != UserRole.MASTER &&
                        !func.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Funcionário de outra empresa.");
                }

                ProjetoMembro vinculo = new ProjetoMembro();
                vinculo.setProjeto(projeto);
                vinculo.setFuncionario(func);
                vinculo.setPapel(ProjetoMembro.ProjetoPapel.valueOf(papelStr));

                projetoMembroRepository.save(vinculo);
                return ResponseEntity.status(HttpStatus.CREATED).body("Membro adicionado.");
            }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Funcionário não encontrado."));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Projeto não encontrado."));
    }

    /**
     * Lista membros de um projeto.
     */
    @GetMapping("/{id}/membros")
    public ResponseEntity<List<ProjetoMembro>> listarMembros(@PathVariable Long id) {
        return ResponseEntity.ok(projetoMembroRepository.findByProjetoId(id));
    }
}