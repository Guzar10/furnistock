import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getProducts, getProductHistory } from '../api/products'
import { movementTypeBadge, unitLabel } from '../components/ui/Badge'
import Button from '../components/ui/Button'

const movLabel = (t: string) => ({
  RECEPTIE: '+', PRODUCTIE: '±', VANZARE: '-',
  TRANSFER: '→', DESEURI: '-', INVENTARIERE: '=',
}[t] || '?')

const movColor = (t: string) => ({
  RECEPTIE:     'text-success',
  PRODUCTIE:    'text-accent',
  VANZARE:      'text-info',
  TRANSFER:     'text-purple',
  DESEURI:      'text-danger',
  INVENTARIERE: 'text-text-2',
}[t] || 'text-text-2')

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-surface border border-border-2 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-2 mb-1">{label}</p>
      <p className="text-text font-medium">Stoc: <span className="text-accent font-mono">{payload[0]?.value}</span></p>
    </div>
  )
}

export default function ProductHistoryPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const { data: history  = [], isLoading } = useQuery({
    queryKey: ['product-history', id],
    queryFn:  () => getProductHistory(id!),
    enabled:  !!id,
  })

  const product = products.find((p: any) => p.id === id)

  // Calculează evoluția stocului în timp (de la vechi la nou)
  const chronological = [...history].reverse()
  let runningStock = 0
  const stockEvolution = chronological.map((line: any) => {
    const type = line.movement.type
    if (type === 'RECEPTIE' || (type === 'PRODUCTIE' && line.toWarehouseId)) {
      runningStock += line.quantity
    } else if (type === 'VANZARE' || type === 'DESEURI' || (type === 'PRODUCTIE' && line.fromWarehouseId)) {
      runningStock = Math.max(0, runningStock - line.quantity)
    } else if (type === 'INVENTARIERE') {
      // Nu schimbă running stock — e o ajustare punctuală
    }
    return {
      date:  new Date(line.movement.date).toLocaleDateString('ro-RO'),
      stoc:  runningStock,
      type:  type,
    }
  })

  const totalIn  = history.filter((l: any) => ['RECEPTIE'].includes(l.movement.type) || (l.movement.type === 'PRODUCTIE' && l.toWarehouseId)).reduce((s: number, l: any) => s + l.quantity, 0)
  const totalOut = history.filter((l: any) => ['VANZARE', 'DESEURI'].includes(l.movement.type) || (l.movement.type === 'PRODUCTIE' && l.fromWarehouseId)).reduce((s: number, l: any) => s + l.quantity, 0)
  const stocCurent = (product?.stock || []).reduce((s: number, st: any) => s + st.quantity, 0)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
          ← Înapoi
        </Button>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-light">
            {product?.name || 'Produs'}
          </h1>
          <p className="text-sm text-text-3 mt-0.5">
            Istoric complet mișcări
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Stoc Curent',    value: stocCurent, color: 'text-accent',  accent: 'from-accent to-accent/50' },
          { label: 'Total Intrat',   value: totalIn,    color: 'text-success', accent: 'from-success to-success/50' },
          { label: 'Total Ieșit',    value: totalOut,   color: 'text-danger',  accent: 'from-danger to-danger/50' },
          { label: 'Nr. Mișcări',    value: history.length, color: 'text-info', accent: 'from-info to-info/50' },
        ].map(k => (
          <div key={k.label} className="bg-bg-surface border border-border rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${k.accent}`} />
            <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-2">{k.label}</div>
            <div className={`font-mono text-2xl font-medium ${k.color}`}>{k.value}</div>
            {product && <div className="text-xs text-text-3 mt-1">{unitLabel(product.unit)}</div>}
          </div>
        ))}
      </div>

      {/* Grafic evoluție stoc */}
      {stockEvolution.length > 1 && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-4">
            Evoluție Stoc în Timp
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stockEvolution} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C8963E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C8963E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="stoc" stroke="#C8963E" strokeWidth={2} fill="url(#stockGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Locații curente */}
      {product && (product.stock || []).filter((s: any) => s.quantity > 0).length > 0 && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-3">
            Locații Curente
          </div>
          <div className="flex flex-wrap gap-3">
            {(product.stock || []).filter((s: any) => s.quantity > 0).map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 bg-bg-surface2 border border-border rounded-lg px-3 py-2">
                <span className="font-mono text-[10px] bg-bg-surface3 px-1.5 py-0.5 rounded text-text-2">{s.warehouse?.code}</span>
                <span className="text-sm text-text">{s.warehouse?.name}</span>
                <span className="font-mono text-accent font-medium">{s.quantity}</span>
                <span className="text-xs text-text-3">{unitLabel(product.unit)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabel mișcări */}
      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">
            Toate Mișcările
          </span>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-text-3">Se încarcă...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-14 text-text-3">
            <div className="text-4xl mb-3 opacity-20">📋</div>
            <p className="text-sm text-text-2">Nicio mișcare înregistrată pentru acest produs</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Data', 'Tip', 'Cantitate', 'Din Hală', 'Spre Hală', 'Referință', 'Operator'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((line: any) => (
                    <tr key={line.id} className="border-b border-border hover:bg-bg-surface2 transition-colors last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-text-2 whitespace-nowrap">
                        {new Date(line.movement.date).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-4 py-3">{movementTypeBadge(line.movement.type)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-base font-medium ${movColor(line.movement.type)}`}>
                          {movLabel(line.movement.type)}{line.quantity} {unitLabel(product?.unit || '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-2">{line.fromWarehouseId || '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-2">{line.toWarehouseId   || '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-2">{line.movement.note   || '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-2">{line.movement.user?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-border">
              {history.map((line: any) => (
                <div key={line.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    {movementTypeBadge(line.movement.type)}
                    <span className="font-mono text-xs text-text-3">
                      {new Date(line.movement.date).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-base font-medium ${movColor(line.movement.type)}`}>
                      {movLabel(line.movement.type)}{line.quantity} {unitLabel(product?.unit || '')}
                    </span>
                    <span className="text-xs text-text-2">{line.movement.user?.name}</span>
                  </div>
                  {line.movement.note && (
                    <span className="text-xs text-text-3">{line.movement.note}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}