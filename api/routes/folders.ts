import { Router, Response } from 'express';
import { FolderRepository } from '../repositories/FolderRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiResponse, Folder, CreateFolderRequest } from '../../shared/types.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response<ApiResponse<Folder[]>>) => {
  try {
    const folders = FolderRepository.findAllWithCount();
    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, error: '获取文件夹列表失败' });
  }
});

router.post('/', (req: AuthRequest, res: Response<ApiResponse<Folder>>) => {
  try {
    const { name, parentId } = req.body as CreateFolderRequest;

    if (!name) {
      res.status(400).json({ success: false, error: '文件夹名称不能为空' });
      return;
    }

    const folder = FolderRepository.create(name, parentId || null);

    if (req.user) {
      AuditLogRepository.create({
        userId: req.user.id,
        action: 'edit',
        targetType: 'folder',
        targetId: folder.id,
        targetName: folder.name,
      });
    }

    res.json({ success: true, data: folder, message: '文件夹创建成功' });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, error: '创建文件夹失败' });
  }
});

router.put('/:id', (req: AuthRequest, res: Response<ApiResponse<Folder>>) => {
  try {
    const { id } = req.params;
    const { name } = req.body as { name: string };

    if (!name) {
      res.status(400).json({ success: false, error: '文件夹名称不能为空' });
      return;
    }

    const folder = FolderRepository.findById(parseInt(id));
    if (!folder) {
      res.status(404).json({ success: false, error: '文件夹不存在' });
      return;
    }

    FolderRepository.update(parseInt(id), name);
    const updatedFolder = FolderRepository.findById(parseInt(id))!;

    if (req.user) {
      AuditLogRepository.create({
        userId: req.user.id,
        action: 'edit',
        targetType: 'folder',
        targetId: parseInt(id),
        targetName: name,
      });
    }

    res.json({ success: true, data: updatedFolder, message: '文件夹重命名成功' });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ success: false, error: '更新文件夹失败' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const folder = FolderRepository.findById(parseInt(id));

    if (!folder) {
      res.status(404).json({ success: false, error: '文件夹不存在' });
      return;
    }

    if (parseInt(id) === 1) {
      res.status(400).json({ success: false, error: '无法删除根文件夹' });
      return;
    }

    if (req.user) {
      AuditLogRepository.create({
        userId: req.user.id,
        action: 'delete',
        targetType: 'folder',
        targetId: parseInt(id),
        targetName: folder.name,
      });
    }

    FolderRepository.delete(parseInt(id));
    res.json({ success: true, message: '文件夹删除成功' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, error: '删除文件夹失败' });
  }
});

export default router;
