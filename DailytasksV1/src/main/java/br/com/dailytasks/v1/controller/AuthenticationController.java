package br.com.dailytasks.v1.controller;

import br.com.dailytasks.v1.dto.AuthenticationDTO;
import br.com.dailytasks.v1.dto.LoginResponseDTO;
import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login") // Este controller responde na rota /login
public class AuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager; // Injeta o gerenciador de autenticação

    @Autowired
    private TokenService tokenService; // Injeta nosso serviço de token

    @PostMapping
    public ResponseEntity login(@RequestBody AuthenticationDTO data) {
        try {
            // 1. Cria um token de autenticação com username e password
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.username(), data.password());

            // 2. O Spring Security (usando o AuthenticationManager) vai:
            //    a. Chamar nosso FuncionarioRepository.findByUsername()
            //    b. Chamar nosso PasswordEncoder.matches() para comparar as senhas
            var auth = this.authenticationManager.authenticate(usernamePassword);

            // 3. Se a autenticação foi bem-sucedida (não deu exceção):
            //    Pegamos o usuário (Funcionario) que foi autenticado
            var funcionario = (Funcionario) auth.getPrincipal();

            // 4. Geramos o token JWT para este usuário
            var token = tokenService.generateToken(funcionario);

            // 5. Retornamos o token em um DTO de resposta
            return ResponseEntity.ok(new LoginResponseDTO(token));

        } catch (Exception e) {
            // 5b. Se a autenticação falhar (usuário ou senha errados), retorna 403 Forbidden
            return ResponseEntity.status(403).body("Login falhou: " + e.getMessage());
        }
    }
}