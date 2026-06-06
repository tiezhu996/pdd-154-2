import { Router, Response } from 'express';
import { UserRepository } from '../repositories/UserRepository.js';
import { AssetRepository } from '../repositories/AssetRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiResponse, User, AuditLog, StorageStats, AuditAction } from '../../shared/types.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', (req: AuthRequest, res: Response<ApiResponse<Omit<User, 'passwordHash'>[]>>) => {
  try {
    const users = UserRepository.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: '获取成员列表失败' });
  }
});

router.put('/users/:id/role', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role: 'member' | 'admin' };

    if (!['member', 'admin'].includes(role)) {
      res.status(400).json({ success: false, error: '无效的角色' });
      return;
    }

    UserRepository.updateRole(parseInt(id), role);
    res.json({ success: true, message: '角色已更新' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: '更新角色失败' });
  }
});

router.delete('/users/:id', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user?.id) {
      res.status(400).json({ success: false, error: '无法删除自己' });
      return;
    }

    UserRepository.delete(parseInt(id));
    res.json({ success: true, message: '成员已移除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: '移除成员失败' });
  }
});

router.get('/logs', (req: AuthRequest, res: Response<ApiResponse<{ logs: AuditLog[]; total: number }>>) => {
  try {
    const { userId, action, startDate, endDate, limit = '50', offset = '0' } = req.query;

    const result = AuditLogRepository.findAll({
      userId: userId ? parseInt(userId as string) : undefined,
      action: action as AuditAction,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, error: '获取操作日志失败' });
  }
});

router.get('/stats', (req: AuthRequest, res: Response<ApiResponse<StorageStats>>) => {
  try {
    const stats = AssetRepository.getStorageStats();
    const byTypeMap: Record<string, { size: number; count: number }> = {};
    stats.byType.forEach((item) => {
      byTypeMap[item.type] = { size: item.used, count: item.count };
    });
    const result: StorageStats = {
      totalSize: stats.totalUsed,
      totalAssets: stats.byType.reduce((sum, item) => sum + item.count, 0),
      totalUsed: stats.totalUsed,
      totalQuota: 10 * 1024 * 1024 * 1024,
      byUser: stats.byUser,
      byType: byTypeMap,
    };
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

export default router;
