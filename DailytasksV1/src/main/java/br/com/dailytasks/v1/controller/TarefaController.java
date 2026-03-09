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
 * Controller para gestão do ciclo de vida das Tarefas.
 * Regras de Negócio:
 * - GESTOR/MASTER: Gestão global e criação de colunas (listas).
 * - GERENTE: Cria tarefas apenas em projetos vinculados.
 * - FUNCIONARIO: Altera apenas status de tarefas próprias.
 * * @author Equipe Daily Tasks
 * @version 2.8
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
     * Lista tarefas de um projeto específico.
     */
    @GetMapping("/projeto/{id}")
    public ResponseEntity<List<TarefaResponseDTO>> listarPorProjeto(@PathVariable Long id) {
        List<Tarefa> tarefas = tarefaRepository.findByProjetoId(id);
        return ResponseEntity.ok(tarefas.stream().map(TarefaResponseDTO::new).collect(Collectors.toList()));
    }

    /**
     * Criação de Tarefa com validação de vínculo para Gerentes.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR', 'GERENTE')")
    public ResponseEntity<?> criarTarefa(@RequestBody TarefaCreateDTO data, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        // 1. Validação de Vínculo: Se for Gerente, ele deve estar no projeto
        if (logado.getRole() == UserRole.GERENTE) {
            boolean ehMembro = projetoMembroRepository.existsByProjetoIdAndFuncionarioId(data.projetoId(), logado.getId());
            if (!ehMembro) {
                return ResponseEntity.status(403).body("Erro: Gerentes só podem criar tarefas em projetos aos quais estão vinculados.");
            }
        }

        Optional<Projeto> projetoOpt = projetoRepository.findById(data.projetoId());
        if (projetoOpt.isEmpty()) return ResponseEntity.status(404).body("Projeto não encontrado.");

        Optional<Funcionario> funcOpt = funcionarioRepository.findById(data.funcionarioId());
        if (funcOpt.isEmpty()) return ResponseEntity.status(404).body("Funcionário responsável não encontrado.");

        Tarefa novaTarefa = new Tarefa();
        novaTarefa.setTitulo(data.titulo());
        novaTarefa.setDescricao(data.descricao());
        novaTarefa.setDataDeVencimento(data.dataDeVencimento());
        novaTarefa.setStatus(TaskStatus.PENDENTE);
        novaTarefa.setProjeto(projetoOpt.get());
        novaTarefa.setFuncionarioAtribuido(funcOpt.get());

        if (data.listaId() != null) {
            listaRepository.findById(data.listaId()).ifPresent(novaTarefa::setListaTarefa);
        }

        Tarefa salva = tarefaRepository.save(novaTarefa);
        return ResponseEntity.status(201).body(new TarefaResponseDTO(salva));
    }

    /**
     * Atualização de Tarefa.
     * Gerentes podem editar conteúdo se forem os líderes do projeto.
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

        // Verificação de liderança para Gerentes
        boolean ehLiderNoProjeto = projetoMembroRepository.findByProjetoId(tarefa.getProjeto().getId()).stream()
                .anyMatch(m -> m.getFuncionario().getId().equals(logado.getId()) &&
                        m.getPapel() == ProjetoMembro.ProjetoPapel.LIDER_PROJETO);

        boolean temPoderTotal = logado.getRole() == UserRole.MASTER ||
                logado.getRole() == UserRole.GESTOR ||
                ehLiderNoProjeto;

        boolean isOwner = tarefa.getFuncionarioAtribuido().getId().equals(logado.getId());

        // 1. Permissão de Status
        if (payload.containsKey("status")) {
            if (!temPoderTotal && !isOwner) {
                return ResponseEntity.status(403).body("Sem permissão para alterar o status desta tarefa.");
            }
            tarefa.setStatus(TaskStatus.valueOf(payload.get("status").toString().toUpperCase()));
        }

        // 2. Permissão de Conteúdo (Líderes, Gestores e Master)
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

        // Se for gerente, validar se ele é membro do projeto da tarefa
        if (logado.getRole() == UserRole.GERENTE) {
            boolean ehMembro = projetoMembroRepository.existsByProjetoIdAndFuncionarioId(
                    tarefaOpt.get().getProjeto().getId(), logado.getId());
            if (!ehMembro) return ResponseEntity.status(403).body("Sem permissão.");
        }

        tarefaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}