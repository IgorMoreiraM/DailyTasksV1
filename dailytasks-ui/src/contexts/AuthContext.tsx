import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

// --- Interfaces ---
interface DecodedToken {
  sub: string;
  authorities: string[];
  exp: number;
}

interface AuthState {
  token: string | null;
  username: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean; // Agora representa o ESTADO VERIFICADO
  isLoading: boolean; // NOVO ESTADO: A verificar o token
  adminDataVersion: number;
  refreshAdminData: () => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Inicia como falso
  const [isLoading, setIsLoading] = useState(true); // Inicia a carregar
  const [adminDataVersion, setAdminDataVersion] = useState(0);

  useEffect(() => {
    // Este useEffect agora trata da verificação do token
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Verifica a expiração
        if (decoded.exp * 1000 > Date.now()) {
          // Token válido e não expirado
          setUsername(decoded.sub);
          const hasAdminRole = decoded.authorities && decoded.authorities.includes('ROLE_ADMIN');
          setIsAdmin(hasAdminRole);
          setIsAuthenticated(true); // <-- SÓ AGORA é que está autenticado
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Token expirado
          console.log("[AuthContext] Token expirado.");
          logout(); // (O logout irá definir isAuthenticated como falso)
        }
      } catch (error) {
        console.error("[AuthContext] Token inválido:", error);
        logout(); // (O logout irá definir isAuthenticated como falso)
      }
    } else {
      // Sem token
      setUsername(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
    }
    // Terminámos a verificação (seja qual for o resultado)
    setIsLoading(false); 
  }, [token]); // Roda sempre que o 'token' mudar

  const login = (newToken: string) => {
    // Quando fazemos login, salvamos no localStorage PRIMEIRO
    localStorage.setItem('authToken', newToken); 
    // E depois atualizamos o estado 'token', o que dispara o useEffect acima
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    // Atualizamos o estado 'token' para null, o que dispara o useEffect
    setToken(null); 
  };

  const refreshAdminData = () => setAdminDataVersion(v => v + 1); 

  const value = {
    token,
    username,
    isAdmin,
    isAuthenticated, // O estado agora é verificado
    isLoading, // O estado de carregamento
    login,
    logout,
    adminDataVersion, 
    refreshAdminData, 
  };

  // Enquanto verifica o token inicial, não renderiza nada (ou um spinner)
  // Isto impede o 'App.tsx' de tentar renderizar as rotas cedo demais
  if (isLoading) {
    return null; // ou <p>A carregar...</p>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook (fica igual)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};