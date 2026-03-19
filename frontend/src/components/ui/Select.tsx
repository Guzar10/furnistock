import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

const Select = forwardRef<HTMLSelectElement, Props>(({ label, children, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-text-2 tracking-wide">{label}</label>}
    <select
      ref={ref}
      {...props}
      className={`w-full bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent appearance-none cursor-pointer ${className}`}
    >
      {children}
    </select>
  </div>
))
Select.displayName = 'Select'
export default Select