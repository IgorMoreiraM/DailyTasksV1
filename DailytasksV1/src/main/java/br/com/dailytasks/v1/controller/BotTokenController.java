package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.model.BotToken;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.repository.BotTokenRepository;
import br.com.dailytasks.v1.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/bot")
public class BotTokenController {

    @Autowired
    private BotTokenRepository botTokenRepository;

    @Autowired
    private TokenService tokenService;

    @Transactional
    @PostMapping("/gerar-token")
    public ResponseEntity<?> gerarToken(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Não autenticado.");
        }

        try {
            Funcionario logado = (Funcionario) auth.getPrincipal();
            System.out.println(">>> [BotToken] Gerando token para: " + logado.getUsername());

            // Remove tokens anteriores do usuário
            botTokenRepository.deleteByFuncionarioId(logado.getId());

            // Gera código de 6 dígitos
            String codigo = String.format("%06d", new Random().nextInt(1000000));

            BotToken botToken = new BotToken();
            botToken.setToken(codigo);
            botToken.setFuncionario(logado);
            botToken.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
            botToken.setUsado(false);

            botTokenRepository.save(botToken);

            System.out.println(">>> [BotToken] Token gerado: " + codigo);

            return ResponseEntity.ok(Map.of(
                    "token",     codigo,
                    "expiresIn", "10 minutos"
            ));

        } catch (Exception e) {
            System.err.println(">>> [BotToken] Erro: " + e.getMessage());
            return ResponseEntity.status(500).body("Erro interno: " + e.getMessage());
        }
    }

    @Transactional
    @PostMapping("/validar-token")
    public ResponseEntity<?> validarToken(@RequestBody Map<String, String> payload) {
        String codigo = payload.get("token");

        if (codigo == null || codigo.isBlank()) {
            return ResponseEntity.badRequest().body("Token não informado.");
        }

        System.out.println(">>> [BotToken] Validando token: " + codigo);

        var tokenOpt = botTokenRepository.findByToken(codigo);

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Token inválido.");
        }

        BotToken botToken = tokenOpt.get();

        if (botToken.isUsado()) {
            return ResponseEntity.status(401).body("Token já utilizado.");
        }

        if (Instant.now().isAfter(botToken.getExpiresAt())) {
            botTokenRepository.delete(botToken);
            return ResponseEntity.status(401).body("Token expirado.");
        }

        botToken.setUsado(true);
        botTokenRepository.save(botToken);

        Funcionario funcionario = botToken.getFuncionario();
        String jwt = tokenService.gerarToken(funcionario);

        System.out.println(">>> [BotToken] Token validado para: " + funcionario.getUsername());

        return ResponseEntity.ok(Map.of(
                "token",        jwt,
                "username",     funcionario.getUsername(),
                "nomeCompleto", funcionario.getNomeCompleto(),
                "role",         funcionario.getRole().toString()
        ));
    }
}