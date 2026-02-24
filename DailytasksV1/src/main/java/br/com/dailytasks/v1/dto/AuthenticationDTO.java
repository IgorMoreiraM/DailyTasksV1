package br.com.dailytasks.v1.dto;

// DTO para os dados que chegam no /login (REQUEST)
public record AuthenticationDTO(String username, String password) {
}