package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.TarefaCreateDTO;
import br.com.dailytasks.v1.dto.TarefaResponseDTO;
import br.com.dailytasks.v1.model.*;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import br.com.dailytasks.v1.repository.ListaTarefasRepository;
import br.com.dailytasks.v1.repository.ProjetoRepository;
import br.com.dailytasks.v1.repository.TarefaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller responsável pela gestão do ciclo de vida das Tarefas.
 * Implementa a regra de negócio: Toda tarefa deve estar obrigatoriamente vinculada a um Projeto.
 * * @author Equipe Daily Tasks
 * @version 2.1
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

    /**
     * Recupera todas as tarefas do sistema (Acesso restrito: ADMIN).
     * @return Lista de DTOs com detalhes da tarefa, incluindo projeto e lista vinculada.
     */
    @GetMapping
    public ResponseEntity<List<TarefaResponseDTO>> listarTodasAsTarefas() {
        List<TarefaResponseDTO> tarefas = tarefaRepository.findAll()
                .stream()
                .map(TarefaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tarefas);
    }

    /**
     * Filtra as tarefas atribuídas especificamente ao funcionário autenticado.
     * @param authentication Objeto contendo os dados do usuário logado.
     * @return Lista de tarefas do colaborador.
     */
    @GetMapping("/minhas-tarefas")
    public ResponseEntity<List<TarefaResponseDTO>> getMinhasTarefas(Authentication authentication) {
        Funcionario funcionarioLogado = (Funcionario) authentication.getPrincipal();
        // Nota: O nome do método no repositório deve ser findByFuncionarioAtribuidoId
        List<Tarefa> minhasTarefas = tarefaRepository.findByFuncionarioAtribuidoId(funcionarioLogado.getId());

        List<TarefaResponseDTO> tarefasDTO = minhasTarefas.stream()
                .map(TarefaResponseDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(tarefasDTO);
    }

    /**
     * Busca detalhes de uma tarefa específica por ID.
     * @param id Identificador da tarefa.
     * @return DTO da tarefa ou 404 caso não exista.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTarefaPorId(@PathVariable Long id) {
        return tarefaRepository.findById(id)
                .map(tarefa -> ResponseEntity.ok(new TarefaResponseDTO(tarefa)))
                .orElse(ResponseEntity.status(404).body(null));
    }

    /**
     * Cria uma nova tarefa vinculada obrigatoriamente a um Projeto.
     * RN: Se o projetoId for inválido ou ausente, a tarefa não será criada.
     * * @param data DTO contendo título, descrição, IDs de projeto, lista e funcionário.
     * @return Tarefa criada ou erro 404 para dependências ausentes.
     */
    @PostMapping
    public ResponseEntity<?> criarTarefa(@RequestBody TarefaCreateDTO data) {
        // 1. Validação obrigatória do Projeto
        Optional<Projeto> projetoOpt = projetoRepository.findById(data.projetoId());
        if (projetoOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Erro: O Projeto informado não existe.");
        }

        // 2. Busca dependências adicionais
        Optional<Funcionario> funcOpt = funcionarioRepository.findById(data.funcionarioId());

        // Correção: A lista agora é opcional e usa o novo nome do campo 'listaTarefa'
        Optional<ListaTarefa> listaOpt = data.listaId() != null
                ? listaRepository.findById(data.listaId())
                : Optional.empty();

        if (funcOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Funcionário não encontrado.");
        }

        Tarefa novaTarefa = new Tarefa();
        novaTarefa.setTitulo(data.titulo());
        novaTarefa.setDescricao(data.descricao());
        novaTarefa.setDataDeVencimento(data.dataDeVencimento());
        novaTarefa.setStatus(TaskStatus.PENDENTE);

        // 3. Atribuição dos vínculos (Sincronizado com os modelos novos)
        novaTarefa.setProjeto(projetoOpt.get());
        novaTarefa.setFuncionarioAtribuido(funcOpt.get());

        // Uso do método corrigido conforme Tarefa.java
        listaOpt.ifPresent(novaTarefa::setListaTarefa);

        Tarefa tarefaSalva = tarefaRepository.save(novaTarefa);
        return ResponseEntity.status(201).body(new TarefaResponseDTO(tarefaSalva));
    }

    /**
     * Atualiza dados da tarefa. Suporta atualização de status por funcionários
     * e atualização administrativa completa.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarTarefa(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(id);
        if (tarefaOpt.isEmpty()) return ResponseEntity.status(404).body("Tarefa não encontrada.");

        Tarefa tarefa = tarefaOpt.get();
        Funcionario usuarioLogado = (Funcionario) authentication.getPrincipal();

        boolean isAdmin = usuarioLogado.getRole() == UserRole.ADMIN;
        boolean isOwner = tarefa.getFuncionarioAtribuido().getId().equals(usuarioLogado.getId());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).body("Sem permissão para alterar esta tarefa.");
        }

        // 1. Atualização de Status
        if (payload.containsKey("status")) {
            try {
                String statusStr = payload.get("status").toString().trim().toUpperCase();
                tarefa.setStatus(TaskStatus.valueOf(statusStr));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Status inválido.");
            }
        }

        // 2. Atualizações Administrativas (Apenas ADMIN)
        if (isAdmin) {
            if (payload.containsKey("titulo")) tarefa.setTitulo(payload.get("titulo").toString());
            if (payload.containsKey("descricao")) tarefa.setDescricao(payload.get("descricao").toString());

            if (payload.containsKey("funcionarioId")) {
                Long funcId = Long.valueOf(payload.get("funcionarioId").toString());
                funcionarioRepository.findById(funcId).ifPresent(tarefa::setFuncionarioAtribuido);
            }

            if (payload.containsKey("projetoId")) {
                Long projId = Long.valueOf(payload.get("projetoId").toString());
                projetoRepository.findById(projId).ifPresent(tarefa::setProjeto);
            }

            // Correção do campo Lista: removendo 'getEquipe' e usando 'setListaTarefa'
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

        Tarefa tarefaSalva = tarefaRepository.save(tarefa);
        return ResponseEntity.ok(new TarefaResponseDTO(tarefaSalva));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarTarefa(@PathVariable Long id) {
        if (!tarefaRepository.existsById(id)) {
            return ResponseEntity.status(404).body("Tarefa não encontrada.");
        }
        tarefaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}