import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { UserRole } from '../types';

/**
 * Interface do que vem dentro do seu JWT gerado pelo Spring.
 * Adicionamos 'senhaTemporaria' para o controle de primeiro acesso.
 */
interface DecodedToken {
  sub: string;
  authorities: string[]; 
  senhaTemporaria: boolean; // Flag crucial vinda do Backend
  exp: number;
}

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  senhaTemporaria: boolean; // Novo estado exportado
  isAuthenticated: boolean;
  isLoading: boolean;
  adminDataVersion: number;
  refreshAdminData: () => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [senhaTemporaria, setSenhaTemporaria] = useState(false); // Inicia como falso
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminDataVersion, setAdminDataVersion] = useState(0);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Verifica expiração (multiplica por 1000 pois exp vem em segundos)
        if (decoded.exp * 1000 > Date.now()) {
          setUsername(decoded.sub);
          setSenhaTemporaria(decoded.senhaTemporaria); // Extrai a flag do Token
          
          // Mapeamento de Roles do Spring Security
          const roles = decoded.authorities || [];
          let currentRole: UserRole = 'FUNCIONARIO';

          if (roles.includes('ROLE_MASTER')) currentRole = 'MASTER';
          else if (roles.includes('ROLE_GESTOR')) currentRole = 'GESTOR';
          else if (roles.includes('ROLE_GERENTE')) currentRole = 'GERENTE';

          setRole(currentRole);
          setIsAuthenticated(true);
          
          // Injeta o token em todas as futuras chamadas do Axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          logout();
        }
      } catch (error) {
        console.error("[AuthContext] Erro ao decodificar token:", error);
        logout();
      }
    } else {
      resetAuthState();
    }
    setIsLoading(false); 
  }, [token]);

  const resetAuthState = () => {
    setRole(null);
    setUsername(null);
    setSenhaTemporaria(false);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
  };

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken); 
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null); 
    resetAuthState();
  };

  const refreshAdminData = () => setAdminDataVersion(v => v + 1); 

  const value = {
    token,
    username,
    role,
    senhaTemporaria, // Disponível para o App.tsx bloquear rotas
    isAuthenticated,
    isLoading,
    login,
    logout,
    adminDataVersion, 
    refreshAdminData, 
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Autenticando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};