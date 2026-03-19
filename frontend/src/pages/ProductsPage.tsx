import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { productTypeBadge, unitLabel } from '../components/ui/Badge'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import { useAuthStore } from '../store/authStore'
import type { Product } from '../types'

type FormData = { name: string; type: Product['type']; unit: Product['unit']; description: string }

export default function ProductsPage() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts })
  const [open, setOpen]             = useState(false)
  const [editing, setEditing]       = useState<Product | null>(null)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? updateProduct(editing.id, data) : createProduct(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const openNew = () => {
    setEditing(null)
    reset({ name: '', type: 'MATERIE_PRIMA', unit: 'BUC', description: '' })
    setOpen(true)
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    reset({ name: p.name, type: p.type, unit: p.unit, description: p.description || '' })
    setOpen(true)
  }
  const closeModal = () => { setOpen(false); setEditing(null) }

  const filtered = products.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const mt = !typeFilter || p.type === typeFilter
    return ms && mt
  })

  const columns = [
    {
      key: 'name', header: 'Denumire',
      render: (p: Product) => (
        <div>
          <div className="font-medium text-text">{p.name}</div>
          {p.description && <div className="text-xs text-text-3 mt-0.5">{p.description}</div>}
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
        const total = (p.stock || []).reduce((s, st) => s + st.quantity, 0)
        return (
          <span className={`font-mono text-base font-medium ${
            total === 0 ? 'text-text-3' : total < 15 ? 'text-danger' : 'text-success'
          }`}>
            {total}
          </span>
        )
      },
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
      key: 'actions', header: '', width: '80px',
      render: (p: Product) => canEdit ? (
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => openEdit(p)}>✎</Button>
          <Button size="sm" variant="danger" onClick={() => {
            if (confirm(`Ștergi "${p.name}"?`)) deleteMutation.mutate(p.id)
          }}>✕</Button>
        </div>
      ) : null,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-light">Catalog Produse</h1>
          <p className="text-sm text-text-3 mt-1">{products.length} produse înregistrate</p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={openNew}>+ Produs Nou</Button>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Caută produs..."
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text placeholder:text-text-3 outline-none focus:border-accent w-56"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-bg-surface2 border border-border-2 rounded-md px-3 py-2 text-sm text-text outline-none focus:border-accent cursor-pointer"
        >
          <option value="">Toate tipurile</option>
          <option value="MATERIE_PRIMA">🪵 Materie Primă</option>
          <option value="GATA_ASAMBLARE">📦 Kit Asamblare</option>
          <option value="ASAMBLAT">🛋️ Asamblat</option>
        </select>
        {(search || typeFilter) && (
          <Button size="sm" onClick={() => { setSearch(''); setTypeFilter('') }}>✕ Resetează</Button>
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
          open={open}
          onClose={closeModal}
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
          </div>
        </Modal>
      )}
    </div>
  )
}