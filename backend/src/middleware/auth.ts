import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '../lib/jwt'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export const authGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token lipsă' })
    return
  }
  try {
    req.user = verifyAccessToken(header.split(' ')[1])
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