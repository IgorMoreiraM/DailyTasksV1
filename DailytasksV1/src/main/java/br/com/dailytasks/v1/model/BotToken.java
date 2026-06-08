package br.com.dailytasks.v1.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "bot_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BotToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean usado = false;
}