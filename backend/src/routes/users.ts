import { Router, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { authGuard, roleGuard, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authGuard, roleGuard('ADMIN'))

const UserSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['ADMIN', 'MANAGER', 'OPERATOR']),
})

// GET /users
router.get('/', async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

// POST /users
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = UserSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  const { name, email, password, role } = parsed.data
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 10), role },
      select: { id: true, name: true, email: true, role: true },
    })
    res.status(201).json(user)
  } catch {
    res.status(400).json({ error: 'Email-ul există deja' })
  }
})

// PUT /users/:id/role
router.put('/:id/role', async (req: AuthRequest, res: Response) => {
  const { role } = req.body
  if (!['ADMIN', 'MANAGER', 'OPERATOR'].includes(role)) {
    res.status(400).json({ error: 'Rol invalid' }); return
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })
  res.json(user)
})

// DELETE /users/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.userId) {
    res.status(400).json({ error: 'Nu te poți dezactiva pe tine însuți' }); return
  }
  await prisma.user.update({ where: { id: req.params.id }, data: { active: false } })
  res.json({ success: true })
})

export default router