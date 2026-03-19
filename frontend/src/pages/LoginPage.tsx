import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login } from '../api/auth'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const setAuth  = useAuthStore(s => s.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare de conectare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-text mb-2">
            Furni<span className="text-accent">Stock</span>
          </h1>
          <p className="text-sm text-text-3">Gestiune Stocuri Mobilier</p>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-6 md:p-8">
          <h2 className="text-lg font-medium text-text mb-5">Autentificare</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-2">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@furnistock.ro" required
                className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2.5 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-2">Parolă</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2.5 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="mt-1 bg-accent text-bg font-medium py-2.5 rounded-md text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Se conectează...' : 'Intră în cont'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-text-3 mt-5">
          admin@furnistock.ro · admin123
        </p>
      </div>
    </div>
  )
}