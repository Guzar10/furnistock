import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { usePageTitle } from '../hooks/usePageTitle'
import { useSocket } from '../hooks/useSocket'
import Modal from './ui/Modal'
import Button from './ui/Button'
import NotificationBell from './NotificationBell'
import api from '../api/client'

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

  usePageTitle()
  useSocket()

  // Schimbare parolă
  const [pwOpen,    setPwOpen]    = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError,   setPwError]   = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const handleLogout = async () => { await clearAuth(); navigate('/login') }
  const closeSidebar = () => setSidebarOpen(false)

  const openPwModal = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setPwError(''); setPwSuccess(false)
    setPwOpen(true)
  }

  const handleChangePw = async () => {
    setPwError('')
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Completează toate câmpurile'); return
    }
    if (newPw !== confirmPw) {
      setPwError('Parolele noi nu coincid'); return
    }
    if (newPw.length < 8) {
      setPwError('Parola nouă trebuie să aibă minim 8 caractere'); return
    }
    if (!/[A-Z]/.test(newPw)) {
      setPwError('Parola nouă trebuie să conțină cel puțin o literă mare'); return
    }
    if (!/[0-9]/.test(newPw)) {
      setPwError('Parola nouă trebuie să conțină cel puțin o cifră'); return
    }
    setPwLoading(true)
    try {
      await api.put('/auth/change-password', { currentPassword: currentPw, newPassword: newPw })
      setPwSuccess(true)
      setTimeout(() => setPwOpen(false), 1500)
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Eroare la schimbarea parolei')
    } finally {
      setPwLoading(false)
    }
  }

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
        <div className="flex items-center justify-between mb-2">
          <RoleBadge role={user?.role} />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-surface2 border border-border hover:border-border-2 transition-all text-text-2 hover:text-text text-xs"
            >
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
        </div>
        <button
          onClick={openPwModal}
          className="w-full text-xs text-text-3 hover:text-accent transition-colors text-left mb-1.5"
        >
          🔑 Schimbă parola
        </button>
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

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 min-w-56 flex-col border-r border-border bg-bg-surface">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 flex flex-col bg-bg-surface border-r border-border z-50 transform transition-transform duration-250 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
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
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-text-2 hover:text-text hover:bg-bg-surface2 transition-colors text-sm"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg">
          <Outlet />
        </div>
      </main>

      {/* Modal schimbare parolă */}
      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Schimbă Parola"
        footer={!pwSuccess ? <>
          <Button variant="ghost" onClick={() => setPwOpen(false)}>Anulează</Button>
          <Button variant="primary" onClick={handleChangePw} disabled={pwLoading}>
            {pwLoading ? 'Se salvează...' : '🔑 Schimbă parola'}
          </Button>
        </> : undefined}
      >
        {pwSuccess ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-medium text-success">Parola a fost schimbată cu succes!</p>
            <p className="text-xs text-text-3 mt-1">Modalul se închide automat...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-bg-surface2 border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-text-3 mb-0.5">Cont</p>
              <p className="text-sm font-medium text-text">{user?.name}</p>
              <p className="text-xs text-text-2 font-mono">{user?.email}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-2">Parola curentă *</label>
              <input
                type="password" value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="Parola ta actuală"
                className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-2">Parola nouă *</label>
              <input
                type="password" value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 8 caractere, o literă mare, o cifră"
                className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-2">Confirmă parola nouă *</label>
              <input
                type="password" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repetă parola nouă"
                className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>

            {/* Indicator putere parolă */}
            {newPw.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[
                    newPw.length >= 8,
                    /[A-Z]/.test(newPw),
                    /[0-9]/.test(newPw),
                    /[^A-Za-z0-9]/.test(newPw),
                  ].map((ok, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? 'bg-success' : 'bg-border-2'}`} />
                  ))}
                </div>
                <div className="flex flex-col gap-0.5">
                  {[
                    [newPw.length >= 8,           'Minim 8 caractere'],
                    [/[A-Z]/.test(newPw),         'Cel puțin o literă mare'],
                    [/[0-9]/.test(newPw),         'Cel puțin o cifră'],
                    [/[^A-Za-z0-9]/.test(newPw),  'Caracter special (bonus)'],
                  ].map(([ok, label]: any) => (
                    <span key={label} className={`text-[11px] ${ok ? 'text-success' : 'text-text-3'}`}>
                      {ok ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pwError && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                {pwError}
              </div>
            )}
          </div>
        )}
      </Modal>
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