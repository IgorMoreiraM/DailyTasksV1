import { useState } from 'react'
import { Bell, Search, Sun, Moon } from 'lucide-react'

interface TopbarProps {
  breadcrumb?: string
  title: string
  actions?: React.ReactNode
}

export function Topbar({ breadcrumb, title, actions }: TopbarProps) {
  // Inicializa lendo o estado real do DOM — já aplicado pelo script do index.html
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )

  function toggleDark() {
    const isDark = document.documentElement.classList.toggle('dark')
    setDark(isDark)
    // Persiste no localStorage com a chave que o script do index.html lê
    localStorage.setItem('dt_tema', isDark ? 'dark' : 'light')
  }

  return (
    <header
      className="flex items-center justify-between px-7 flex-shrink-0 border-b"
      style={{
        height:      'var(--topbar-height)',
        background:  'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex flex-col">
        {breadcrumb && (
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {breadcrumb}
          </span>
        )}
        <h1
          className="font-display font-bold text-[18px] tracking-tight leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="hidden md:flex items-center gap-2 px-3.5 h-9 rounded-xl border transition-all focus-within:border-brand-teal focus-within:shadow-[0_0_0_3px_rgba(42,122,138,0.1)]"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none w-36"
            style={{ color: 'var(--text-primary)', fontSize: '13px' }}
          />
        </div>

        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:border-brand-teal/40"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-brand-orange rounded-full border-2 border-white" />
        </button>

        <button
          onClick={toggleDark}
          title={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:border-brand-teal/40"
          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {actions}
      </div>
    </header>
  )
}