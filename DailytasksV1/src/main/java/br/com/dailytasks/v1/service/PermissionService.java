package br.com.dailytasks.v1.service;

import br.com.dailytasks.v1.model.*;
import br.com.dailytasks.v1.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Serviço centralizado de controle de permissões (RBAC - Role Based Access Control).
 * Valida a hierarquia: MASTER > GESTOR > GERENTE (Líder no Projeto) > FUNCIONARIO.
 * * Este serviço é utilizado pelos Controllers para garantir que as regras de negócio
 * sejam respeitadas antes de qualquer operação no banco de dados.
 * * @author Equipe Daily Tasks
 * @version 3.0
 */
@Service
public class PermissionService {

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private TarefaRepository tarefaRepository;

    @Autowired
    private ListaTarefasRepository listaRepository;

    /**
     * Valida se o usuário pode gerenciar (criar/editar/deletar) algo dentro de um projeto.
     * Regra: MASTER e GESTOR têm permissão total.
     * GERENTE só pode gerenciar se estiver vinculado como LIDER_PROJETO no projeto específico.
     */
    public boolean podeGerenciarProjeto(Funcionario usuario, Long projetoId) {
        UserRole role = usuario.getRole();

        // Nível MASTER e GESTOR têm permissão global (soberania no sistema/empresa)
        if (role == UserRole.MASTER || role == UserRole.GESTOR) {
            return true;
        }

        // Se for GERENTE, o sistema consulta a tabela de membros para validar a liderança
        return projetoMembroRepository.existsByProjetoIdAndFuncionarioIdAndPapel(
                projetoId,
                usuario.getId(),
                ProjetoMembro.ProjetoPapel.LIDER_PROJETO
        );
    }

    /**
     * Verifica permissão sobre uma Lista (Coluna do Kanban) específica.
     * Busca o projeto pai da lista e valida a permissão do usuário sobre ele.
     */
    public boolean podeGerenciarLista(Funcionario usuario, Long listaId) {
        return listaRepository.findById(listaId)
                .map(lista -> podeGerenciarProjeto(usuario, lista.getProjeto().getId()))
                .orElse(false);
    }

    /**
     * Verifica permissão administrativa sobre uma Tarefa específica.
     * Um Gerente Líder pode editar tarefas de outros, mas um Funcionário comum não.
     */
    public boolean podeGerenciarTarefa(Funcionario usuario, Long tarefaId) {
        return tarefaRepository.findById(tarefaId)
                .map(tarefa -> podeGerenciarProjeto(usuario, tarefa.getProjeto().getId()))
                .orElse(false);
    }

    /**
     * Valida se o usuário é o responsável direto atribuído à tarefa.
     * Utilizado para permitir que o Funcionário altere o status (ex: mover para Concluído).
     */
    public boolean isResponsavelPelaTarefa(Funcionario usuario, Long tarefaId) {
        return tarefaRepository.findById(tarefaId)
                .map(t -> t.getFuncionarioAtribuido() != null &&
                        t.getFuncionarioAtribuido().getId().equals(usuario.getId()))
                .orElse(false);
    }
}