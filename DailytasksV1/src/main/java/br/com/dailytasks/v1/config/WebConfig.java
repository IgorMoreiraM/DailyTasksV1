package br.com.dailytasks.v1.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração Global de Web e CORS.
 * Resolve o erro de 'Access-Control-Allow-Origin' permitindo a comunicação
 * entre o Frontend (Porta 5173) e o Backend (Porta 8080).
 * * @author Equipe Daily Tasks
 * @version 2.5
 */
@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Aplica a todos os endpoints da API
                        .allowedOrigins("http://localhost:5173") // Origem do seu React/Vite
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // Métodos permitidos
                        .allowedHeaders("*") // Permite todos os headers (Authorization, Content-Type, etc)
                        .allowCredentials(true) // Necessário para enviar Cookies ou Headers de Autenticação
                        .maxAge(3600); // Cache da pré-requisição (Pre-flight) por 1 hora
            }
        };
    }
}