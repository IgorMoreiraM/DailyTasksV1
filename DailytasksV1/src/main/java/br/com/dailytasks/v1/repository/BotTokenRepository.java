package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.BotToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface BotTokenRepository extends JpaRepository<BotToken, Long> {
    Optional<BotToken> findByToken(String token);

    @Transactional
    void deleteByFuncionarioId(Long funcionarioId);
}