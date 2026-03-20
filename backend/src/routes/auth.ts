import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { authGuard, AuthRequest } from '../middleware/auth'
import { loginLimiter } from '../middleware/security'
import { auditLog } from '../middleware/logger'

const router = Router()

const LoginSchema = z.object({
  email:    z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola prea scurtă'),
})

const PasswordSchema = z.string()
  .min(8,  'Parola trebuie să aibă minim 8 caractere')
  .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
  .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră')

// POST /auth/login — cu rate limiting
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Date invalide', details: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data

  // Delay artificial — previne timing attacks
  await new Promise(r => setTimeout(r, 200))

  const user = await prisma.user.findUnique({ where: { email } })

  // Același mesaj indiferent dacă userul există sau nu — previne user enumeration
  if (!user || !user.active) {
    await bcrypt.compare(password, '$2a$10$placeholder.hash.to.prevent.timing') // dummy compare
    res.status(401).json({ error: 'Email sau parolă incorectă' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Email sau parolă incorectă' })
    return
  }

  console.log(`[AUTH] Login reușit: ${email} | IP: ${req.ip}`)

  const payload = { userId: user.id, role: user.role }
  res.json({
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token lipsă' })
    return
  }
  try {
    const payload = verifyRefreshToken(refreshToken)

    // Verifică că userul e încă activ
    const user = await prisma.user.findUnique({
      where:  { id: payload.userId },
      select: { active: true, role: true },
    })
    if (!user || !user.active) {
      res.status(401).json({ error: 'Cont dezactivat' })
      return
    }

    res.json({
      accessToken: signAccessToken({ userId: payload.userId, role: user.role }),
    })
  } catch {
    res.status(401).json({ error: 'Refresh token invalid sau expirat' })
  }
})

// GET /auth/me
router.get('/me', authGuard, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  if (!user) {
    res.status(404).json({ error: 'User negăsit' })
    return
  }
  res.json(user)
})

// POST /auth/logout — log
router.post('/logout', authGuard, auditLog('LOGOUT'), async (req: AuthRequest, res: Response) => {
  console.log(`[AUTH] Logout: userId ${req.user?.userId} | IP: ${req.ip}`)
  res.json({ success: true })
})

// PUT /auth/change-password
router.put('/change-password', authGuard, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Completează toate câmpurile' })
    return
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'Parola nouă trebuie să aibă minim 8 caractere' })
    return
  }

  if (!/[A-Z]/.test(newPassword)) {
    res.status(400).json({ error: 'Parola nouă trebuie să conțină cel puțin o literă mare' })
    return
  }

  if (!/[0-9]/.test(newPassword)) {
    res.status(400).json({ error: 'Parola nouă trebuie să conțină cel puțin o cifră' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
  if (!user) {
    res.status(404).json({ error: 'User negăsit' })
    return
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    res.status(400).json({ error: 'Parola curentă este incorectă' })
    return
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data:  { passwordHash: await bcrypt.hash(newPassword, 10) },
  })

  console.log(`[AUTH] Parolă schimbată: userId ${req.user!.userId} | IP: ${req.ip}`)
  res.json({ success: true })
})

export default router