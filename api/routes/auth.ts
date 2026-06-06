import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';
import { LoginRequest, RegisterRequest, LoginResponse, ApiResponse } from '../../shared/types.js';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response<ApiResponse<LoginResponse>>) => {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: '请填写所有必填字段',
      });
      return;
    }

    const existingUser = UserRepository.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: '该邮箱已被注册',
      });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = UserRepository.create(email, passwordHash, name);
    const token = generateToken(user);

    res.json({
      success: true,
      data: { token, user },
      message: '注册成功',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    });
  }
});

router.post('/login', (req: AuthRequest, res: Response<ApiResponse<LoginResponse>>) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: '请输入邮箱和密码',
      });
      return;
    }

    const user = UserRepository.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
      });
      return;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    res.json({
      success: true,
      data: { token, user: userWithoutPassword },
      message: '登录成功',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

export default router;
