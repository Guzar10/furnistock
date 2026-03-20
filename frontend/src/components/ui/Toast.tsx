import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id:      string
  message: string
  type:    ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export const useToast = () => useContext(ToastContext)

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

const colors: Record<ToastType, string> = {
  success: 'border-l-success text-success',
  error:   'border-l-danger  text-danger',
  info:    'border-l-info    text-info',
  warning: 'border-l-accent  text-accent',
}

const bgColors: Record<ToastType, string> = {
  success: 'bg-success/5',
  error:   'bg-danger/5',
  info:    'bg-info/5',
  warning: 'bg-accent/5',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10)
    // Animate out
    const t2 = setTimeout(() => setVisible(false), 3200)
    // Remove
    const t3 = setTimeout(() => onRemove(toast.id), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [toast.id, onRemove])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 border border-border-2 shadow-lg min-w-64 max-w-sm transition-all duration-300 ${colors[toast.type]} ${bgColors[toast.type]} bg-bg-surface ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="text-sm font-bold mt-0.5 shrink-0">{icons[toast.type]}</span>
      <p className="text-sm text-text flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-text-3 hover:text-text transition-colors text-xs shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}