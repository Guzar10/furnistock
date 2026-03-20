import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { useToast } from '../components/ui/Toast'
import { RoleBadge } from '../components/Layout'
import type { User } from '../types'

type CreateFormData = { name: string; email: string; password: string; role: User['role'] }
type ResetFormData  = { password: string; confirmPassword: string }

const getUsers       = async () => (await api.get('/users')).data as User[]
const createUser     = async (d: CreateFormData) => (await api.post('/users', d)).data
const deleteUser     = async (id: string) => api.delete(`/users/${id}`)
const resetPassword  = async ({ id, password }: { id: string; password: string }) =>
  (await api.put(`/users/${id}/reset-password`, { password })).data

export default function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  const { showToast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [resetUser,  setResetUser]  = useState<User | null>(null)

  const {
    register: regCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
    formState: { errors: errCreate },
  } = useForm<CreateFormData>({ defaultValues: { role: 'OPERATOR' } })

  const {
    register: regReset,
    handleSubmit: handleReset,
    reset: resetResetForm,
    watch,
    formState: { errors: errReset },
  } = useForm<ResetFormData>()

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      showToast('Cont creat cu succes!')
      setCreateOpen(false)
      resetCreate()
    },
    onError: (err: any) => showToast(
      err?.response?.data?.error || 'Eroare la crearea contului', 'error'
    ),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      showToast('Contul a fost dezactivat', 'info')
    },
    onError: () => showToast('Eroare la dezactivarea contului', 'error'),
  })

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      showToast('Parola a fost resetată cu succes!')
      setResetUser(null)
      resetResetForm()
    },
    onError: (err: any) => showToast(
      err?.response?.data?.error || 'Eroare la resetarea parolei', 'error'
    ),
  })

  const onReset = (data: ResetFormData) => {
    if (!resetUser) return
    resetMutation.mutate({ id: resetUser.id, password: data.password })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-light">Utilizatori</h1>
          <p className="text-sm text-text-3 mt-1">{users.filter(u => u.active).length} conturi active</p>
        </div>
        <Button variant="primary" onClick={() => { resetCreate(); setCreateOpen(true) }}>
          + Utilizator Nou
        </Button>
      </div>

      <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-3">Se încarcă...</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Nume', 'Email', 'Rol', 'Status', 'Creat la', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-text-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
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
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => { resetResetForm(); setResetUser(u) }}
                          >
                            🔑 Reset parolă
                          </Button>
                          <Button
                            size="sm" variant="danger"
                            onClick={() => { if (confirm(`Dezactivezi contul lui ${u.name}?`)) deleteMutation.mutate(u.id) }}
                          >
                            Dezactivează
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {users.map(u => (
                <div key={u.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-text">{u.name}</div>
                      <div className="text-xs text-text-2 font-mono mt-0.5">{u.email}</div>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {u.active ? 'Activ' : 'Inactiv'}
                    </span>
                    <span className="text-xs text-text-3 font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ro-RO') : '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="ghost"
                      className="flex-1"
                      onClick={() => { resetResetForm(); setResetUser(u) }}
                    >
                      🔑 Reset parolă
                    </Button>
                    <Button
                      size="sm" variant="danger"
                      onClick={() => { if (confirm(`Dezactivezi contul lui ${u.name}?`)) deleteMutation.mutate(u.id) }}
                    >
                      Dezactivează
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal creare user */}
      <Modal
        open={createOpen} onClose={() => setCreateOpen(false)}
        title="Utilizator Nou"
        footer={<>
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Anulează</Button>
          <Button variant="primary" onClick={handleCreate(d => createMutation.mutate(d))} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Se creează...' : '✓ Creează cont'}
          </Button>
        </>}
      >
        <div className="flex flex-col gap-4">
          <Input label="Nume complet *" {...regCreate('name', { required: true })} placeholder="Ion Popescu" error={errCreate.name ? 'Câmp obligatoriu' : ''} />
          <Input label="Email *" type="email" {...regCreate('email', { required: true })} placeholder="ion@firma.ro" error={errCreate.email ? 'Câmp obligatoriu' : ''} />
          <Input label="Parolă inițială *" type="password" {...regCreate('password', { required: true, minLength: 6 })} placeholder="min. 6 caractere" error={errCreate.password ? 'Min. 6 caractere' : ''} />
          <Select label="Rol *" {...regCreate('role')}>
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

      {/* Modal reset parolă */}
      <Modal
        open={!!resetUser} onClose={() => { setResetUser(null); resetResetForm() }}
        title="Resetare Parolă"
        footer={<>
          <Button variant="ghost" onClick={() => { setResetUser(null); resetResetForm() }}>Anulează</Button>
          <Button variant="primary" onClick={handleReset(onReset)} disabled={resetMutation.isPending}>
            {resetMutation.isPending ? 'Se salvează...' : '🔑 Resetează parola'}
          </Button>
        </>}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-bg-surface2 border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-text-3 mb-1">Utilizator</p>
            <p className="text-sm font-medium text-text">{resetUser?.name}</p>
            <p className="text-xs text-text-2 font-mono">{resetUser?.email}</p>
          </div>
          <Input
            label="Parolă nouă *"
            type="password"
            {...regReset('password', { required: true, minLength: 6 })}
            placeholder="min. 6 caractere"
            error={errReset.password ? 'Min. 6 caractere' : ''}
          />
          <Input
            label="Confirmă parola *"
            type="password"
            {...regReset('confirmPassword', {
              required: true,
              validate: val => val === watch('password') || 'Parolele nu coincid',
            })}
            placeholder="Repetă parola nouă"
            error={errReset.confirmPassword?.message || ''}
          />
          {resetMutation.isError && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
              {(resetMutation.error as any)?.response?.data?.error || 'Eroare la resetare'}
            </div>
          )}
          {resetMutation.isSuccess && (
            <div className="text-xs text-success bg-success/10 border border-success/20 rounded-md px-3 py-2">
              ✓ Parola a fost resetată cu succes!
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}