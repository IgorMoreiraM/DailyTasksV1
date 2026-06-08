import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types'
import {
  LayoutDashboard, Building2, Users, FolderKanban,
  CheckSquare, BarChart2, LogOut, User, Bot,
} from 'lucide-react'

type NavItem = { label: string; icon: React.ReactNode; to: string; exact?: boolean }

function getNavItems(role: UserRole | null): NavItem[] {
  switch (role) {
    case 'MASTER':
      return [
        { label: 'Dashboard',    icon: <LayoutDashboard size={15}/>, to: '/master',      exact: true },
        { label: 'Empresas',     icon: <Building2 size={15}/>,       to: '/master/empresas' },
        { label: 'Usuários',     icon: <Users size={15}/>,           to: '/master/usuarios' },
      ]
    case 'GESTOR':
      return [
        { label: 'Dashboard',    icon: <LayoutDashboard size={15}/>, to: '/gestor',      exact: true },
        { label: 'Projetos',     icon: <FolderKanban size={15}/>,    to: '/gestor/projetos' },
        { label: 'Funcionários', icon: <Users size={15}/>,           to: '/gestor/funcionarios' },
        { label: 'Tarefas',      icon: <CheckSquare size={15}/>,     to: '/gestor/tarefas' },
        { label: 'Relatórios',   icon: <BarChart2 size={15}/>,       to: '/gestor/relatorios' },
      ]
    case 'GERENTE':
      return [
        { label: 'Dashboard',      icon: <LayoutDashboard size={15}/>, to: '/gerente',     exact: true },
        { label: 'Meu Projeto',    icon: <FolderKanban size={15}/>,    to: '/gerente/projeto' },
        { label: 'Minhas Tarefas', icon: <CheckSquare size={15}/>,     to: '/gerente/tarefas' },
        { label: 'Relatórios',     icon: <BarChart2 size={15}/>,       to: '/gerente/relatorios' },
      ]
    default:
      return [
        { label: 'Dashboard',      icon: <LayoutDashboard size={15}/>, to: '/funcionario', exact: true },
        { label: 'Minhas Tarefas', icon: <CheckSquare size={15}/>,     to: '/funcionario/tarefas' },
      ]
  }
}

const ROLE_BADGE: Record<string, string> = {
  MASTER:      'bg-amber-500/20 border-amber-400/30 text-amber-300',
  GESTOR:      'bg-teal-500/20  border-teal-400/30  text-teal-300',
  GERENTE:     'bg-violet-500/20 border-violet-400/30 text-violet-300',
  FUNCIONARIO: 'bg-orange-500/20 border-orange-400/30 text-orange-300',
}

const ROLE_DOT: Record<string, string> = {
  MASTER:      'bg-amber-400',
  GESTOR:      'bg-teal-400',
  GERENTE:     'bg-violet-400',
  FUNCIONARIO: 'bg-orange-400',
}

export function Sidebar() {
  const { username, role, logout } = useAuth()
  const navigate  = useNavigate()
  const navItems  = getNavItems(role)

  const [foto, setFoto] = useState<string | null>(
    localStorage.getItem(`dt_foto_${username}`) ?? null
  )

  useEffect(() => {
    setFoto(localStorage.getItem(`dt_foto_${username}`) ?? null)
  }, [username])

  useEffect(() => {
    function atualizarFoto() {
      setFoto(localStorage.getItem(`dt_foto_${username}`) ?? null)
    }
    window.addEventListener('foto-atualizada', atualizarFoto)
    return () => window.removeEventListener('foto-atualizada', atualizarFoto)
  }, [username])

  return (
    <aside
      className="flex flex-col h-screen border-r border-white/[0.06] flex-shrink-0"
      style={{ width: 'var(--sidebar-width)', background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-white/[0.07] flex-shrink-0">
        <svg width="30" height="30" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="10" fill="rgba(255,255,255,0.08)"/>
          <rect width="44" height="44" rx="10" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
          <path d="M12 22C12 15.373 17.373 10 24 10H28C30.761 10 33 12.239 33 15V29C33 31.761 30.761 34 28 34H24C17.373 34 12 28.627 12 22Z"
            stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
          <path d="M18 22L21 25L28 18" stroke="#fb923c" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M26 11L32 17" stroke="#fb923c" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="font-display font-bold text-[17px] text-white tracking-tight">
          Daily<span className="text-brand-orange">Tasks</span>
        </span>
      </div>

      {/* Badge do papel */}
      {role && (
        <div className={`mx-3 mt-3 mb-1 flex items-center gap-2 border rounded-xl px-3 py-2 flex-shrink-0 ${ROLE_BADGE[role]}`}>
          <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${ROLE_DOT[role]}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{role}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scroll">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 pt-3 pb-1.5">
          Menu
        </p>
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-all border-l-2 ${
                  isActive
                    ? 'bg-white/[0.1] border-brand-teal-mid text-white font-semibold'
                    : 'border-transparent text-white/45 hover:bg-white/[0.05] hover:text-white/80'
                }`
              }
            >
              <span className="flex-shrink-0 opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Seção Conta */}
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2 pt-5 pb-1.5">
          Conta
        </p>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => navigate('/perfil')}
            className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] font-medium text-white/45 border-l-2 border-transparent hover:bg-white/[0.05] hover:text-white/80 transition-all"
          >
            <User size={15} className="opacity-80 flex-shrink-0" />
            Meu Perfil
          </button>
          <button
            onClick={() => navigate('/configuracoes')}
            className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] font-medium border-l-2 border-transparent hover:bg-white/[0.05] transition-all"
            style={{ color: 'rgba(56,189,248,0.6)' }}
          >
            <Bot size={15} className="opacity-80 flex-shrink-0" />
            Bot Telegram
          </button>
        </div>
      </nav>

      {/* Perfil rodapé — div externa, dois botões separados dentro */}
      <div className="border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5 px-4 py-3.5">

          {/* Botão de perfil — avatar + nome */}
          <button
            onClick={() => navigate('/perfil')}
            className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
          >
            <div
              className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: '#2a7a8a' }}
            >
              {foto ? (
                <img src={foto} alt="foto" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-white/85 truncate">{username ?? '—'}</p>
              <p className="text-[11px] text-white/30">{role}</p>
            </div>
          </button>

          {/* Botão de logout — separado, nunca aninhado */}
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            title="Sair"
            className="text-white/25 hover:text-white/70 hover:bg-white/[0.07] p-1.5 rounded-lg transition-all flex-shrink-0"
          >
            <LogOut size={15} />
          </button>

        </div>
      </div>
    </aside>
  )
}