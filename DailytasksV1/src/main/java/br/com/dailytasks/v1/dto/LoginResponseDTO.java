package br.com.dailytasks.v1.dto;

// DTO para os dados que retornamos após o /login (RESPONSE)
public record LoginResponseDTO(String token) {
}