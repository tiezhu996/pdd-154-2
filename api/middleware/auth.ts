import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

export function generateToken(user: Omit<User, 'passwordHash'>): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): Omit<User, 'passwordHash'> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Omit<User, 'passwordHash'>;
  } catch {
    return null;
  }
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ success: false, error: '认证令牌无效或已过期' });
    return;
  }

  req.user = user;
  next();
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: '需要管理员权限' });
    return;
  }
  next();
}
