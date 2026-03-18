package br.com.dailytasks.v1.security;

import br.com.dailytasks.v1.repository.FuncionarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de Segurança JWT.
 * Versão 5.2: Com logs de depuração para rastreio de permissões (403 Forbidden).
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private FuncionarioRepository repository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        var tokenJWT = recuperarToken(request);

        if (tokenJWT != null) {
            var subject = tokenService.validateToken(tokenJWT);

            if (subject != null && !subject.isEmpty()) {
                // Buscamos o funcionário no banco. O Optional garante que não teremos NullPointerException aqui.
                var funcionario = repository.findByUsername(subject).orElse(null);

                if (funcionario != null) {
                    // DEBUG: Se o 403 persistir, olhe estes prints no console do Java!
                    System.out.println(">>> [SecurityFilter] Usuário detectado: " + funcionario.getUsername());
                    System.out.println(">>> [SecurityFilter] Permissões ativas: " + funcionario.getAuthorities());

                    // Criamos o objeto de autenticação injetando o objeto 'funcionario' completo e suas Authorities.
                    var authentication = new UsernamePasswordAuthenticationToken(funcionario, null, funcionario.getAuthorities());

                    // Definimos a autenticação no contexto do Spring para essa requisição específica.
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    System.out.println(">>> [SecurityFilter] Alerta: Subject do token existe, mas usuário não foi encontrado no banco.");
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrai o token do cabeçalho Authorization.
     */
    private String recuperarToken(HttpServletRequest request) {
        var authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.replace("Bearer ", "").trim();
        }
        return null;
    }
}