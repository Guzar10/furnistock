import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '../lib/jwt'
import { prisma } from '../lib/prisma'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token lipsă' })
    return
  }
  try {
    const payload = verifyAccessToken(header.split(' ')[1])

    // Verifică dacă userul mai e activ în DB
    const user = await prisma.user.findUnique({
      where:  { id: payload.userId },
      select: { active: true, role: true },
    })
    if (!user || !user.active) {
      res.status(401).json({ error: 'Cont dezactivat sau inexistent' })
      return
    }

    // Folosește rolul din DB, nu din token (mai sigur)
    req.user = { ...payload, role: user.role }
    next()
  } catch {
    res.status(401).json({ error: 'Token invalid sau expirat' })
  }
}

export const roleGuard = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acces interzis pentru rolul tău' })
      return
    }
    next()
  }