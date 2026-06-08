package br.com.dailytasks.v1.config;

import br.com.dailytasks.v1.security.SecurityFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize

                        // --- 0. ACESSO PÚBLICO ---
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/health-check").permitAll()

                        // --- 1. BOT TELEGRAM ---
                        // Validar token não precisa de JWT (é o mecanismo de login do bot)
                        .requestMatchers(HttpMethod.POST, "/bot/validar-token").permitAll()
                        // Gerar token requer usuário autenticado
                        .requestMatchers(HttpMethod.POST, "/bot/gerar-token").authenticated()

                        // --- 2. EXCLUSIVO MASTER ---
                        .requestMatchers("/empresas", "/empresas/**").hasRole("MASTER")

                        // --- 3. GESTÃO DE PESSOAS (/funcionarios) ---
                        .requestMatchers(HttpMethod.PATCH, "/funcionarios/alterar-senha").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/funcionarios/*/upload-foto").authenticated()
                        .requestMatchers("/funcionarios", "/funcionarios/**").hasAnyRole("MASTER", "GESTOR")

                        // --- 4. GESTÃO DE PROJETOS E ESTRUTURA (/projetos e /listas) ---
                        .requestMatchers(HttpMethod.POST, "/projetos/**", "/projetos", "/listas/**", "/listas").hasAnyRole("MASTER", "GESTOR")
                        .requestMatchers(HttpMethod.PUT, "/projetos/**", "/listas/**").hasAnyRole("MASTER", "GESTOR")
                        .requestMatchers(HttpMethod.DELETE, "/projetos/**", "/listas/**").hasAnyRole("MASTER", "GESTOR")
                        .requestMatchers(HttpMethod.GET, "/projetos/**", "/projetos", "/listas/**", "/listas").authenticated()

                        // --- 5. OPERAÇÃO DE TAREFAS (/tarefas) ---
                        .requestMatchers(HttpMethod.POST, "/tarefas/**", "/tarefas").hasAnyRole("MASTER", "GESTOR", "GERENTE")
                        .requestMatchers(HttpMethod.DELETE, "/tarefas/**").hasAnyRole("MASTER", "GESTOR", "GERENTE")
                        .requestMatchers(HttpMethod.GET, "/tarefas/**", "/tarefas").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/tarefas/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/tarefas/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/tarefas/minhas").authenticated()

                        // --- 6. SEGURANÇA FINAL ---
                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}