import { ReactNode, useEffect } from 'react'
import Button from './Button'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export default function Modal({ open, onClose, title, children, footer, wide }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-bg-surface border-t sm:border border-border-2 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col w-full sm:max-h-[90vh] ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92vh]`}>
        {/* Handle bar mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border-2" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif text-xl font-medium text-text">{title}</h2>
          <button onClick={onClose} className="text-text-3 hover:text-text transition-colors text-lg w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-surface2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}