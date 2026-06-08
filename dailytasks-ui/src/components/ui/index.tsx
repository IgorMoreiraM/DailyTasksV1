import type { TaskStatus, UserRole } from '../../types'
import { STATUS_LABEL, STATUS_COLOR, STATUS_DOT, ROLE_LABEL, ROLE_COLOR } from '../../types'
import { X } from 'lucide-react'

/* ── StatCard ── */
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  accentColor?: string
  iconBg?: string
  trend?: { value: string; up: boolean }
  delay?: string
}

export function StatCard({
  label, value, sub, icon,
  accentColor = 'bg-brand-teal',
  iconBg = 'bg-brand-teal-subtle',
  trend, delay = '0s',
}: StatCardProps) {
  return (
    <div
      className="rounded-2xl border p-5 relative overflow-hidden animate-slide-up transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', animationDelay: delay }}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl ${accentColor}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="font-display font-extrabold text-[30px] leading-none tracking-tight mb-1"
        style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      {sub && (
        <p className="text-[11.5px] mt-2 pt-2 border-t"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)' }}
          dangerouslySetInnerHTML={{ __html: sub }}
        />
      )}
    </div>
  )
}

/* ── StatusBadge ── */
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[status]}`}>
      <span className={`w-[5px] h-[5px] rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

/* ── RoleBadge ── */
export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${ROLE_COLOR[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  )
}

/* ── Avatar ── */
interface AvatarProps {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  foto?: string | null
  username?: string
}

const AVATAR_COLORS = [
  '#2a7a8a', '#7c3aed', '#f97316', '#059669',
  '#dc2626', '#0ea5e9', '#d97706', '#e11d48',
]

export function Avatar({ name, color, size = 'md', foto, username }: AvatarProps) {
  const initials = name?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'
  const bg = color ?? AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
  const sizeClass = {
    sm: 'w-7 h-7 text-[9px]',
    md: 'w-9 h-9 text-[11px]',
    lg: 'w-11 h-11 text-[13px]',
  }[size]

  const fotoLocal = username ? localStorage.getItem(`dt_foto_${username}`) : null
  const fotoFinal = foto || fotoLocal || null

  if (fotoFinal) return (
    <img src={fotoFinal} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />
  )

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-display font-bold flex-shrink-0`}
      style={{ background: bg, color: '#ffffff' }}
    >
      {initials}
    </div>
  )
}

/* ── Btn ── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
  icon?: React.ReactNode
}

export function Btn({
  variant = 'primary', size = 'md', loading,
  icon, children, className = '', style, ...props
}: BtnProps) {
  const sizeClass = size === 'sm'
    ? 'h-8 px-3 text-xs gap-1.5'
    : 'h-9 px-4 text-sm gap-2'

  // Estilos por variante via style inline para evitar conflito com variáveis CSS
  const variantStyle = (() => {
    switch (variant) {
      case 'primary':
        return {
          background:  'var(--brand-teal, #2a7a8a)',
          color:       '#ffffff',
          boxShadow:   '0 1px 3px rgba(42,122,138,0.2)',
        }
      case 'secondary':
        return {
          background:  'var(--bg-subtle)',
          border:      '1px solid var(--border-strong)',
          color:       'var(--text-primary)',
        }
      case 'ghost':
        return {
          background:  'transparent',
          color:       'var(--brand-teal, #2a7a8a)',
        }
      case 'danger':
        return {
          background:  '#dc2626',
          color:       '#ffffff',
        }
    }
  })()

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl transition-all
        ${sizeClass}
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:opacity-90
        ${className}
      `}
      style={{ ...variantStyle, ...style }}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : icon}
      {children}
    </button>
  )
}

/* ── Card ── */
interface CardProps {
  children: React.ReactNode
  className?: string
  delay?: string
}

export function Card({ children, className = '', delay }: CardProps) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden animate-slide-up ${className}`}
      style={{
        background:     'var(--bg-surface)',
        borderColor:    'var(--border-default)',
        animationDelay: delay,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 border-b ${className}`}
      style={{ borderColor: 'var(--border-default)' }}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>
      {children}
    </p>
  )
}

/* ── Modal ── */
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full ${width} rounded-2xl p-6 shadow-2xl animate-scale-in`}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-[17px]" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── FormField ── */
interface FormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
}

export function FormField({ label, children, error }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  )
}

/* ── inputClass e inputStyle ── */
export const inputClass = `
  w-full h-10 px-3.5 rounded-xl border text-[13.5px] outline-none transition-all
  focus:shadow-[0_0_0_3px_rgba(42,122,138,0.12)]
`

export const inputStyle = {
  background:  'var(--bg-subtle)',
  borderColor: 'var(--border-default)',
  color:       'var(--text-primary)',
} as React.CSSProperties

/* ── EmptyState ── */
export function EmptyState({
  icon, message, sub,
}: {
  icon: React.ReactNode
  message: string
  sub?: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="mb-3" style={{ color: 'var(--border-strong)' }}>{icon}</div>
      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {sub && (
        <p className="text-[11.5px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{sub}</p>
      )}
    </div>
  )
}

/* ── Spinner ── */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width:          size,
        height:         size,
        borderColor:    'var(--border-default)',
        borderTopColor: '#2a7a8a',
      }}
    />
  )
}

/* ── ProgressBar ── */
export function ProgressBar({ pct, color = '#2a7a8a' }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  )
}