package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.AtribuirLiderDTO;
import br.com.dailytasks.v1.model.ProjetoMembro;
import br.com.dailytasks.v1.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/projeto-membros")
public class ProjetoMembroController {

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;
    @Autowired
    private ProjetoRepository projetoRepository;
    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @PostMapping("/atribuir-lider")
    public ResponseEntity<?> atribuirLider(@RequestBody AtribuirLiderDTO data) {
        var projeto = projetoRepository.findById(data.projetoId())
                .orElseThrow(() -> new RuntimeException("Projeto não encontrado"));
        var funcionario = funcionarioRepository.findById(data.funcionarioId())
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        // Cria o vínculo de liderança
        ProjetoMembro vinculo = new ProjetoMembro();
        vinculo.setProjeto(projeto);
        vinculo.setFuncionario(funcionario);
        vinculo.setPapel(ProjetoMembro.ProjetoPapel.LIDER_PROJETO);

        projetoMembroRepository.save(vinculo);
        return ResponseEntity.ok("Liderança atribuída com sucesso!");
    }
}