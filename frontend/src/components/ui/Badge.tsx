type Color = 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'gray'

const colors: Record<Color, string> = {
  amber:  'bg-accent/10 text-accent',
  green:  'bg-success/10 text-success',
  blue:   'bg-info/10 text-info',
  purple: 'bg-purple/10 text-purple',
  red:    'bg-danger/10 text-danger',
  gray:   'bg-bg-surface3 text-text-2',
}

export default function Badge({ color = 'gray', children }: { color?: Color; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export const productTypeBadge = (type: string) => {
  const map: Record<string, [Color, string]> = {
    MATERIE_PRIMA:   ['amber', '🪵 Materie Primă'],
    GATA_ASAMBLARE:  ['blue',  '📦 Kit Asamblare'],
    ASAMBLAT:        ['green', '🛋️ Asamblat'],
  }
  const [color, label] = map[type] || ['gray', type]
  return <Badge color={color}>{label}</Badge>
}

export const movementTypeBadge = (type: string) => {
  const map: Record<string, [Color, string]> = {
    RECEPTIE:  ['green',  '📥 Recepție'],
    PRODUCTIE: ['amber',  '⚙️ Producție'],
    VANZARE:   ['blue',   '📤 Vânzare'],
    TRANSFER:  ['purple', '🔄 Transfer'],
    DESEURI:   ['red',    '🗑️ Deșeuri'],
  }
  const [color, label] = map[type] || ['gray', type]
  return <Badge color={color}>{label}</Badge>
}

export const unitLabel = (unit: string) => {
  const map: Record<string, string> = { BUC: 'buc', MP: 'm²', ML: 'm.l.', KG: 'kg', M3: 'm³', L: 'l' }
  return map[unit] || unit
}