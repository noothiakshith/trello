import jwt, { decode } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

declare module 'express' {
    interface Request {
        user?: any
    }
}

export function verifyUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
    }

    req.user = { id: decoded.id }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
