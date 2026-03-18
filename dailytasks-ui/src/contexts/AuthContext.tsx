import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { UserRole } from '../types';

/**
 * Interface do JWT gerado pelo Spring (TokenService.java).
 */
interface DecodedToken {
  sub: string;
  authorities: string[]; 
  senhaTemporaria: boolean;
  empresaId: number | null; // NOVO: Crucial para o Multi-tenancy
  exp: number;
}

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  empresaId: number | null; // NOVO: Exportado para uso em toda a aplicação
  senhaTemporaria: boolean;
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
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [senhaTemporaria, setSenhaTemporaria] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminDataVersion, setAdminDataVersion] = useState(0);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Verifica se o token expirou
        if (decoded.exp * 1000 > Date.now()) {
          setUsername(decoded.sub);
          setSenhaTemporaria(decoded.senhaTemporaria);
          setEmpresaId(decoded.empresaId); // Guarda o ID da empresa do usuário
          
          // MAPEAMENTO DE ROLES (Hierarquia vinda do authorities)
          const roles = decoded.authorities || [];
          let currentRole: UserRole = 'FUNCIONARIO';

          if (roles.includes('ROLE_MASTER')) currentRole = 'MASTER';
          else if (roles.includes('ROLE_GESTOR')) currentRole = 'GESTOR';
          else if (roles.includes('ROLE_GERENTE')) currentRole = 'GERENTE';

          setRole(currentRole);
          setIsAuthenticated(true);
          
          // Configura o Axios para usar o token em todas as chamadas
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          logout();
        }
      } catch (error) {
        console.error("[AuthContext] Falha na decodificação do token:", error);
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
    setEmpresaId(null);
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
    empresaId, // Útil para filtros extras no frontend se necessário
    senhaTemporaria,
    isAuthenticated,
    isLoading,
    login,
    logout,
    adminDataVersion, 
    refreshAdminData, 
  };

  // TELA DE CARREGAMENTO (Splash Screen)
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-100">
            <span className="text-2xl">🚀</span>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Sincronizando</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Daily Tasks Enterprise</p>
          </div>
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