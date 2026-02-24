package br.com.dailytasks.v1.controller;
import br.com.dailytasks.v1.dto.TarefaCreateDTO;
import br.com.dailytasks.v1.dto.TarefaResponseDTO;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.ListaDeTarefas;
import br.com.dailytasks.v1.model.Tarefa;
import br.com.dailytasks.v1.model.TaskStatus;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import br.com.dailytasks.v1.repository.ListaDeTarefasRepository;
import br.com.dailytasks.v1.repository.TarefaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;
import br.com.dailytasks.v1.dto.TarefaUpdateStatusDTO;
import br.com.dailytasks.v1.model.UserRole;
import br.com.dailytasks.v1.dto.TarefaUpdateDTO;

@RestController
@RequestMapping("/tarefas")
public class TarefaController {

    @Autowired
    private TarefaRepository tarefaRepository;

    @Autowired
    private ListaDeTarefasRepository listaRepository;

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    // Endpoint para criar uma nova Tarefa (Exclusivo Admin)
    @PostMapping
    public ResponseEntity<?> criarTarefa(@RequestBody TarefaCreateDTO data) {

        // 1. Validar se a Lista de Tarefas existe
        Optional<ListaDeTarefas> listaOpt = listaRepository.findById(data.listaId());
        if (listaOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Lista de Tarefas com ID " + data.listaId() + " não encontrada.");
        }

        // 2. Validar se o Funcionário atribuído existe
        Optional<Funcionario> funcOpt = funcionarioRepository.findById(data.funcionarioId());
        if (funcOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Funcionário com ID " + data.funcionarioId() + " não encontrado.");
        }

        // 3. Criar a nova entidade Tarefa
        Tarefa novaTarefa = new Tarefa();
        novaTarefa.setTitulo(data.titulo());
        novaTarefa.setDescricao(data.descricao());
        novaTarefa.setDataDeVencimento(data.dataDeVencimento());
        novaTarefa.setStatus(TaskStatus.PENDENTE); // Toda nova tarefa começa como PENDENTE
        novaTarefa.setListaDeTarefas(listaOpt.get()); // Associa a Lista
        novaTarefa.setFuncionarioAtribuido(funcOpt.get()); // Atribui ao Funcionário

        // 4. Salvar no banco
        Tarefa tarefaSalva = tarefaRepository.save(novaTarefa);

        // 5. Retornar o DTO de Resposta
        return ResponseEntity.status(201).body(new TarefaResponseDTO(tarefaSalva));
    }

    @GetMapping("/minhas-tarefas")
    public ResponseEntity<List<TarefaResponseDTO>> getMinhasTarefas(Authentication authentication) {

        // 1. Pega o usuário (Funcionario) que está logado
        // O Spring Security injeta o 'Authentication' com base no Token JWT
        Funcionario funcionarioLogado = (Funcionario) authentication.getPrincipal();
        Long meuId = funcionarioLogado.getId();

        // 2. Usa o método customizado do repositório que criamos na Fase 13
        List<Tarefa> minhasTarefas = tarefaRepository.findByFuncionarioAtribuidoId(meuId);

        // 3. Converte a lista de Entidades para DTOs
        List<TarefaResponseDTO> tarefasDTO = minhasTarefas.stream()
                .map(TarefaResponseDTO::new) // (tarefa -> new TarefaResponseDTO(tarefa))
                .collect(Collectors.toList());

        return ResponseEntity.ok(tarefasDTO);
    }

    @PatchMapping("/{idTarefa}/status")
    public ResponseEntity<?> atualizarStatusTarefa(
            @PathVariable Long idTarefa,
            @RequestBody TarefaUpdateStatusDTO data,
            Authentication authentication) {

        // 1. Pega o usuário logado
        Funcionario funcionarioLogado = (Funcionario) authentication.getPrincipal();

        // 2. Busca a tarefa que o usuário quer modificar
        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(idTarefa);
        if (tarefaOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Tarefa com ID " + idTarefa + " não encontrada.");
        }
        Tarefa tarefa = tarefaOpt.get();

        // 3. --- LÓGICA DE AUTORIZAÇÃO DE NEGÓCIO ---
        boolean isAdmin = funcionarioLogado.getRole() == UserRole.ADMIN;
        // Verifica se o ID do funcionário logado é o mesmo do "dono" da tarefa
        boolean isOwner = tarefa.getFuncionarioAtribuido().getId().equals(funcionarioLogado.getId());

        // 4. Se o usuário não for Admin E não for o dono da tarefa, bloqueia.
        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).body("Acesso negado: Você só pode atualizar suas próprias tarefas.");
        }

        // 5. Autorização OK! Atualiza o status e salva.
        tarefa.setStatus(data.novoStatus());
        Tarefa tarefaAtualizada = tarefaRepository.save(tarefa);

        return ResponseEntity.ok(new TarefaResponseDTO(tarefaAtualizada));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTarefaPorId(@PathVariable Long id) {
        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(id);

        if (tarefaOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Tarefa com ID " + id + " não encontrada.");
        }

        return ResponseEntity.ok(new TarefaResponseDTO(tarefaOpt.get()));
    }

    /**
     * Endpoint 7: Atualizar uma tarefa (PUT - Atualização completa do Admin)
     * Rota: PUT http://localhost:8080/tarefas/{id}
     * Protegido: Apenas ADMIN
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarTarefa(
            @PathVariable Long id,
            @RequestBody TarefaUpdateDTO data) {

        // 1. Busca a tarefa
        Optional<Tarefa> tarefaOpt = tarefaRepository.findById(id);
        if (tarefaOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Tarefa com ID " + id + " não encontrada.");
        }
        Tarefa tarefa = tarefaOpt.get();

        // 2. Busca o novo funcionário (se o ID foi alterado)
        if (data.funcionarioId() != null && !data.funcionarioId().equals(tarefa.getFuncionarioAtribuido().getId())) {
            Optional<Funcionario> funcOpt = funcionarioRepository.findById(data.funcionarioId());
            if (funcOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Funcionário com ID " + data.funcionarioId() + " não encontrado.");
            }
            tarefa.setFuncionarioAtribuido(funcOpt.get()); // Reatribui a tarefa
        }

        // 3. Atualiza os outros campos
        tarefa.setTitulo(data.titulo());
        tarefa.setDescricao(data.descricao());
        tarefa.setDataDeVencimento(data.dataDeVencimento());
        tarefa.setStatus(data.status());

        // 4. Salva
        Tarefa tarefaSalva = tarefaRepository.save(tarefa);

        return ResponseEntity.ok(new TarefaResponseDTO(tarefaSalva));
    }

    /**
     * Endpoint 8: Deletar uma tarefa (DELETE)
     * Rota: DELETE http://localhost:8080/tarefas/{id}
     * Protegido: Apenas ADMIN
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarTarefa(@PathVariable Long id) {

        if (!tarefaRepository.existsById(id)) {
            return ResponseEntity.status(404).body("Tarefa com ID " + id + " não encontrada.");
        }

        tarefaRepository.deleteById(id);

        return ResponseEntity.noContent().build(); // 204 No Content
    }

    /**
     * Endpoint 9: Listar TODAS as tarefas (GET)
     * Rota: GET http://localhost:8080/tarefas
     * Protegido: Apenas ADMIN
     */
    @GetMapping
    public ResponseEntity<List<TarefaResponseDTO>> listarTodasAsTarefas() {
        List<TarefaResponseDTO> tarefas = tarefaRepository.findAll()
                .stream()
                .map(TarefaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tarefas);
    }

}