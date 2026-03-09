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
 * Extrai o usuário do token e o autentica no contexto do Spring Security.
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

            // CORREÇÃO: O repositório retorna Optional, então usamos .orElse(null)
            // para pegar o Funcionario ou nulo se não encontrar.
            var funcionario = repository.findByUsername(subject).orElse(null);

            if (funcionario != null) {
                // Agora o Java reconhece o getAuthorities() porque 'funcionario' é o objeto real
                var authentication = new UsernamePasswordAuthenticationToken(funcionario, null, funcionario.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        var authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null) {
            return authorizationHeader.replace("Bearer ", "");
        }
        return null;
    }
}