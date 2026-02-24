package br.com.dailytasks.v1.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Permite CORS para todos os endpoints (/**)
                        .allowedOrigins("http://localhost:5173") // A URL do seu frontend React
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // Métodos permitidos
                        .allowedHeaders("*") // Todos os cabeçalhos
                        .allowCredentials(true); // Permite envio de credenciais (como cookies, se usássemos)
            }
        };
    }
}