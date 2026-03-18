package br.com.dailytasks.v1.security;

import br.com.dailytasks.v1.model.Funcionario;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.stream.Collectors;

/**
 * Serviço de Token JWT com suporte a Multi-tenancy e Claims personalizados.
 * Versão 5.5: Inclui Roles e Empresa no Payload do Token.
 */
@Service
public class TokenService {

    @Value("${api.security.token.secret}")
    private String secret;

    // Constante para evitar erros de digitação entre geração e validação
    private static final String ISSUER = "daily-tasks-api";

    /**
     * Gera o token JWT com claims personalizados.
     * Importante: O Frontend pode ler esses claims para esconder/mostrar botões.
     */
    public String gerarToken(Funcionario funcionario) {
        try {
            Algorithm algoritmo = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(funcionario.getUsername())
                    // Claims para o Frontend e Lógica de Negócio
                    .withClaim("empresaId", funcionario.getEmpresa() != null ? funcionario.getEmpresa().getId() : null)
                    .withClaim("senhaTemporaria", funcionario.isSenhaTemporaria())
                    .withClaim("authorities", funcionario.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList()))
                    .withExpiresAt(dataExpiracao())
                    .sign(algoritmo);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token jwt", exception);
        }
    }

    /**
     * Valida o token e retorna o Subject (Username).
     * Se o Issuer não bater exatamente com o que foi gerado, o token é rejeitado.
     */
    public String validateToken(String tokenJWT) {
        try {
            Algorithm algoritmo = Algorithm.HMAC256(secret);
            return JWT.require(algoritmo)
                    .withIssuer(ISSUER)
                    .build()
                    .verify(tokenJWT)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            // Log para debug em caso de falha na verificação
            System.out.println(">>> [TokenService] Falha na verificação do JWT: " + exception.getMessage());
            return "";
        }
    }

    /**
     * Define a expiração do token (8 horas).
     */
    private Instant dataExpiracao() {
        return LocalDateTime.now().plusHours(8).toInstant(ZoneOffset.of("-03:00"));
    }
}