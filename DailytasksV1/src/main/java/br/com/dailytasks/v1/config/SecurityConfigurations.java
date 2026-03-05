package br.com.dailytasks.v1.config;

import br.com.dailytasks.v1.security.SecurityFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Classe de configuração de segurança do Spring Security.
 * Define as políticas de autenticação, autorização e filtros de requisição para o ecossistema Daily Tasks.
 * Implementa a hierarquia: Projetos > Listas > Tarefas.
 * * @author Equipe Daily Tasks
 * @version 1.2
 */
@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    /**
     * Configura a corrente de filtros de segurança (Security Filter Chain).
     * Define quem pode criar Projetos, gerenciar Listas e operar Tarefas.
     * * @param http Objeto HttpSecurity para configurar a segurança web.
     * @return SecurityFilterChain configurado.
     * @throws Exception Caso ocorra erro na configuração.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable) // Desabilita CSRF para APIs REST Stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize

                        // --- 0. Pre-flight Requests ---
                        // Essencial para permitir que o navegador (CORS) valide a requisição antes do envio real
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // --- 1. Rotas Públicas ---
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/health-check").permitAll()

                        // --- 2. Regras de ADMINISTRADOR (Controle Total) ---

                        // Gestão de Funcionários
                        .requestMatchers(HttpMethod.POST, "/funcionarios").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/funcionarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/funcionarios/**").hasRole("ADMIN")

                        // Gestão de Projetos (Novo pilar do sistema)
                        .requestMatchers(HttpMethod.POST, "/projetos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/projetos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/projetos/**").hasRole("ADMIN")

                        // Gestão de Listas (Vinculadas a Projetos)
                        .requestMatchers(HttpMethod.POST, "/listas").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/listas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/listas/**").hasRole("ADMIN")

                        // Gestão de Tarefas (Criação e Deleção)
                        .requestMatchers(HttpMethod.POST, "/tarefas").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/tarefas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/tarefas/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/tarefas").hasRole("ADMIN")

                        // --- 3. Regras Compartilhadas (ADMIN e FUNCIONARIO) ---
                        // Rotas de visualização e atualização de progresso
                        .requestMatchers(HttpMethod.GET, "/projetos/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/listas/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/funcionarios").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/tarefas/minhas-tarefas").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/tarefas/**").hasAnyRole("ADMIN", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.PATCH, "/tarefas/**").hasAnyRole("ADMIN", "FUNCIONARIO")

                        // --- 4. Bloqueio Geral ---
                        .anyRequest().authenticated()
                )
                // Injeção do filtro de autenticação JWT customizado
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * Gerencia a autenticação baseada nas configurações de AuthenticationConfiguration.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Define o BCrypt como algoritmo de criptografia para senhas.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}