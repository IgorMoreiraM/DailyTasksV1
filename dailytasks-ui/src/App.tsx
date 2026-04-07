import { Routes, Route, Navigate, type To } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LoginPage }             from './pages/LoginPage'
import { ChangePasswordPage }    from './pages/ChangePasswordPage'
import { MasterDashboard }       from './pages/master/MasterDashboard'
import { GestorDashboard }       from './pages/gestor/GestorDashboard'
import { GerenteDashboard }      from './pages/gerente/GerenteDashboard'
import { FuncionarioDashboard }  from './pages/funcionario/FuncionarioDashboard'
import { ProjectDetailPage }     from './pages/projeto/ProjectDetailPage'
import { PerfilPage } from './pages/shared/PerfilPage'

interface ProtectedProps {
  allowed: boolean
  redirectTo?: To
  children: React.ReactElement
}

function Protected({ allowed, redirectTo = '/login', children }: ProtectedProps) {
  if (!allowed) return <Navigate to={redirectTo} replace />
  return children
}

function HomeRedirect() {
  const { isAuthenticated, role, senhaTemporaria } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login"          replace />
  if (senhaTemporaria)  return <Navigate to="/primeiro-acesso" replace />
  switch (role) {
    case 'MASTER':  return <Navigate to="/master"      replace />
    case 'GESTOR':  return <Navigate to="/gestor"      replace />
    case 'GERENTE': return <Navigate to="/gerente"     replace />
    default:        return <Navigate to="/funcionario" replace />
  }
}

export default function App() {
  const { isAuthenticated, role, senhaTemporaria } = useAuth()
  const auth   = isAuthenticated
  const noTemp = !senhaTemporaria

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/primeiro-acesso" element={
        <Protected allowed={auth}><ChangePasswordPage /></Protected>
      }/>

      <Route path="/master/*" element={
        <Protected allowed={auth && role === 'MASTER' && noTemp}>
          <MasterDashboard />
        </Protected>
      }/>

      <Route path="/gestor/*" element={
        <Protected allowed={auth && role === 'GESTOR' && noTemp}>
          <GestorDashboard />
        </Protected>
      }/>

      <Route path="/gerente/*" element={
        <Protected allowed={auth && role === 'GERENTE' && noTemp}>
          <GerenteDashboard />
        </Protected>
      }/>

      <Route path="/funcionario/*" element={
        <Protected allowed={auth && noTemp}>
          <FuncionarioDashboard />
        </Protected>
      }/>

      <Route path="/projetos/:id" element={
        <Protected allowed={auth && noTemp}>
          <ProjectDetailPage />
        </Protected>
      }/>

      <Route path="/perfil" element={
        <Protected allowed={auth && noTemp}>
          <PerfilPage />
        </Protected>
      } />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}