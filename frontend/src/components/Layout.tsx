import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'

const nav = [
  { to: '/dashboard',  label: 'Dashboard',      icon: '▦' },
  { to: '/products',   label: 'Produse',         icon: '⬡' },
  { to: '/warehouses', label: 'Hale & Depozite', icon: '⬢' },
  { to: '/stock',      label: 'Stoc Curent',     icon: '≡' },
  { to: '/movements',  label: 'Mișcări Stoc',    icon: '⇄' },
]

export default function Layout() {
  const { user, clearAuth }    = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate               = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
  await clearAuth()
  navigate('/login')
}
  const closeSidebar = () => setSidebarOpen(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <div className="font-serif text-xl font-semibold text-text">
          Furni<span className="text-accent">Stock</span>
        </div>
        <div className="text-xs text-text-3 uppercase tracking-widest mt-1">
          Gestiune Stocuri
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-3">
          Principal
        </div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-2.5 mx-2 px-3 py-2 my-0.5 rounded-md text-sm transition-all border ${
                isActive
                  ? 'bg-accent/10 text-accent border-accent/20 font-medium'
                  : 'text-text-2 border-transparent hover:bg-bg-surface2 hover:text-text'
              }`
            }
          >
            <span className="text-base w-4 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-3">
              Admin
            </div>
            <NavLink
              to="/users"
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2.5 mx-2 px-3 py-2 my-0.5 rounded-md text-sm transition-all border ${
                  isActive
                    ? 'bg-accent/10 text-accent border-accent/20 font-medium'
                    : 'text-text-2 border-transparent hover:bg-bg-surface2 hover:text-text'
                }`
              }
            >
              <span className="text-base w-4 text-center">◎</span>
              Utilizatori
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-text-2 font-medium truncate">{user?.name}</div>
        <div className="text-[11px] text-text-3 mb-3 truncate">{user?.email}</div>
        <div className="flex items-center justify-between mb-3">
          <RoleBadge role={user?.role} />
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-surface2 border border-border hover:border-border-2 transition-all text-text-2 hover:text-text text-xs"
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-xs text-text-3 hover:text-danger transition-colors text-left"
        >
          → Deconectare
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      {/* ── SIDEBAR DESKTOP (md+) ── */}
      <aside className="hidden md:flex w-56 min-w-56 flex-col border-r border-border bg-bg-surface">
        <SidebarContent />
      </aside>

      {/* ── SIDEBAR MOBILE overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 flex flex-col bg-bg-surface border-r border-border z-50 transform transition-transform duration-250 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-text-2 hover:text-text hover:bg-bg-surface2 transition-colors text-lg"
          >
            ☰
          </button>
          <span className="font-serif text-lg font-semibold text-text">
            Furni<span className="text-accent">Stock</span>
          </span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-2 hover:text-text hover:bg-bg-surface2 transition-colors text-sm"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function RoleBadge({ role }: { role?: string }) {
  const map: Record<string, string> = {
    ADMIN:    'bg-danger/10 text-danger',
    MANAGER:  'bg-accent/10 text-accent',
    OPERATOR: 'bg-info/10 text-info',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[role || ''] || 'bg-bg-surface3 text-text-3'}`}>
      {role}
    </span>
  )
}