import { Routes, Route, Navigate, To } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { CreatePage } from './pages/CreatePage';
import { MasterPanel } from './pages/MasterPanel';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage'; // Nova página
import './App.css';

/**
 * Componente para proteger rotas baseadas em autenticação, permissões e status da conta.
 */
interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectTo?: To;
  children: React.ReactElement;
}

const ProtectedRoute = ({ isAllowed, redirectTo = "/login", children }: ProtectedRouteProps) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, role, senhaTemporaria } = useAuth();

  // Atalhos de permissão
  const isMaster = role === 'MASTER';
  const isGestorOuMaster = role === 'MASTER' || role === 'GESTOR';

  /**
   * Lógica de Redirecionamento Centralizada
   * Garante que o usuário vá para o lugar certo baseado no cargo e na necessidade de trocar senha.
   */
  const getHomeRedirect = () => {
    if (!isAuthenticated) return "/login";
    if (senhaTemporaria) return "/primeiro-acesso"; // Prioridade máxima
    
    if (isMaster) return "/master";
    if (isGestorOuMaster) return "/admin";
    return "/dashboard";
  };

  return (
    <Routes>
      {/* --- ROTA PÚBLICA --- */}
      <Route path="/login" element={<LoginPage />} />

      {/* --- ROTA DE TROCA DE SENHA OBRIGATÓRIA --- */}
      <Route 
        path="/primeiro-acesso" 
        element={
          <ProtectedRoute isAllowed={isAuthenticated}>
            <ChangePasswordPage />
          </ProtectedRoute>
        } 
      />

      {/* --- ROTAS PROTEGIDAS (Só acessíveis se senhaTemporaria for FALSE) --- */}
      
      {/* MASTER PANEL */}
      <Route
        path="/master"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isMaster && !senhaTemporaria} redirectTo={getHomeRedirect()}>
            <MasterPanel />
          </ProtectedRoute>
        }
      />

      {/* DETALHES DO PROJETO */}
      <Route
        path="/projetos/:id"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && !senhaTemporaria} redirectTo={getHomeRedirect()}>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD GERAL */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && !senhaTemporaria} redirectTo={getHomeRedirect()}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* ADMINISTRAÇÃO */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isGestorOuMaster && !senhaTemporaria} redirectTo={getHomeRedirect()}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* CRIAÇÃO */}
      <Route
        path="/criar"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isGestorOuMaster && !senhaTemporaria} redirectTo={getHomeRedirect()}>
            <CreatePage />
          </ProtectedRoute>
        }
      />

      {/* --- REDIRECIONAMENTO PADRÃO INTELIGENTE --- */}
      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
  );
}

export default App;