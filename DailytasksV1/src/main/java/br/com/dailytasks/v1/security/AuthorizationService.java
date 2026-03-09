package br.com.dailytasks.v1.security;

import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Serviço de autorização atualizado para o ecossistema Daily Tasks.
 * Implementa a interface UserDetailsService necessária para o Spring Security.
 * * @author Equipe Daily Tasks
 * @version 2.1
 */
@Service
public class AuthorizationService implements UserDetailsService {

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    /**
     * Carrega os dados do usuário a partir do username.
     * Agora trata o retorno Optional do repositório de forma segura.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // CORREÇÃO: Usamos o método .orElseThrow() para extrair o Funcionario de dentro do Optional.
        // Se o usuário não existir, ele já dispara a exceção UsernameNotFoundException automaticamente.
        return funcionarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário '" + username + "' não encontrado no sistema."));
    }
}