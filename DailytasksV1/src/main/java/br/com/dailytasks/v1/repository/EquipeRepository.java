package br.com.dailytasks.v1.repository;

import br.com.dailytasks.v1.model.Equipe;
import org.springframework.data.jpa.repository.JpaRepository;

// Interface para interagir com a tabela 'equipes'
public interface EquipeRepository extends JpaRepository<Equipe, Long> {
}