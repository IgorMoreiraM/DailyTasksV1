package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.AuthenticationDTO;
import br.com.dailytasks.v1.dto.LoginResponseDTO;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller responsável pela autenticação e emissão de tokens JWT.
 * Ponto de entrada para todos os usuários do Daily Tasks.
 */
@RestController
@RequestMapping("/login")
public class AuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping
    public ResponseEntity login(@RequestBody AuthenticationDTO data) {
        try {
            // 1. Encapsula as credenciais recebidas
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.username(), data.password());

            // 2. O Spring Security valida as credenciais contra o banco de dados
            var auth = this.authenticationManager.authenticate(usernamePassword);

            // 3. Recupera o objeto Funcionario autenticado
            var funcionario = (Funcionario) auth.getPrincipal();

            // 4. Gera o token JWT (que agora já leva a flag 'senhaTemporaria')
            // Importante: Verifique se o método no seu TokenService se chama 'gerarToken'
            var token = tokenService.gerarToken(funcionario);

            // 5. Retorna o token para o Frontend
            return ResponseEntity.ok(new LoginResponseDTO(token));

        } catch (BadCredentialsException e) {
            // Retorno específico para senha ou usuário inválidos
            return ResponseEntity.status(403).body("Usuário ou senha inválidos.");
        } catch (Exception e) {
            // Outros erros inesperados
            return ResponseEntity.status(500).body("Erro interno no servidor de autenticação.");
        }
    }
}