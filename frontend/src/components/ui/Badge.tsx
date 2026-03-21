import { ReactNode } from 'react'
import {
  PRODUCT_TYPE_ICONS,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_COLORS,
  MOVEMENT_TYPE_ICONS,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLORS,
  UNIT_LABELS,
} from '../../lib/icons'

type Color = 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'gray'

const colors: Record<Color, string> = {
  amber:  'bg-accent/10 text-accent',
  green:  'bg-success/10 text-success',
  blue:   'bg-info/10 text-info',
  purple: 'bg-purple/10 text-purple',
  red:    'bg-danger/10 text-danger',
  gray:   'bg-bg-surface3 text-text-2',
}

export default function Badge({ color = 'gray', children }: { color?: Color; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export const productTypeBadge = (type: string) => {
  const color = (PRODUCT_TYPE_COLORS[type] || 'gray') as Color
  const label = `${PRODUCT_TYPE_ICONS[type] || ''} ${PRODUCT_TYPE_LABELS[type] || type}`
  return <Badge color={color}>{label}</Badge>
}

export const movementTypeBadge = (type: string) => {
  const color = (MOVEMENT_TYPE_COLORS[type] || 'gray') as Color
  const label = `${MOVEMENT_TYPE_ICONS[type] || ''} ${MOVEMENT_TYPE_LABELS[type] || type}`
  return <Badge color={color}>{label}</Badge>
}

export const unitLabel = (unit: string): string => UNIT_LABELS[unit] || unit