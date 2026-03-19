import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { RoleBadge } from '../components/Layout'
import type { User } from '../types'

type FormData = { name: string; email: string; password: string; role: User['role'] }

const getUsers   = async () => (await api.get('/users')).data as User[]
const createUser = async (d: FormData) => (await api.post('/users', d)).data
const toggleUser = async (id: string, active: boolean) => api.put(`/users/${id}/role`, { active })
const deleteUser = async (id: string) => api.delete(`/users/${id}`)

export default function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { role: 'OPERATOR' },
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setOpen(false); reset() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-light">Utilizatori</h1>
          <p className="text-sm text-text-3 mt-1">{users.length} conturi active</p>
        </div>
        <Button variant="primary" onClick={() => { reset(); setOpen(true) }}>+ Utilizator Nou</Button>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-3">Se încarcă...</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Nume', 'Email', 'Rol', 'Status', 'Creat la', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-text-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: User) => (
                <tr key={u.id} className="border-b border-border hover:bg-bg-surface2 transition-colors last:border-0">
                  <td className="px-4 py-3 font-medium text-text">{u.name}</td>
                  <td className="px-4 py-3 text-text-2 text-xs font-mono">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {u.active ? 'Activ' : 'Inactiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-3 font-mono">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ro-RO') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="danger"
                      onClick={() => { if (confirm(`Dezactivezi contul lui ${u.name}?`)) deleteMutation.mutate(u.id) }}>
                      Dezactivează
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Utilizator Nou"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Anulează</Button>
          <Button variant="primary" onClick={handleSubmit(d => createMutation.mutate(d))} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Se creează...' : '✓ Creează cont'}
          </Button>
        </>}
      >
        <div className="flex flex-col gap-4">
          <Input label="Nume complet *" {...register('name', { required: true })} placeholder="Ion Popescu" error={errors.name ? 'Câmp obligatoriu' : ''} />
          <Input label="Email *" type="email" {...register('email', { required: true })} placeholder="ion@firma.ro" error={errors.email ? 'Câmp obligatoriu' : ''} />
          <Input label="Parolă *" type="password" {...register('password', { required: true, minLength: 6 })} placeholder="min. 6 caractere" error={errors.password ? 'Min. 6 caractere' : ''} />
          <Select label="Rol *" {...register('role')}>
            <option value="OPERATOR">Operator — mișcări stoc</option>
            <option value="MANAGER">Manager — citire + mișcări</option>
            <option value="ADMIN">Admin — acces total</option>
          </Select>
          {createMutation.isError && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {(createMutation.error as any)?.response?.data?.error || 'Eroare la creare'}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}