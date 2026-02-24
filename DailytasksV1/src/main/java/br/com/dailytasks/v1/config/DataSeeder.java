package br.com.dailytasks.v1.config;

import br.com.dailytasks.v1.model.Funcionario;
import br.com.dailytasks.v1.model.UserRole;
import br.com.dailytasks.v1.repository.FuncionarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner { // Interface que executa na inicialização

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Injetamos o BCRYPT que já configuramos

    @Override
    public void run(String... args) throws Exception {

        // 1. Verifica se já existe um usuário "admin"
        if (funcionarioRepository.findByUsername("admin") == null) {

            System.out.println(">>> SEEDER: Criando usuário ADMIN padrão...");

            // 2. Define a senha (plana)
            String senhaPlana = "admin123"; // Vamos usar "admin" / "admin123" para logar

            // 3. Criptografa a senha
            String senhaCriptografada = passwordEncoder.encode(senhaPlana);

            // 4. Cria o novo funcionário (ADMIN)
            Funcionario admin = new Funcionario();
            admin.setUsername("admin");
            admin.setNomeCompleto("Administrador do Sistema");
            admin.setPassword(senhaCriptografada); // Salva a senha criptografada
            admin.setRole(UserRole.ADMIN);

            // 5. Salva no banco
            funcionarioRepository.save(admin);

            System.out.println(">>> SEEDER: Usuário ADMIN criado com sucesso.");

        } else {
            System.out.println(">>> SEEDER: Usuário ADMIN já existe. Nenhum dado foi inserido.");
        }
    }
}