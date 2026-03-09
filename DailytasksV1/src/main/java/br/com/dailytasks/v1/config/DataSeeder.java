package br.com.dailytasks.v1.config;

import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> SEEDER: Verificando usuário mestre...");

        // Linha 34: Agora o tipo Optional<Funcionario> é compatível com o Repository
        Optional<Funcionario> adminExistente = funcionarioRepository.findByUsername("admin");

        if (adminExistente.isEmpty()) {
            System.out.println(">>> SEEDER: Criando usuário MASTER padrão...");

            Funcionario admin = new Funcionario();
            admin.setUsername("admin");
            admin.setNomeCompleto("Administrador Master");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.MASTER); // Hierarquia nova

            funcionarioRepository.save(admin);
            System.out.println(">>> SEEDER: Usuário MASTER criado com sucesso.");
        } else {
            System.out.println(">>> SEEDER: Usuário MASTER já existe.");
        }
    }
}