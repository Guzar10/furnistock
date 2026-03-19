import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api/warehouses'
import { useAuthStore } from '../store/authStore'
import type { Warehouse } from '../types'

type FormData = { name: string; code: string; location: string; description: string }

export default function WarehousesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: warehouses = [], isLoading } = useQuery({ queryKey: ['warehouses'], queryFn: getWarehouses })
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? updateWarehouse(editing.id, data) : createWarehouse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      qc.invalidateQueries({ queryKey: ['stock-summary'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })

  const openNew = () => {
    setEditing(null)
    reset({ name: '', code: '', location: '', description: '' })
    setOpen(true)
  }
  const openEdit = (w: Warehouse) => {
    setEditing(w)
    reset({ name: w.name, code: w.code, location: w.location || '', description: w.description || '' })
    setOpen(true)
  }
  const closeModal = () => { setOpen(false); setEditing(null) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-light">Hale & Depozite</h1>
          <p className="text-sm text-text-3 mt-1">{warehouses.length} locații de depozitare</p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={openNew}>+ Hală Nouă</Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-text-3">Se încarcă...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map(w => {
            const totalQty     = (w.stock || []).reduce((s, st) => s + st.quantity, 0)
            const productCount = (w.stock || []).filter(s => s.quantity > 0).length
            return (
              <div
                key={w.id}
                onClick={() => navigate(`/stock?warehouseId=${w.id}`)}
                className="bg-bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-border-2 hover:bg-bg-surface2 transition-all group"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-mono text-[11px] bg-bg-surface3 px-2 py-0.5 rounded text-text-2">
                    {w.code}
                  </span>
                  {canEdit && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button size="sm" onClick={() => openEdit(w)}>✎</Button>
                      <Button size="sm" variant="danger" onClick={() => { if (confirm(`Ștergi "${w.name}"?`)) deleteMutation.mutate(w.id) }}>✕</Button>
                    </div>
                  )}
                </div>

                <h3 className="font-serif text-lg font-medium text-text mt-2 mb-1">{w.name}</h3>
                <p className="text-xs text-text-3 mb-4">
                  {w.location && `📍 ${w.location}`}
                  {w.location && w.description && ' · '}
                  {w.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  {[
                    { val: productCount, lbl: 'Produse',    color: 'text-accent' },
                    { val: totalQty,     lbl: 'Cant. tot.', color: 'text-text'   },
                    { val: (w.stock||[]).length, lbl: 'Înreg.', color: 'text-info' },
                  ].map(item => (
                    <div key={item.lbl} className="text-center">
                      <div className={`font-mono text-xl font-medium ${item.color}`}>{item.val}</div>
                      <div className="text-[10px] text-text-3 uppercase tracking-wide mt-0.5">{item.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {warehouses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-text-3">
              <div className="text-5xl mb-3 opacity-20">⬢</div>
              <p className="text-sm text-text-2">Nicio hală configurată</p>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <Modal
          open={open} onClose={closeModal}
          title={editing ? 'Editează Hală' : 'Hală Nouă'}
          footer={<>
            <Button variant="ghost" onClick={closeModal}>Anulează</Button>
            <Button variant="primary" onClick={handleSubmit(d => saveMutation.mutate(d))} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Se salvează...' : '✓ Salvează'}
            </Button>
          </>}
        >
          <div className="flex flex-col gap-4">
            <Input label="Denumire hală *" {...register('name', { required: true })} placeholder="ex: Hala 1 — Materie Primă" error={errors.name ? 'Câmp obligatoriu' : ''} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cod / Prescurtare *" {...register('code', { required: true })} placeholder="ex: H1, ATL" error={errors.code ? 'Câmp obligatoriu' : ''} />
              <Input label="Locație / Zonă" {...register('location')} placeholder="ex: Zona Nord" />
            </div>
            <Input label="Descriere" {...register('description')} placeholder="Ce se depozitează..." />
          </div>
        </Modal>
      )}
    </div>
  )
}