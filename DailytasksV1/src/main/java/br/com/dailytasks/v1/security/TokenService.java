package br.com.dailytasks.v1.security;

import br.com.dailytasks.v1.model.Funcionario;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class TokenService {

    // Vamos injetar uma "palavra-secreta" do application.properties
    // Isso é melhor do que deixar a senha "chumbada" no código
    @Value("${api.security.token.secret}")
    private String secret;

    private static final String ISSUER = "DailyTasks-API"; // O emissor do token

    // Método para GERAR um token JWT
    public String generateToken(Funcionario funcionario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            // 2. Transforma as "Authorities" (ex: ROLE_ADMIN) numa lista de Strings
            List<String> roles = funcionario.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            String token = JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(funcionario.getUsername())
                    .withExpiresAt(getExpirationDate())
                    // 3. Adiciona a lista de roles ao token como uma "claim" (campo)
                    .withClaim("authorities", roles)
                    .sign(algorithm);
            return token;

        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token JWT", exception);
        }
    }

    // Método para VALIDAR um token JWT
    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);

            return JWT.require(algorithm)
                    .withIssuer(ISSUER) // Verifica se o emissor bate
                    .build()
                    .verify(token) // Verifica a assinatura e a validade
                    .getSubject(); // Retorna o "dono" (username) do token se for válido

        } catch (JWTVerificationException exception) {
            // Retorna vazio se o token for inválido (expirado, assinatura errada, etc)
            return "";
        }
    }

    // Define o tempo de expiração do token (ex: 2 horas)
    private Instant getExpirationDate() {
        return LocalDateTime.now()
                .plusHours(2)
                .toInstant(ZoneOffset.of("-03:00")); // Ajuste para o seu fuso horário
    }
}