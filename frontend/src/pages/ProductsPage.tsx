import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { productTypeBadge, unitLabel } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import { exportProductsExcel } from '../lib/exportExcel'
import { exportProductsPdf } from '../lib/exportPdf'
import { useAuthStore } from '../store/authStore'
import type { Product } from '../types'

type FormData = {
  name:        string
  type:        Product['type']
  unit:        Product['unit']
  description: string
  minStock:    number
}

export default function ProductsPage() {
  const qc       = useQueryClient()
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const canEdit  = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts })

  const [open,       setOpen]       = useState(false)
  const [editing,    setEditing]    = useState<Product | null>(null)
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [alertOnly,  setAlertOnly]  = useState(false)
  
  const { showToast } = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing
        ? updateProduct(editing.id, { ...data, minStock: Number(data.minStock) })
        : createProduct({ ...data, minStock: Number(data.minStock) }),
    onSuccess: (_, data) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      showToast(editing ? `"${data.name}" actualizat cu succes!` : `"${data.name}" adăugat cu succes!`)
      closeModal()
    },
    onError: () => showToast('Eroare la salvarea produsului', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      showToast('Produsul a fost șters', 'info')
    },
    onError: () => showToast('Eroare la ștergerea produsului', 'error'),
  })

  const openNew = () => {
    setEditing(null)
    reset({ name: '', type: 'MATERIE_PRIMA', unit: 'BUC', description: '', minStock: 0 })
    setOpen(true)
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    reset({ name: p.name, type: p.type, unit: p.unit, description: p.description || '', minStock: p.minStock || 0 })
    setOpen(true)
  }
  const closeModal = () => { setOpen(false); setEditing(null) }

  const getTotal   = (p: Product) => (p.stock || []).reduce((s, st) => s + st.quantity, 0)
  const isLow      = (p: Product) => p.minStock > 0 && getTotal(p) < p.minStock
  const isCritical = (p: Product) => p.minStock > 0 && getTotal(p) === 0

  const filtered = products.filter(p => {
    const ms = !search     || p.name.toLowerCase().includes(search.toLowerCase())
    const mt = !typeFilter || p.type === typeFilter
    const ma = !alertOnly  || isLow(p)
    return ms && mt && ma
  })

  const lowCount = products.filter(isLow).length

  const columns = [
    {
      key: 'name', header: 'Denumire',
      render: (p: Product) => (
        <div className="flex items-start gap-2">
          {isLow(p) && (
            <span title="Stoc sub minim" className="mt-0.5 shrink-0 text-xs">
              {isCritical(p) ? '🔴' : '🟡'}
            </span>
          )}
          <div>
            <div className="font-medium text-text">{p.name}</div>
            {p.description && <div className="text-xs text-text-3 mt-0.5">{p.description}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'type', header: 'Tip',
      render: (p: Product) => productTypeBadge(p.type),
    },
    {
      key: 'unit', header: 'U.M.',
      render: (p: Product) => <span className="text-text-2">{unitLabel(p.unit)}</span>,
    },
    {
      key: 'stock', header: 'Stoc Total',
      render: (p: Product) => {
        const total = getTotal(p)
        return (
          <span className={`font-mono text-base font-medium ${
            isCritical(p) ? 'text-danger' :
            isLow(p)      ? 'text-accent'  : 'text-success'
          }`}>
            {total}
          </span>
        )
      },
    },
    {
      key: 'minStock', header: 'Stoc Minim',
      render: (p: Product) => (
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-sm ${p.minStock > 0 ? 'text-text-2' : 'text-text-3'}`}>
            {p.minStock > 0 ? p.minStock : '—'}
          </span>
          {isLow(p) && p.minStock > 0 && (
            <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded-full font-medium">
              sub minim
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'locations', header: 'Locații',
      render: (p: Product) => (
        <div className="flex flex-wrap gap-1">
          {(p.stock || []).filter(s => s.quantity > 0).map(s => (
            <span key={s.warehouseId} className="font-mono text-[10px] bg-bg-surface3 px-1.5 py-0.5 rounded text-text-2">
              {s.warehouse?.code}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions', header: '', width: '110px',
      render: (p: Product) => (
        <div className="flex gap-1.5">
          <Button
            size="sm" variant="ghost"
            onClick={() => navigate(`/products/${p.id}/history`)}
            title="Istoric mișcări"
          >
            📋
          </Button>
          {canEdit && <>
            <Button size="sm" onClick={() => openEdit(p)}>✎</Button>
            <Button size="sm" variant="danger" onClick={() => {
              if (confirm(`Ștergi "${p.name}"?`)) deleteMutation.mutate(p.id)
            }}>✕</Button>
          </>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-light">Catalog Produse</h1>
          <p className="text-sm text-text-3 mt-1">{products.length} produse înregistrate</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => exportProductsExcel(filtered)} disabled={filtered.length === 0}>
            ⬇ Excel
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exportProductsPdf(filtered)} disabled={filtered.length === 0}>
            ⬇ PDF
          </Button>
          {canEdit && <Button variant="primary" onClick={openNew}>+ Produs Nou</Button>}
        </div>
      </div>

      {/* Alert banner */}
      {lowCount > 0 && (
        <div className="flex items-center justify-between bg-danger/5 border border-danger/15 rounded-xl px-4 py-3 mb-4 gap-3">
          <p className="text-sm text-text-2">
            ⚠️ <strong className="text-danger">{lowCount} {lowCount > 1 ? 'produse au' : 'produs are'}</strong> stocul sub minimul configurat
          </p>
          <button
            onClick={() => setAlertOnly(!alertOnly)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              alertOnly
                ? 'bg-danger/20 text-danger font-medium'
                : 'bg-danger/10 text-danger hover:bg-danger/20'
            }`}
          >
            {alertOnly ? '✕ Anulează filtru' : 'Arată doar alertele'}
          </button>
        </div>
      )}

      {/* Filtre */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Caută produs..."
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent w-full sm:w-56"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent cursor-pointer">
          <option value="">Toate tipurile</option>
          <option value="MATERIE_PRIMA">🪵 Materie Primă</option>
          <option value="GATA_ASAMBLARE">📦 Kit Asamblare</option>
          <option value="ASAMBLAT">🛋️ Asamblat</option>
        </select>
        {(search || typeFilter || alertOnly) && (
          <Button size="sm" onClick={() => { setSearch(''); setTypeFilter(''); setAlertOnly(false) }}>
            ✕ Resetează
          </Button>
        )}
      </div>

      <div className="bg-bg-surface border border-border rounded-xl">
        {isLoading
          ? <div className="p-10 text-center text-text-3">Se încarcă...</div>
          : <Table columns={columns} data={filtered} keyFn={p => p.id} empty="Niciun produs găsit" />
        }
      </div>

      {canEdit && (
        <Modal
          open={open} onClose={closeModal}
          title={editing ? 'Editează Produs' : 'Produs Nou'}
          footer={<>
            <Button variant="ghost" onClick={closeModal}>Anulează</Button>
            <Button
              variant="primary"
              onClick={handleSubmit(d => saveMutation.mutate(d))}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Se salvează...' : '✓ Salvează'}
            </Button>
          </>}
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Denumire produs *"
              {...register('name', { required: true })}
              placeholder="ex: Lemn stejar, Dulap 3 uși..."
              error={errors.name ? 'Câmp obligatoriu' : ''}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Tip produs *" {...register('type')}>
                <option value="MATERIE_PRIMA">🪵 Materie Primă</option>
                <option value="GATA_ASAMBLARE">📦 Kit Asamblare</option>
                <option value="ASAMBLAT">🛋️ Asamblat</option>
              </Select>
              <Select label="Unitate de măsură *" {...register('unit')}>
                <option value="BUC">Bucăți (buc)</option>
                <option value="MP">Metri pătrați (m²)</option>
                <option value="ML">Metri liniari (m.l.)</option>
                <option value="KG">Kilograme (kg)</option>
                <option value="M3">Metri cubi (m³)</option>
                <option value="L">Litri (l)</option>
              </Select>
            </div>
            <Input
              label="Descriere (opțional)"
              {...register('description')}
              placeholder="Scurtă descriere..."
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-2">
                Stoc minim alertă
                <span className="text-text-3 font-normal ml-1">(0 = dezactivat)</span>
              </label>
              <input
                type="number" min="0" step="any"
                {...register('minStock')}
                placeholder="ex: 10"
                className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
              <p className="text-[11px] text-text-3">
                Vei primi alertă când stocul total scade sub această valoare
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}