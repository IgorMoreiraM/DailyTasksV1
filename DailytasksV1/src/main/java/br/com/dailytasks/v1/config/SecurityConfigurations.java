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
 * Configuração de segurança definitiva.
 * A ordem dos requestMatchers é CRÍTICA: as regras mais específicas devem vir antes das genéricas.
 */
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

                        // --- 1. EXCLUSIVO MASTER ---
                        .requestMatchers("/empresas", "/empresas/**").hasRole("MASTER")

                        // --- 2. GESTÃO DE PESSOAS (/funcionarios) ---
                        // Permite alteração de senha própria para qualquer nível logado
                        .requestMatchers(HttpMethod.PATCH, "/funcionarios/alterar-senha").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/funcionarios/*/upload-foto").authenticated()

                        // Gestão administrativa (Criar/Deletar/Listar todos)
                        .requestMatchers("/funcionarios", "/funcionarios/**").hasAnyRole("MASTER", "GESTOR")

                        // --- 3. GESTÃO DE PROJETOS E ESTRUTURA (/projetos e /listas) ---

                        // Escrita (POST, PUT, DELETE): Apenas Master e Gestor
                        // Usamos a vírgula para cobrir tanto "/projetos" quanto "/projetos/..."
                        .requestMatchers(HttpMethod.POST, "/projetos/**", "/projetos", "/listas/**", "/listas").hasAnyRole("MASTER", "GESTOR")
                        .requestMatchers(HttpMethod.PUT, "/projetos/**", "/listas/**").hasAnyRole("MASTER", "GESTOR")
                        .requestMatchers(HttpMethod.DELETE, "/projetos/**", "/listas/**").hasAnyRole("MASTER", "GESTOR")

                        // Leitura (GET): Qualquer um logado (o isolamento de dados ocorre no Controller)
                        .requestMatchers(HttpMethod.GET, "/projetos/**", "/projetos", "/listas/**", "/listas").authenticated()

                        // --- 4. OPERAÇÃO DE TAREFAS (/tarefas) ---

                        // Criação e Exclusão: Master, Gestor e Gerente
                        .requestMatchers(HttpMethod.POST, "/tarefas/**", "/tarefas").hasAnyRole("MASTER", "GESTOR", "GERENTE")
                        .requestMatchers(HttpMethod.DELETE, "/tarefas/**").hasAnyRole("MASTER", "GESTOR", "GERENTE")

                        // Leitura e Atualização de Status: Todos os membros da empresa
                        .requestMatchers(HttpMethod.GET, "/tarefas/**", "/tarefas").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/tarefas/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/tarefas/**").authenticated()

                        // --- 5. SEGURANÇA FINAL ---
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