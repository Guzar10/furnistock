import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import KpiCard from '../components/ui/KpiCard'
import { getProducts } from '../api/products'
import { getWarehouseSummary } from '../api/warehouses'
import { getMovements } from '../api/movements'
import { getMovementsByDay, getStockByType, getTopProducts, getMovementsByType } from '../api/stats'
import { movementTypeBadge, unitLabel } from '../components/ui/Badge'

const CHART_COLORS = {
  RECEPTIE:     '#4CAF7D',
  PRODUCTIE:    '#C8963E',
  VANZARE:      '#5A9FD4',
  TRANSFER:     '#9B72CF',
  DESEURI:      '#E05555',
  INVENTARIERE: '#68655F',
}

const fmtDate = (d: string) => {
  const [, m, day] = d.split('-')
  return `${day}.${m}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-surface border border-border-2 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-2 mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-2">{p.name}:</span>
          <span className="text-text font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-surface border border-border-2 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text font-medium">{payload[0].name}</p>
      <p className="text-text-2">{payload[0].value} unități</p>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [chartDays, setChartDays] = useState(30)

  const { data: products        = [] } = useQuery({ queryKey: ['products'],            queryFn: getProducts })
  const { data: summary         = [] } = useQuery({ queryKey: ['stock-summary'],        queryFn: getWarehouseSummary })
  const { data: recentMovements = [] } = useQuery({ queryKey: ['movements-recent'],     queryFn: () => getMovements({ limit: 8 }) })
  const { data: movsByDay       = [] } = useQuery({ queryKey: ['stats-mov-day', chartDays], queryFn: () => getMovementsByDay(chartDays) })
  const { data: stockByType     = [] } = useQuery({ queryKey: ['stats-stock-type'],     queryFn: getStockByType })
  const { data: topProducts     = [] } = useQuery({ queryKey: ['stats-top-prod'],       queryFn: getTopProducts })
  const { data: movsByType      = [] } = useQuery({ queryKey: ['stats-mov-type'],       queryFn: getMovementsByType })

  const activeProducts = products.filter(p => (p.stock || []).some(s => s.quantity > 0)).length
  const lowStock       = products.filter(p => p.minStock > 0 && (p.stock || []).reduce((s, st) => s + st.quantity, 0) < p.minStock)

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-serif text-2xl md:text-3xl font-light text-text">Dashboard</h1>
        <p className="text-sm text-text-3 mt-1">Bun venit în FurniStock</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Produse Catalog"  value={products.length}   sub={`${activeProducts} cu stoc activ`} accent="amber" />
        <KpiCard label="Hale & Depozite"  value={summary.length}    sub="locații active"                    accent="green" />
        <KpiCard label="Mișcări Recente"  value={recentMovements.length} sub="ultimele înregistrate"        accent="blue"  />
        <KpiCard label="Alertă Stoc"      value={lowStock.length}   sub="produse sub minim"                 accent={lowStock.length > 0 ? 'red' : 'green'} />
      </div>

      {lowStock.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-danger/5 border border-danger/15 rounded-xl px-4 py-3 mb-5 gap-3">
          <p className="text-sm text-text-2">
            ⚠️ <strong className="text-danger">{lowStock.length} {lowStock.length > 1 ? 'produse au' : 'produs are'}</strong> stocul sub minimul configurat:{' '}
            {lowStock.slice(0, 3).map(p => p.name).join(', ')}
            {lowStock.length > 3 && ` +${lowStock.length - 3} altele`}
          </p>
          <button onClick={() => navigate('/products')}
            className="text-xs bg-danger/10 text-danger px-3 py-1.5 rounded-md hover:bg-danger/20 transition-colors whitespace-nowrap self-start sm:self-auto">
            Vezi produse →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">Activitate Zilnică</span>
            <div className="flex gap-1">
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setChartDays(d)}
                  className={`text-xs px-2 py-1 rounded transition-all ${chartDays === d ? 'bg-accent/10 text-accent border border-accent/30' : 'text-text-3 hover:text-text'}`}>
                  {d}z
                </button>
              ))}
            </div>
          </div>
          {movsByDay.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-3 text-sm">Nicio activitate în perioada selectată</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={movsByDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  {Object.entries(CHART_COLORS).map(([key, color]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(CHART_COLORS).map(([key, color]) => (
                  <Area key={key} type="monotone" dataKey={key}
                    name={key.charAt(0) + key.slice(1).toLowerCase()}
                    stroke={color} strokeWidth={1.5} fill={`url(#grad-${key})`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-4">Mișcări Luna Curentă</div>
          {movsByType.every((m: any) => m.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-text-3 text-sm">Nicio mișcare luna aceasta</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={movsByType} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {movsByType.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {movsByType.filter((m: any) => m.value > 0).map((m: any) => (
                  <div key={m.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                      <span className="text-text-2">{m.name}</span>
                    </div>
                    <span className="font-mono font-medium text-text">{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-bg-surface border border-border rounded-xl p-5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-4">Top Produse în Stoc</div>
          {topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-3 text-sm">Niciun stoc înregistrat</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-2)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Cantitate" radius={[0, 4, 4, 0]} fill="#C8963E" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mb-4">Stoc pe Categorie</div>
          {stockByType.every((s: any) => s.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-text-3 text-sm">Niciun stoc înregistrat</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stockByType} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {stockByType.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {stockByType.filter((s: any) => s.value > 0).map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-text-2">{s.name}</span>
                    </div>
                    <span className="font-mono font-medium text-text">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">Mișcări Recente</span>
            <button onClick={() => navigate('/movements')} className="text-xs text-text-3 hover:text-accent transition-colors">Toate →</button>
          </div>
          <div className="flex flex-col gap-1">
            {recentMovements.slice(0, 8).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {movementTypeBadge(m.type)}
                  <span className="text-xs text-text-2 truncate">
                    {m.lines?.[0] ? (m.lines[0].product?.name || '—') : '—'}
                    {m.lines?.length > 1 && ` +${m.lines.length - 1}`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-3 shrink-0">
                  {new Date(m.date).toLocaleDateString('ro-RO')}
                </span>
              </div>
            ))}
            {recentMovements.length === 0 && <p className="text-sm text-text-3 text-center py-4">Nicio mișcare încă</p>}
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">Sumar Hale</span>
            <button onClick={() => navigate('/warehouses')} className="text-xs text-text-3 hover:text-accent transition-colors">Toate →</button>
          </div>
          <div className="flex flex-col gap-1">
            {summary.map((w: any) => (
              <div key={w.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="font-mono text-[11px] bg-bg-surface3 px-2 py-0.5 rounded text-text-2 min-w-8 text-center shrink-0">{w.code}</span>
                <span className="flex-1 text-sm text-text truncate">{w.name}</span>
                <span className="font-mono text-sm text-accent font-medium shrink-0">{w.productCount}</span>
                <span className="text-xs text-text-3 shrink-0">prod.</span>
              </div>
            ))}
            {summary.length === 0 && <p className="text-sm text-text-3 text-center py-4">Nicio hală configurată</p>}
          </div>
        </div>
      </div>
    </div>
  )
}