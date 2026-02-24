import axios from 'axios';

// 1. URL base da nossa API Java
const API_URL = 'http://localhost:8080';

// 2. Cria uma "instância" do Axios
const api = axios.create({
  baseURL: API_URL,
});

// 3. Interceptor de Requisição (MÁGICA ACONTECENDO AQUI)
// Isso é executado ANTES de CADA requisição que fizermos
api.interceptors.request.use(
  (config) => {
    // 4. Pega o token do localStorage
    const token = localStorage.getItem('authToken');
    
    // 5. Se o token existir, anexa ele ao cabeçalho Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Continua a requisição com o novo cabeçalho
  },
  (error) => {
    // Em caso de erro na configuração da requisição
    return Promise.reject(error);
  }
);

export default api;