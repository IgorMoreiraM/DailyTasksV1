package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.TarefaCreateDTO;
import br.com.dailytasks.v1.dto.TarefaResponseDTO;
import br.com.dailytasks.v1.model.*;
import br.com.dailytasks.v1.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller definitivo para gestão de Tarefas com Isolamento de Empresa.
 * Garante que colaboradores e gestores operem apenas dentro do seu Tenant.
 * * @author Equipe Daily Tasks
 * @version 4.0
 */
@RestController
@RequestMapping("/tarefas")
public class TarefaController {

    @Autowired
    private TarefaRepository tarefaRepository;

    @Autowired
    private ListaTarefasRepository listaRepository;

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    /**
     * Lista tarefas de um projeto com verificação de segurança por empresa.
     */
    @GetMapping("/projeto/{id}")
    public ResponseEntity<?> listarPorProjeto(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        return projetoRepository.findById(id).map(projeto -> {
            // SEGURANÇA: Verifica se o projeto pertence à empresa do usuário
            if (logado.getRole() != UserRole.MASTER &&
                    !projeto.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("Acesso negado aos dados deste projeto.");
            }

            List<Tarefa> tarefas = tarefaRepository.findByProjetoId(id);
            return ResponseEntity.ok(tarefas.stream().map(TarefaResponseDTO::new).collect(Collectors.toList()));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Criação de Tarefa vinculada automaticamente à Empresa do criador.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR', 'GERENTE')")
    public ResponseEntity<?> criarTarefa(@RequestBody TarefaCreateDTO data, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        // 1. Validação de Vínculo para Gerentes
        if (logado.getRole() == UserRole.GERENTE) {
            boolean ehMembro = projetoMembroRepository.existsByProjetoIdAndFuncionarioId(data.projetoId(), logado.getId());
            if (!ehMembro) {
                return ResponseEntity.status(403).body("Erro: Gerentes só podem criar tarefas em projetos aos quais estão vinculados.");
            }
        }

        Optional<Projeto> projetoOpt = projetoRepository.findById(data.projetoId());
        if (projetoOpt.isEmpty()) return ResponseEntity.status(404).body("Projeto não encontrado.");

        Projeto projeto = projetoOpt.get();

        // 2. Segurança: O projeto deve ser da mesma empresa que o usuário logado
        if (logado.getRole() != UserRole.MASTER && !projeto.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
            return ResponseEntity.status(403).body("Erro: Você não pode criar tarefas em projetos de outra empresa.");
        }

        Optional<Funcionario> funcOpt = funcionarioRepository.findById(data.funcionarioId());
        if (funcOpt.isEmpty()) return ResponseEntity.status(404).body("Funcionário responsável não encontrado.");

        Tarefa novaTarefa = new Tarefa();
        novaTarefa.setTitulo(data.titulo());
        novaTarefa.setDescricao(data.descricao());
        novaTarefa.setDataDeVencimento(data.dataDeVencimento());
        novaTarefa.setStatus(TaskStatus.PENDENTE);
        novaTarefa.setProjeto(projeto);
        novaTarefa.setFuncionarioAtribuido(funcOpt.get());

        // VÍNCULO OBRIGATÓRIO: Define a empresa da tarefa
        novaTarefa.setEmpresa(logado.getEmpresa());

        if (data.listaId() != null) {
            listaRepository.findById(data.listaId()).ifPresent(novaTarefa::setListaTarefa);
        }

        Tarefa salva = tarefaRepository.save(novaTarefa);
        return ResponseEntity.status(201).body(new TarefaResponseDTO(salva));
    }

    /**
     * Atualização de Tarefa com proteção Multi-tenancy.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarTarefa(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication auth) {

        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(id);
        if (tarefaOpt.isEmpty()) return ResponseEntity.status(404).body("Tarefa não encontrada.");

        Tarefa tarefa = tarefaOpt.get();
        Funcionario logado = (Funcionario) auth.getPrincipal();

        // SEGURANÇA: A tarefa deve ser da mesma empresa
        if (logado.getRole() != UserRole.MASTER &&
                (tarefa.getEmpresa() == null || !tarefa.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
            return ResponseEntity.status(403).body("Acesso negado: Esta tarefa pertence a outra organização.");
        }

        // Verificação de liderança para Gerentes
        boolean ehLiderNoProjeto = projetoMembroRepository.findByProjetoId(tarefa.getProjeto().getId()).stream()
                .anyMatch(m -> m.getFuncionario().getId().equals(logado.getId()) &&
                        m.getPapel() == ProjetoMembro.ProjetoPapel.LIDER_PROJETO);

        boolean temPoderTotal = logado.getRole() == UserRole.MASTER ||
                logado.getRole() == UserRole.GESTOR ||
                ehLiderNoProjeto;

        boolean isOwner = tarefa.getFuncionarioAtribuido().getId().equals(logado.getId());

        // Permissão de Status
        if (payload.containsKey("status")) {
            if (!temPoderTotal && !isOwner) {
                return ResponseEntity.status(403).body("Sem permissão para alterar o status desta tarefa.");
            }
            tarefa.setStatus(TaskStatus.valueOf(payload.get("status").toString().toUpperCase()));
        }

        // Permissão de Conteúdo
        if (temPoderTotal) {
            if (payload.containsKey("titulo")) tarefa.setTitulo(payload.get("titulo").toString());
            if (payload.containsKey("descricao")) tarefa.setDescricao(payload.get("descricao").toString());

            if (payload.containsKey("funcionarioId")) {
                Long funcId = Long.valueOf(payload.get("funcionarioId").toString());
                funcionarioRepository.findById(funcId).ifPresent(tarefa::setFuncionarioAtribuido);
            }

            if (payload.containsKey("listaId")) {
                Object listaIdObj = payload.get("listaId");
                if (listaIdObj == null) {
                    tarefa.setListaTarefa(null);
                } else {
                    Long listaId = Long.valueOf(listaIdObj.toString());
                    listaRepository.findById(listaId).ifPresent(tarefa::setListaTarefa);
                }
            }
        }

        return ResponseEntity.ok(new TarefaResponseDTO(tarefaRepository.save(tarefa)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR', 'GERENTE')")
    public ResponseEntity<?> deletarTarefa(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();
        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(id);

        if (tarefaOpt.isEmpty()) return ResponseEntity.notFound().build();
        Tarefa tarefa = tarefaOpt.get();

        // SEGURANÇA: Isolamento de empresa
        if (logado.getRole() != UserRole.MASTER &&
                (tarefa.getEmpresa() == null || !tarefa.getEmpresa().getId().equals(logado.getEmpresa().getId()))) {
            return ResponseEntity.status(403).body("Operação não permitida.");
        }

        // Se for gerente, validar vínculo no projeto
        if (logado.getRole() == UserRole.GERENTE) {
            boolean ehMembro = projetoMembroRepository.existsByProjetoIdAndFuncionarioId(
                    tarefa.getProjeto().getId(), logado.getId());
            if (!ehMembro) return ResponseEntity.status(403).body("Sem permissão.");
        }

        tarefaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}