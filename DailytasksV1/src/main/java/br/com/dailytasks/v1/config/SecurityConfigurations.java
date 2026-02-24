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

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize

                        // --- NOVA REGRA AQUI ---
                        // Permite todas as requisições "preflight" OPTIONS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // --- 1. Regras PÚBLICAS (Login) ---
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/health-check").permitAll()

                        // --- 2. Regras de ADMIN ---
                        .requestMatchers(HttpMethod.POST, "/equipes/{idEquipe}/associar-funcionario").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/equipes").hasAuthority("ROLE_ADMIN")
                        // ... (todas as suas outras regras de ADMIN)
                        .requestMatchers(HttpMethod.POST, "/funcionarios").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/listas-tarefas").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/tarefas").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/funcionarios/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/funcionarios/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/equipes/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/equipes/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/listas-tarefas/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/listas-tarefas/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/tarefas/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/tarefas/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/tarefas").hasAuthority("ROLE_ADMIN")

                        // --- 3. Regras de FUNCIONÁRIO ---
                        .requestMatchers(HttpMethod.GET, "/equipes").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/funcionarios").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/tarefas/minhas-tarefas").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.PATCH, "/tarefas/**").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/equipes/**").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/listas-tarefas").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/listas-tarefas/**").hasAuthority("ROLE_FUNCIONARIO")
                        .requestMatchers(HttpMethod.GET, "/tarefas/**").hasAuthority("ROLE_FUNCIONARIO")

                        // --- 4. Regra FINAL ---
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