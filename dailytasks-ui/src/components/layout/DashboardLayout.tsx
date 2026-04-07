import { Sidebar } from './Sidebar'
import { Topbar }  from './Topbar'

interface DashboardLayoutProps {
  breadcrumb?: string
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayout({ breadcrumb, title, actions, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar breadcrumb={breadcrumb} title={title} actions={actions} />

        <main
          className="flex-1 overflow-y-auto custom-scroll p-7"
          style={{ background: 'var(--bg-page)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}