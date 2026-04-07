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

@RestController
@RequestMapping("/tarefas")
public class TarefaController {

    @Autowired private TarefaRepository tarefaRepository;
    @Autowired private ListaTarefasRepository listaRepository;
    @Autowired private FuncionarioRepository funcionarioRepository;
    @Autowired private ProjetoRepository projetoRepository;
    @Autowired private ProjetoMembroRepository projetoMembroRepository;

    @GetMapping("/projeto/{id}")
    public ResponseEntity<?> listarPorProjeto(@PathVariable Long id, Authentication auth) {
        Funcionario logado = (Funcionario) auth.getPrincipal();

        Optional<Projeto> projetoOpt = projetoRepository.findById(id);
        if (projetoOpt.isEmpty()) return ResponseEntity.notFound().build();

        Projeto projeto = projetoOpt.get();

        // MASTER acessa tudo, outros verificam empresa via repositório
        if (logado.getRole() != UserRole.MASTER) {
            if (logado.getEmpresa() == null) {
                return ResponseEntity.status(403).body("Usuário sem empresa vinculada.");
            }
            // Busca o projeto com empresa carregada diretamente pelo repositório
            boolean mesmaEmpresa = projetoRepository.existsByIdAndEmpresaId(id, logado.getEmpresa().getId());
            if (!mesmaEmpresa) {
                return ResponseEntity.status(403).body("Acesso negado a este projeto.");
            }
        }

        List<Tarefa> tarefas = tarefaRepository.findByProjetoId(id);
        return ResponseEntity.ok(tarefas.stream().map(TarefaResponseDTO::new).collect(Collectors.toList()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER', 'GESTOR', 'GERENTE')")
    public ResponseEntity<?> criarTarefa(@RequestBody TarefaCreateDTO data, Authentication auth) {
        System.out.println(">>> CRIAR TAREFA: chegou no controller");
        System.out.println(">>> AUTH: " + (auth != null ? auth.getName() : "NULL"));
        System.out.println(">>> AUTHORITIES: " + (auth != null ? auth.getAuthorities() : "NULL"));
        System.out.println(">>> DATA: " + data);

        Funcionario logado = (Funcionario) auth.getPrincipal();
        System.out.println(">>> EMPRESA DO LOGADO: " + (logado.getEmpresa() != null ? logado.getEmpresa().getId() : "NULL"));

        Optional<Projeto> projetoOpt = projetoRepository.findById(data.projetoId());
        if (projetoOpt.isEmpty()) return ResponseEntity.status(404).body("Projeto não encontrado.");
        Projeto projeto = projetoOpt.get();

        // Verificação de empresa via repositório (não depende de lazy loading)
        if (logado.getRole() != UserRole.MASTER) {
            if (logado.getEmpresa() == null) {
                return ResponseEntity.status(403).body("Usuário sem empresa vinculada.");
            }
            boolean mesmaEmpresa = projetoRepository.existsByIdAndEmpresaId(
                    data.projetoId(), logado.getEmpresa().getId()
            );
            if (!mesmaEmpresa) {
                return ResponseEntity.status(403).body("Projeto pertence a outra empresa.");
            }
        }

        // Gerente precisa ser membro do projeto
        if (logado.getRole() == UserRole.GERENTE) {
            boolean ehMembro = projetoMembroRepository.existsByProjetoIdAndFuncionarioId(
                    data.projetoId(), logado.getId()
            );
            if (!ehMembro) {
                return ResponseEntity.status(403).body("Gerente não é membro deste projeto.");
            }
        }

        Optional<Funcionario> funcOpt = funcionarioRepository.findById(data.funcionarioId());
        if (funcOpt.isEmpty()) return ResponseEntity.status(404).body("Funcionário não encontrado.");

        Tarefa novaTarefa = new Tarefa();
        novaTarefa.setTitulo(data.titulo());
        novaTarefa.setDescricao(data.descricao());
        novaTarefa.setDataDeVencimento(data.dataDeVencimento());
        novaTarefa.setStatus(TaskStatus.PENDENTE);
        novaTarefa.setProjeto(projeto);
        novaTarefa.setFuncionarioAtribuido(funcOpt.get());
        novaTarefa.setEmpresa(logado.getEmpresa());

        if (data.listaId() != null) {
            listaRepository.findById(data.listaId()).ifPresent(novaTarefa::setListaTarefa);
        }

        Tarefa salva = tarefaRepository.save(novaTarefa);
        return ResponseEntity.status(201).body(new TarefaResponseDTO(salva));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarTarefa(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication auth) {

        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(id);
        if (tarefaOpt.isEmpty()) return ResponseEntity.status(404).body("Tarefa não encontrada.");

        Tarefa tarefa = tarefaOpt.get();
        Funcionario logado = (Funcionario) auth.getPrincipal();

        // Verifica empresa via repositório
        if (logado.getRole() != UserRole.MASTER) {
            if (logado.getEmpresa() == null ||
                    tarefa.getEmpresa() == null ||
                    !tarefa.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("Acesso negado.");
            }
        }

        boolean ehLider = projetoMembroRepository
                .findByProjetoId(tarefa.getProjeto().getId()).stream()
                .anyMatch(m -> m.getFuncionario().getId().equals(logado.getId())
                        && m.getPapel() == ProjetoMembro.ProjetoPapel.LIDER_PROJETO);

        boolean temPoderTotal = logado.getRole() == UserRole.MASTER
                || logado.getRole() == UserRole.GESTOR
                || ehLider;

        boolean isOwner = tarefa.getFuncionarioAtribuido().getId().equals(logado.getId());

        if (payload.containsKey("status")) {
            if (!temPoderTotal && !isOwner) {
                return ResponseEntity.status(403).body("Sem permissão para alterar status.");
            }
            tarefa.setStatus(TaskStatus.valueOf(payload.get("status").toString().toUpperCase()));
        }

        if (temPoderTotal) {
            if (payload.containsKey("titulo"))
                tarefa.setTitulo(payload.get("titulo").toString());
            if (payload.containsKey("descricao"))
                tarefa.setDescricao(payload.get("descricao").toString());
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

        if (logado.getRole() != UserRole.MASTER) {
            if (logado.getEmpresa() == null ||
                    tarefa.getEmpresa() == null ||
                    !tarefa.getEmpresa().getId().equals(logado.getEmpresa().getId())) {
                return ResponseEntity.status(403).body("Operação não permitida.");
            }
        }

        if (logado.getRole() == UserRole.GERENTE) {
            boolean ehMembro = projetoMembroRepository.existsByProjetoIdAndFuncionarioId(
                    tarefa.getProjeto().getId(), logado.getId()
            );
            if (!ehMembro) return ResponseEntity.status(403).body("Sem permissão.");
        }

        tarefaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
};