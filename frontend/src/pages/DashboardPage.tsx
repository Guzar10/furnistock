import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import KpiCard from '../components/ui/KpiCard'
import { getProducts } from '../api/products'
import { getWarehouses, getWarehouseSummary } from '../api/warehouses'
import { getMovements } from '../api/movements'
import { movementTypeBadge } from '../components/ui/Badge'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: products   = [] } = useQuery({ queryKey: ['products'],         queryFn: getProducts })
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'],        queryFn: getWarehouses })
  const { data: movements  = [] } = useQuery({ queryKey: ['movements'],         queryFn: () => getMovements({ limit: 10 }) })
  const { data: summary    = [] } = useQuery({ queryKey: ['stock-summary'],     queryFn: getWarehouseSummary })

  const activeProducts = products.filter(p => (p.stock || []).some(s => s.quantity > 0)).length
  const lowStock = products.filter(p => {
    const total = (p.stock || []).reduce((s, st) => s + st.quantity, 0)
    return total > 0 && total < 15
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-light text-text">Dashboard</h1>
        <p className="text-sm text-text-3 mt-1">Bun venit în FurniStock</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Produse Catalog"  value={products.length}   sub={`${activeProducts} cu stoc activ`} accent="amber" />
        <KpiCard label="Hale & Depozite"  value={warehouses.length} sub="locații active"                    accent="green" />
        <KpiCard label="Mișcări Total"    value={movements.length}  sub="înregistrate"                     accent="blue"  />
        <KpiCard label="Alertă Stoc"      value={lowStock.length}   sub="produse sub 15 unități"            accent={lowStock.length > 0 ? 'red' : 'green'} />
      </div>

      {/* Alert */}
      {lowStock.length > 0 && (
        <div className="flex items-center justify-between bg-danger/5 border border-danger/15 rounded-xl px-5 py-3.5 mb-5">
          <p className="text-sm text-text-2">
            ⚠️ <strong className="text-danger">{lowStock.length} {lowStock.length > 1 ? 'produse au' : 'produs are'}</strong> stoc redus:{' '}
            {lowStock.slice(0, 3).map(p => p.name).join(', ')}
            {lowStock.length > 3 && ` +${lowStock.length - 3} altele`}
          </p>
          <button onClick={() => navigate('/stock')} className="text-xs bg-danger/10 text-danger px-3 py-1.5 rounded-md hover:bg-danger/20 transition-colors whitespace-nowrap ml-4">
            Vezi stoc →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Mișcări recente */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">Mișcări Recente</span>
            <button onClick={() => navigate('/movements')} className="text-xs text-text-3 hover:text-accent transition-colors">Toate →</button>
          </div>
          <div className="flex flex-col gap-1">
            {movements.slice(0, 8).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  {movementTypeBadge(m.type)}
                  <span className="text-xs text-text-2 truncate max-w-32">
                    {m.lines?.[0] ? (m.lines[0].product?.name || '—') : '—'}
                    {m.lines?.length > 1 && ` +${m.lines.length - 1}`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-3">
                  {new Date(m.date).toLocaleDateString('ro-RO')}
                </span>
              </div>
            ))}
            {movements.length === 0 && <p className="text-sm text-text-3 text-center py-4">Nicio mișcare încă</p>}
          </div>
        </div>

        {/* Sumar hale */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">Sumar Hale</span>
            <button onClick={() => navigate('/warehouses')} className="text-xs text-text-3 hover:text-accent transition-colors">Toate →</button>
          </div>
          <div className="flex flex-col gap-2">
            {summary.map(w => (
              <div key={w.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="font-mono text-[11px] bg-bg-surface3 px-2 py-0.5 rounded text-text-2 min-w-8 text-center">{w.code}</span>
                <span className="flex-1 text-sm text-text truncate">{w.name}</span>
                <span className="font-mono text-sm text-accent font-medium">{w.productCount}</span>
                <span className="text-xs text-text-3">prod.</span>
              </div>
            ))}
            {summary.length === 0 && <p className="text-sm text-text-3 text-center py-4">Nicio hală configurată</p>}
          </div>
        </div>
      </div>
    </div>
  )
}