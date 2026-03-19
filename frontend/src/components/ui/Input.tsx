import { InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-2 tracking-wide">{label}</label>}
    <input
      ref={ref}
      {...props}
      className={`w-full bg-bg-surface2 border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-3 outline-none transition-colors focus:border-accent ${error ? 'border-danger' : 'border-border-2'} ${className}`}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
))
Input.displayName = 'Input'
export default Input