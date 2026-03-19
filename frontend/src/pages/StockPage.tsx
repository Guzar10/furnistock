import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import { productTypeBadge, unitLabel } from '../components/ui/Badge'
import { getStock } from '../api/stock'
import { getWarehouses } from '../api/warehouses'
import type { StockEntry } from '../types'

export default function StockPage() {
  const [searchParams]  = useSearchParams()
  const [search,      setSearch]     = useState('')
  const [typeFilter,  setTypeFilter] = useState('')
  const [whFilter,    setWhFilter]   = useState(searchParams.get('warehouseId') || '')

  const { data: stock      = [], isLoading } = useQuery({ queryKey: ['stock', whFilter, typeFilter], queryFn: () => getStock({ warehouseId: whFilter || undefined, type: typeFilter || undefined }) })
  const { data: warehouses = [] }            = useQuery({ queryKey: ['warehouses'], queryFn: getWarehouses })

  const filtered = stock.filter(s =>
    !search || s.product.name.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'product', header: 'Produs',
      render: (s: StockEntry) => (
        <div>
          <div className="font-medium text-text">{s.product.name}</div>
          {s.product.description && <div className="text-xs text-text-3 mt-0.5">{s.product.description}</div>}
        </div>
      ),
    },
    { key: 'type', header: 'Tip', render: (s: StockEntry) => productTypeBadge(s.product.type), mobileHide: true },
    {
      key: 'warehouse', header: 'Hală',
      render: (s: StockEntry) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-bg-surface3 px-1.5 py-0.5 rounded text-text-2">{s.warehouse.code}</span>
          <span className="text-xs text-text-2 hidden sm:inline">{s.warehouse.name}</span>
        </div>
      ),
    },
    {
      key: 'quantity', header: 'Cantitate',
      render: (s: StockEntry) => (
        <span className={`font-mono text-lg font-medium ${s.quantity < 5 ? 'text-danger' : s.quantity < 15 ? 'text-accent' : 'text-success'}`}>
          {s.quantity}
        </span>
      ),
    },
    {
      key: 'unit', header: 'U.M.',
      render: (s: StockEntry) => <span className="text-text-2 text-xs">{unitLabel(s.product.unit)}</span>,
      mobileHide: true,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-light">Stoc Curent</h1>
          <p className="text-sm text-text-3 mt-1">
            {filtered.length} înregistrări{whFilter ? ` în ${warehouses.find(w => w.id === whFilter)?.name}` : ' totale'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Caută produs..."
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent w-full sm:w-56"
        />
        <div className="flex gap-2 flex-1">
          <select value={whFilter} onChange={e => setWhFilter(e.target.value)}
            className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent cursor-pointer flex-1 min-w-0">
            <option value="">Toate halele</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent cursor-pointer flex-1 min-w-0">
            <option value="">Toate tipurile</option>
            <option value="MATERIE_PRIMA">🪵 Mat. Primă</option>
            <option value="GATA_ASAMBLARE">📦 Kit</option>
            <option value="ASAMBLAT">🛋️ Asamblat</option>
          </select>
          {(search || whFilter || typeFilter) && (
            <Button size="sm" onClick={() => { setSearch(''); setWhFilter(''); setTypeFilter('') }}>✕</Button>
          )}
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl">
        {isLoading
          ? <div className="p-10 text-center text-text-3">Se încarcă...</div>
          : <Table columns={columns} data={filtered} keyFn={s => s.id} empty="Niciun stoc găsit" />
        }
      </div>
    </div>
  )
}