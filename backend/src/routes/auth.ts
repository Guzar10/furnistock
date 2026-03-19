import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { authGuard, AuthRequest } from '../middleware/auth'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Date invalide', details: parsed.error.flatten() })
    return
  }
  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) {
    res.status(401).json({ error: 'Email sau parolă incorectă' })
    return
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Email sau parolă incorectă' })
    return
  }
  const payload = { userId: user.id, role: user.role }
  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

// POST /auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token lipsă' })
    return
  }
  try {
    const payload = verifyRefreshToken(refreshToken)
    res.json({ accessToken: signAccessToken({ userId: payload.userId, role: payload.role }) })
  } catch {
    res.status(401).json({ error: 'Refresh token invalid sau expirat' })
  }
})

// GET /auth/me
router.get('/me', authGuard, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  if (!user) {
    res.status(404).json({ error: 'User negăsit' })
    return
  }
  res.json(user)
})

export default router