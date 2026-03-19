import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { movementTypeBadge, unitLabel } from '../components/ui/Badge'
import { getMovements, createMovement, deleteMovement } from '../api/movements'
import { getProducts } from '../api/products'
import { getWarehouses } from '../api/warehouses'
import { useAuthStore } from '../store/authStore'
import type { Movement } from '../types'

const TYPES = [
  { id: 'RECEPTIE',  label: 'Recepție',  icon: '📥', desc: 'Marfă cumpărată' },
  { id: 'PRODUCTIE', label: 'Producție', icon: '⚙️', desc: 'Fabricare mobilier' },
  { id: 'VANZARE',   label: 'Vânzare',   icon: '📤', desc: 'Vânzare client' },
  { id: 'TRANSFER',  label: 'Transfer',  icon: '🔄', desc: 'Între hale' },
  { id: 'DESEURI',   label: 'Deșeuri',   icon: '🗑️', desc: 'Casare / deșeuri' },
]

export default function MovementsPage() {
  const qc   = useQueryClient()
  const user = useAuthStore(s => s.user)

  const { data: movements  = [], isLoading } = useQuery({ queryKey: ['movements'], queryFn: () => getMovements({ limit: 100 }) })
  const { data: products   = [] }            = useQuery({ queryKey: ['products'],  queryFn: getProducts })
  const { data: warehouses = [] }            = useQuery({ queryKey: ['warehouses'],queryFn: getWarehouses })

  const [open,       setOpen]       = useState(false)
  const [moveType,   setMoveType]   = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search,     setSearch]     = useState('')

  const { register, handleSubmit, control, reset } = useForm<any>({
    defaultValues: { lines: [{}], consumed: [{}], produced: [{}] },
  })
  const linesArr    = useFieldArray({ control, name: 'lines' })
  const consumedArr = useFieldArray({ control, name: 'consumed' })
  const producedArr = useFieldArray({ control, name: 'produced' })

  const saveMutation = useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['stock-summary'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMovement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movements'] }),
  })

  const openModal = () => {
    setMoveType('')
    reset({ lines: [{}], consumed: [{}], produced: [{}], date: today(), note: '' })
    setOpen(true)
  }
  const closeModal = () => { setOpen(false); setMoveType('') }
  const today = () => new Date().toISOString().split('T')[0]

  const onSubmit = (data: any) => {
  if (!moveType) return
  const base = { type: moveType, date: data.date, note: data.note }
  let body: any

  if (moveType === 'RECEPTIE') {
    const lines = (data.lines || [])
      .map((l: any) => ({
        productId:    l.productId,
        toWarehouseId: l.warehouseId,
        quantity:     parseFloat(l.quantity),
      }))
      .filter((l: any) => l.productId && l.toWarehouseId && l.quantity > 0)
    body = { ...base, lines }

  } else if (moveType === 'VANZARE' || moveType === 'DESEURI') {
  const lines = (data.lines || [])
    .map((l: any) => ({
      productId:       l.productId,
      fromWarehouseId: l.fromWarehouseId,  // ← fix: era l.warehouseId
      quantity:        parseFloat(l.quantity),
    }))
    .filter((l: any) => l.productId && l.fromWarehouseId && l.quantity > 0)
  body = { ...base, lines }
} else if (moveType === 'TRANSFER') {
    const lines = (data.lines || [])
      .map((l: any) => ({
        productId:       l.productId,
        fromWarehouseId: l.fromWarehouseId,
        toWarehouseId:   l.toWarehouseId,
        quantity:        parseFloat(l.quantity),
      }))
      .filter((l: any) => l.productId && l.fromWarehouseId && l.toWarehouseId && l.quantity > 0)
    body = { ...base, lines }

  } else if (moveType === 'PRODUCTIE') {
  const consumed = (data.consumed || [])
    .map((l: any) => ({
      productId:       l.productId,
      fromWarehouseId: l.fromWarehouseId,  // ← fix: era l.warehouseId
      quantity:        parseFloat(l.quantity),
    }))
    .filter((l: any) => l.productId && l.fromWarehouseId && l.quantity > 0)

  const produced = (data.produced || [])
    .map((l: any) => ({
      productId:     l.productId,
      toWarehouseId: l.warehouseId,
      quantity:      parseFloat(l.quantity),
    }))
    .filter((l: any) => l.productId && l.toWarehouseId && l.quantity > 0)

  body = { ...base, consumed, produced }
}

  saveMutation.mutate(body)
}

  const filtered = movements.filter(m => {
    const mt = !typeFilter || m.type === typeFilter
    const ms = !search || (m.note || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.lines || []).some(l => l.product?.name.toLowerCase().includes(search.toLowerCase()))
    return mt && ms
  })

  const prodOpts = products.map(p => <option key={p.id} value={p.id}>{p.name} ({unitLabel(p.unit)})</option>)
  const whOpts   = warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)

  const lineClass = "bg-bg-surface2 border border-border-2 rounded-md px-2.5 py-2 text-sm text-text outline-none focus:border-accent w-full"

  const LineRow = ({ prefix, idx, remove, showFrom = false, showTo = false }: any) => (
    <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: showFrom && showTo ? '2fr 1fr 1fr 60px 28px' : '2fr 1fr 60px 28px' }}>
      <select {...register(`${prefix}.${idx}.productId`)} className={lineClass}>
        <option value="">— Produs —</option>
        {prodOpts}
      </select>
      {showFrom && (
        <select {...register(`${prefix}.${idx}.fromWarehouseId`)} className={lineClass}>
          <option value="">— Din —</option>
          {whOpts}
        </select>
      )}
      {showTo ? (
        <select {...register(`${prefix}.${idx}.toWarehouseId`)} className={lineClass}>
          <option value="">— Spre —</option>
          {whOpts}
        </select>
      ) : !showFrom ? (
        <select {...register(`${prefix}.${idx}.warehouseId`)} className={lineClass}>
          <option value="">— Hală —</option>
          {whOpts}
        </select>
      ) : null}
      <input type="number" min="0.01" step="any" placeholder="Cant." {...register(`${prefix}.${idx}.quantity`)} className={lineClass + ' text-center'} />
      <button type="button" onClick={() => remove(idx)} className="text-text-3 hover:text-danger transition-colors text-lg leading-none">✕</button>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-light">Mișcări de Stoc</h1>
          <p className="text-sm text-text-3 mt-1">{movements.length} tranzacții înregistrate</p>
        </div>
        <Button variant="primary" onClick={openModal}>+ Mișcare Nouă</Button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Caută în mișcări..."
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent w-56"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent cursor-pointer">
          <option value="">Toate tipurile</option>
          {TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
        </select>
        {(search || typeFilter) && (
          <Button size="sm" onClick={() => { setSearch(''); setTypeFilter('') }}>✕ Resetează</Button>
        )}
      </div>

      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-3">Se încarcă...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-text-3">
            <div className="text-4xl mb-3 opacity-20">⇄</div>
            <p className="text-sm text-text-2">Nicio mișcare înregistrată</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Data', 'Tip', 'Detalii', 'Referință', 'Operator', ''].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: Movement) => (
                  <tr key={m.id} className="border-b border-border hover:bg-bg-surface2 transition-colors last:border-0">
                    <td className="px-3 py-3 font-mono text-xs text-text-2 whitespace-nowrap">
                      {new Date(m.date).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="px-3 py-3">{movementTypeBadge(m.type)}</td>
                    <td className="px-3 py-3 max-w-xs">
                      {(m.lines || []).slice(0, 2).map((l, i) => (
                        <div key={i} className="text-xs text-text-2">
                          <span className="font-mono text-accent">{l.quantity} {unitLabel(l.product?.unit || '')}</span>
                          {' '}<span className="text-text">{l.product?.name}</span>
                        </div>
                      ))}
                      {(m.lines || []).length > 2 && <div className="text-xs text-text-3">+{m.lines.length - 2} altele</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-text-2">{m.note || '—'}</td>
                    <td className="px-3 py-3 text-xs text-text-2">{m.user?.name}</td>
                    <td className="px-3 py-3">
                      {user?.role === 'ADMIN' && (
                        <Button size="sm" variant="danger" onClick={() => { if (confirm('Ștergi această mișcare?')) deleteMutation.mutate(m.id) }}>✕</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal mișcare */}
      <Modal open={open} onClose={closeModal} title="Mișcare de Stoc" wide
        footer={moveType ? <>
          <Button variant="ghost" onClick={closeModal}>Anulează</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Se înregistrează...' : '✓ Înregistrează'}
          </Button>
        </> : undefined}
      >
        {/* Tip selector */}
        <div className="grid grid-cols-5 gap-2 mb-5">
          {TYPES.map(t => (
            <button key={t.id} type="button" onClick={() => setMoveType(t.id)}
              className={`p-3 rounded-lg border text-center transition-all font-sans text-xs font-medium ${
                moveType === t.id
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-bg-surface2 border-border-2 text-text-2 hover:bg-bg-surface3 hover:text-text'
              }`}>
              <span className="text-xl block mb-1">{t.icon}</span>
              {t.label}
              <span className="block text-[10px] mt-0.5 opacity-60">{t.desc}</span>
            </button>
          ))}
        </div>

        {moveType && (
          <div className="flex flex-col gap-4">
            {/* RECEPTIE */}
            {moveType === 'RECEPTIE' && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-success mb-2">Produse recepționate</div>
                {linesArr.fields.map((f, i) => <LineRow key={f.id} prefix="lines" idx={i} remove={linesArr.remove} />)}
                <button type="button" onClick={() => linesArr.append({})} className="w-full border border-dashed border-border-2 rounded-md py-2 text-xs text-text-3 hover:border-accent hover:text-accent transition-colors">+ Adaugă produs</button>
              </div>
            )}

            {/* VANZARE / DESEURI */}
            {(moveType === 'VANZARE' || moveType === 'DESEURI') && (
              <div>
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${moveType === 'VANZARE' ? 'text-info' : 'text-danger'}`}>
                  {moveType === 'VANZARE' ? 'Produse vândute' : 'Produse casate / deșeuri'}
                </div>
                {linesArr.fields.map((f, i) => <LineRow key={f.id} prefix="lines" idx={i} remove={linesArr.remove} showFrom />)}
                <button type="button" onClick={() => linesArr.append({})} className="w-full border border-dashed border-border-2 rounded-md py-2 text-xs text-text-3 hover:border-accent hover:text-accent transition-colors">+ Adaugă produs</button>
              </div>
            )}

            {/* TRANSFER */}
            {moveType === 'TRANSFER' && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-purple mb-2">Transfer între hale</div>
                {linesArr.fields.map((f, i) => <LineRow key={f.id} prefix="lines" idx={i} remove={linesArr.remove} showFrom showTo />)}
                <button type="button" onClick={() => linesArr.append({})} className="w-full border border-dashed border-border-2 rounded-md py-2 text-xs text-text-3 hover:border-accent hover:text-accent transition-colors">+ Adaugă produs</button>
              </div>
            )}

            {/* PRODUCTIE */}
            {moveType === 'PRODUCTIE' && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-danger mb-2">▼ Materiale consumate</div>
                  {consumedArr.fields.map((f, i) => <LineRow key={f.id} prefix="consumed" idx={i} remove={consumedArr.remove} showFrom />)}
                  <button type="button" onClick={() => consumedArr.append({})} className="w-full border border-dashed border-border-2 rounded-md py-2 text-xs text-text-3 hover:border-accent hover:text-accent transition-colors">+ Adaugă material</button>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-success mb-2">▲ Produse fabricate</div>
                  {producedArr.fields.map((f, i) => <LineRow key={f.id} prefix="produced" idx={i} remove={producedArr.remove} />)}
                  <button type="button" onClick={() => producedArr.append({})} className="w-full border border-dashed border-border-2 rounded-md py-2 text-xs text-text-3 hover:border-accent hover:text-accent transition-colors">+ Adaugă produs finit</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-2">Data operațiunii</label>
                <input type="date" {...register('date')} className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-2">Referință / Notă</label>
                <input type="text" {...register('note')} placeholder="ex: Factură #1234, Client..." className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent" />
              </div>
            </div>

            {saveMutation.isError && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {typeof (saveMutation.error as any)?.response?.data?.error === 'string'
                ? (saveMutation.error as any).response.data.error
                : 'Date invalide — verifică produsele și halele selectate'}
            </div>
          )}
          </div>
        )}
      </Modal>
    </div>
  )
}