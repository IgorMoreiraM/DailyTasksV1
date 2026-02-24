package br.com.dailytasks.v1.security;

import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service // Marca este serviço para ser gerenciado pelo Spring
public class AuthorizationService implements UserDetailsService { // Implementa a interface chave

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Esta é a "cola"!
        // O Spring Security chamará este método.
        // Nós simplesmente delegamos a busca ao nosso repositório.

        UserDetails user = funcionarioRepository.findByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException("Usuário '" + username + "' não encontrado.");
        }

        return user;
    }
}