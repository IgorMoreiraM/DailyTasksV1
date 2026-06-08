/* DailyTasks UI — types.ts */

export type UserRole = 'MASTER' | 'GESTOR' | 'GERENTE' | 'FUNCIONARIO'
export type ProjetoPapel = 'LIDER_PROJETO' | 'COLABORADOR'
export type TaskStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'BLOQUEADA' | 'CANCELADA'

export interface Empresa {
  id: number
  nome: string
  cnpj: string
}

export interface Funcionario {
  id: number
  username: string
  nomeCompleto: string
  role: UserRole
  foto?: string | null
  ativo?: boolean
  senhaTemporaria?: boolean
  empresaId?: number | null
}

export interface Projeto {
  id: number
  nome: string
  descricao?: string
  empresaId?: number
  meuPapel?: ProjetoPapel
}

export interface Lista {
  id: number
  nome: string
  projeto?: {
    id: number
    nome?: string
    empresa?: { id: number }
  }
}

export interface Tarefa {
  id: number
  titulo: string
  descricao?: string
  status: TaskStatus
  dataDeVencimento?: string
  projetoId: number
  nomeProjeto: string
  listaId?: number | null
  nomeLista?: string
  funcionarioId: number
  nomeFuncionario: string
  empresaId?: number
  username?: string
}

export interface ProjetoMembro {
  id: number
  projeto: Projeto
  funcionario: Funcionario
  papel: ProjetoPapel
}

export interface DecodedToken {
  sub: string
  authorities: string[]
  senhaTemporaria: boolean
  empresaId: number | null
  exp: number
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDENTE:     'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA:    'Concluída',
  BLOQUEADA:    'Bloqueada',
  CANCELADA:    'Cancelada',
}

export const STATUS_COLOR: Record<TaskStatus, string> = {
  PENDENTE:     'bg-amber-50 text-amber-700 border-amber-200',
  EM_ANDAMENTO: 'bg-blue-50 text-blue-700 border-blue-200',
  CONCLUIDA:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  BLOQUEADA:    'bg-rose-50 text-rose-700 border-rose-200',
  CANCELADA:    'bg-slate-50 text-slate-500 border-slate-200',
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  PENDENTE:     'bg-amber-400',
  EM_ANDAMENTO: 'bg-blue-500',
  CONCLUIDA:    'bg-emerald-500',
  BLOQUEADA:    'bg-rose-500',
  CANCELADA:    'bg-slate-400',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  MASTER:      'Admin Master',
  GESTOR:      'Gestor',
  GERENTE:     'Gerente',
  FUNCIONARIO: 'Funcionário',
}

export const ROLE_COLOR: Record<UserRole, string> = {
  MASTER:      'bg-amber-50 text-amber-700 border-amber-200',
  GESTOR:      'bg-teal-50 text-teal-700 border-teal-200',
  GERENTE:     'bg-violet-50 text-violet-700 border-violet-200',
  FUNCIONARIO: 'bg-orange-50 text-orange-700 border-orange-200',
}