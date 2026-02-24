package br.com.dailytasks.v1.security;

import br.com.dailytasks.v1.repository.FuncionarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component // Marca este filtro como um componente gerenciado pelo Spring
public class SecurityFilter extends OncePerRequestFilter { // Garante que é executado 1 vez por req

    @Autowired
    private TokenService tokenService;

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Tenta recuperar o token do cabeçalho da requisição
        var token = this.recoverToken(request);

        // 2. Se um token foi encontrado
        if (token != null) {
            // 3. Valida o token usando nosso TokenService
            // 3. Valida o token usando nosso TokenService
            var subject = tokenService.validateToken(token);

            // 4. Se o token for válido (subject não está vazio)
            if (!subject.isEmpty()) {
                // 5. Busca o usuário (Funcionario) no banco de dados
                UserDetails user = funcionarioRepository.findByUsername(subject);

                // 6. Cria um objeto de autenticação para o Spring Security
                var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

                // 7. Salva a autenticação no contexto de segurança.
                // O Spring agora sabe que este usuário está autenticado para esta requisição.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        // 8. Independentemente de ter token ou não, continua a cadeia de filtros.
        // Se não houver autenticação, o Spring Security barrará o acesso (como configuramos)
        filterChain.doFilter(request, response);
    }

    // Método auxiliar para extrair o token do Header "Authorization"
    private String recoverToken(HttpServletRequest request) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null; // Não há token ou está mal formatado
        }
        // Remove o prefixo "Bearer " para obter apenas o token
        return authHeader.replace("Bearer ", "");
    }
}