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

/**
 * Configuração de segurança central do Daily Tasks.
 * Gerencia a hierarquia de acesso e integra a política de CORS.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // 1. ATIVA O CORS: Crucial para o Frontend (5173) falar com o Backend (8080)
                .cors(Customizer.withDefaults())

                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize

                        // --- 0. Pre-flight e Públicos ---
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/health-check").permitAll()

                        // --- 1. Gestão de Pessoas (/funcionarios) ---
                        // CORREÇÃO: Liberado para MASTER (Igor) e GESTOR (Clientes)
                        .requestMatchers("/funcionarios/**").hasAnyRole("MASTER", "GESTOR")

                        // --- 2. Gestão de Projetos e Estrutura ---
                        // Apenas Master e Gestor podem criar/deletar projetos e colunas (listas)
                        .requestMatchers("/projetos/**").hasAnyRole("MASTER", "GESTOR")
                        .requestMatchers("/listas/**").hasAnyRole("MASTER", "GESTOR")

                        // --- 3. Operação de Tarefas ---
                        // Gerentes criam tarefas. Funcionários apenas as executam.
                        .requestMatchers(HttpMethod.POST, "/tarefas").hasAnyRole("MASTER", "GESTOR", "GERENTE")
                        .requestMatchers(HttpMethod.DELETE, "/tarefas/**").hasAnyRole("MASTER", "GESTOR", "GERENTE")

                        // --- 4. Acesso Geral ---
                        // Qualquer usuário logado pode ver seus dados e atualizar status de tarefas
                        .requestMatchers(HttpMethod.GET, "/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/tarefas/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/tarefas/**").authenticated()

                        .anyRequest().authenticated()
                )
                // Adiciona o filtro de JWT antes do filtro padrão do Spring
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