import { Routes, Route, Navigate, To } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { CreatePage } from './pages/CreatePage';
import './App.css';

/**
 * Componente para proteger rotas baseadas em autenticação e permissões (Roles).
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
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* --- ROTA PÚBLICA --- */}
      <Route path="/login" element={<LoginPage />} />

      {/* --- ROTA DO FUNCIONÁRIO --- */}
      {/* Acessível por qualquer usuário logado */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAllowed={isAuthenticated}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* --- ROTAS DO ADMINISTRADOR --- */}
      {/* Acessíveis apenas se estiver logado E for ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isAdmin}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/criar"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isAdmin}>
            <CreatePage />
          </ProtectedRoute>
        }
      />

      {/* --- REDIRECIONAMENTO PADRÃO --- */}
      {/* Se o usuário tentar acessar uma rota inexistente ou a raiz (/) */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;