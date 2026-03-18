package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.EmpresaCreateDTO;
import br.com.dailytasks.v1.dto.EmpresaResponseDTO;
import br.com.dailytasks.v1.model.Empresa;
import br.com.dailytasks.v1.repository.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller exclusivo para o nível MASTER.
 * Gerencia o cadastro de clientes (Empresas) no ecossistema Daily Tasks.
 * * @author Equipe Daily Tasks
 * @version 1.0
 */
@RestController
@RequestMapping("/empresas")
@PreAuthorize("hasRole('MASTER')") // Blindagem total para o Igor
public class EmpresaController {

    @Autowired
    private EmpresaRepository repository;

    @GetMapping
    public ResponseEntity<List<EmpresaResponseDTO>> listarTodas() {
        var lista = repository.findAll().stream()
                .map(EmpresaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @PostMapping
    public ResponseEntity<EmpresaResponseDTO> cadastrar(@RequestBody EmpresaCreateDTO data) {
        Empresa nova = new Empresa();
        nova.setNome(data.nome());
        nova.setCnpj(data.cnpj());

        repository.save(nova);
        return ResponseEntity.status(201).body(new EmpresaResponseDTO(nova));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpresaResponseDTO> detalhar(@PathVariable Long id) {
        return repository.findById(id)
                .map(e -> ResponseEntity.ok(new EmpresaResponseDTO(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        return repository.findById(id).map(e -> {
            try {
                repository.deleteById(id);
                return ResponseEntity.noContent().build();
            } catch (Exception ex) {
                return ResponseEntity.status(409).body("Erro: Esta empresa possui funcionários ou projetos ativos.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}