type Accent = 'amber' | 'green' | 'blue' | 'red'

const accents: Record<Accent, string> = {
  amber: 'from-accent to-accent/50',
  green: 'from-success to-success/50',
  blue:  'from-info to-info/50',
  red:   'from-danger to-danger/50',
}

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: Accent
}

export default function KpiCard({ label, value, sub, accent = 'amber' }: Props) {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5 relative overflow-hidden hover:border-border-2 transition-colors">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accents[accent]}`} />
      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-3">{label}</div>
      <div className="font-mono text-3xl font-medium text-text leading-none mb-1">{value}</div>
      {sub && <div className="text-xs text-text-3 mt-1">{sub}</div>}
    </div>
  )
}