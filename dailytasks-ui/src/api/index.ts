import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dt_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/login', { username, password }),
}

export const empresaApi = {
  listar:   ()             => api.get('/empresas'),
  detalhar: (id: number)   => api.get(`/empresas/${id}`),
  criar:    (data: object) => api.post('/empresas', data),
  deletar:  (id: number)   => api.delete(`/empresas/${id}`),
}

export const funcionarioApi = {
  listar:     ()              => api.get('/funcionarios'),
  criar:      (data: any)     => api.post('/funcionarios', data),
  atualizar:  (id: number, data: any) => api.put(`/funcionarios/${id}`, data),
  deletar:    (id: number)    => api.delete(`/funcionarios/${id}`),
  uploadFoto: (id: number, foto: string) => api.patch(`/funcionarios/${id}/upload-foto`, { foto }),
  resetSenha: (id: number)    => api.patch(`/funcionarios/${id}/reset-senha`),
  ativar:     (id: number)    => api.patch(`/funcionarios/${id}/ativar`),
  alterarSenha: (data: any)   => api.patch('/funcionarios/alterar-senha', data),
}

export const projetoApi = {
  listar:          ()                           => api.get('/projetos'),
  detalhar:        (id: number)                 => api.get(`/projetos/${id}`),
  criar:           (data: object)               => api.post('/projetos', data),
  atualizar:       (id: number, data: object)   => api.put(`/projetos/${id}`, data),
  deletar:         (id: number)                 => api.delete(`/projetos/${id}`),
  listarMembros:   (id: number)                 => api.get(`/projetos/${id}/membros`),
  adicionarMembro: (id: number, data: object)   => api.post(`/projetos/${id}/membros`, data),
}

export const listaApi = {
  listarPorProjeto: (projetoId: number) => api.get(`/listas/projeto/${projetoId}`),
  criar:            (data: object)       => api.post('/listas', data),
  atualizar:        (id: number, data: object) => api.put(`/listas/${id}`, data),
  deletar:          (id: number)         => api.delete(`/listas/${id}`),
}

export const tarefaApi = {
  listarPorProjeto: (projetoId: number)         => api.get(`/tarefas/projeto/${projetoId}`),
  listarMinhas: () => api.get('/tarefas/minhas'),
  criar:            (data: object)               => api.post('/tarefas', data),
  atualizar:        (id: number, data: object)   => api.put(`/tarefas/${id}`, data),
  deletar:          (id: number)                 => api.delete(`/tarefas/${id}`),
}

export const membroApi = {
  atribuirLider: (projetoId: number, funcionarioId: number) =>
    api.post('/projeto-membros/atribuir-lider', { projetoId, funcionarioId }),
}

export const botApi = {
  gerarToken: () => api.post('/bot/gerar-token'),
}