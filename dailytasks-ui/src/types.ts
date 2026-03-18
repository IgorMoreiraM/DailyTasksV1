/**
 * Papéis Globais: Definem o acesso base do usuário ao sistema.
 */
export type UserRole = 'MASTER' | 'GESTOR' | 'GERENTE' | 'FUNCIONARIO';

/**
 * Papéis de Escopo: Definem a autoridade do usuário dentro de um projeto específico.
 * Essencial para permitir que um Gerente seja Líder em um projeto e apenas Colaborador em outro.
 */
export type ProjetoPapel = 'LIDER_PROJETO' | 'COLABORADOR';

/**
 * Interface representativa de um Projeto.
 * Agora inclui o 'meuPapel' para facilitar a lógica de "Modo Gestão" no Frontend.
 */
export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  meuPapel?: ProjetoPapel; // Informação enviada pelo backend baseada no usuário logado
}

/**
 * Interface representativa de uma Lista de Tarefas.
 */
export interface Lista {
  id: number;
  nome: string;
  projeto?: { 
    id: number; 
    nome?: string 
  };
}

/**
 * Interface representativa de um Funcionário/Usuário.
 */
export interface Funcionario {
  id: number;
  nomeCompleto: string;
  role: UserRole; // Nível de acesso global
}

/**
 * Interface representativa de uma Tarefa.
 * Contém todos os dados necessários para renderizar o card e o badge de projeto.
 */
export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'BLOQUEADA' | 'CANCELADA';
  dataDeVencimento: string;
  projetoId: number;
  nomeProjeto: string;
  listaId?: number;
  nomeLista?: string;
  funcionarioId: number;
  nomeFuncionario: string;
}