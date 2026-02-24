import { Routes, Route, Navigate, To } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; 
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { CreatePage } from './pages/CreatePage';
import './App.css'; 

// --- Componente ProtectedRoute (fica igual) ---
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

// --- Componente App (Modificado) ---
function App() {
  // 1. Obtemos o 'isLoading' do nosso hook
  const { isAuthenticated, isAdmin, isLoading } = useAuth(); 

  // 2. Se estiver a carregar (a verificar o token inicial), não renderiza rotas
  if (isLoading) {
    return null; // Ou um <Spinner /> global
  }

  // 3. O 'isAuthenticated' e 'isAdmin' agora são 100% fiáveis
  return (
    <Routes>
      <Route 
        path="/login" 
        element={<LoginPage />} 
      />

      {/* Rota de Funcionário (Mais Específica) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && !isAdmin}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      
      {/* Rota de Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isAdmin}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      
      {/* Rota de Criar (Admin) */}
      <Route
        path="/criar"
        element={
          <ProtectedRoute isAllowed={isAuthenticated && isAdmin}>
            <CreatePage />
          </ProtectedRoute>
        }
      />
      
      {/* Rota Padrão: Redireciona para o local correto */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            // Agora o 'isAdmin' está correto no momento do redirecionamento
            <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;