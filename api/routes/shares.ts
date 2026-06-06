import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ShareRepository } from '../repositories/ShareRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiResponse, Share, Comment, CreateShareRequest, AddCommentRequest } from '../../shared/types.js';

const router = Router();

router.get('/:token', (req: AuthRequest, res: Response<ApiResponse<Share & { assets: any[]; comments: Comment[] }>>) => {
  try {
    const { token } = req.params;

    if (!ShareRepository.isValid(token)) {
      res.status(404).json({ success: false, error: '分享链接无效或已过期' });
      return;
    }

    const share = ShareRepository.findByToken(token);
    if (!share) {
      res.status(404).json({ success: false, error: '分享不存在' });
      return;
    }

    const comments = ShareRepository.getComments(share.id);

    res.json({
      success: true,
      data: { ...share, comments },
    });
  } catch (error) {
    console.error('Get share error:', error);
    res.status(500).json({ success: false, error: '获取分享内容失败' });
  }
});

router.post('/:token/comment', (req: AuthRequest, res: Response<ApiResponse<Comment>>) => {
  try {
    const { token } = req.params;
    const { assetId, authorName, content } = req.body as AddCommentRequest;

    if (!ShareRepository.isValid(token)) {
      res.status(404).json({ success: false, error: '分享链接无效或已过期' });
      return;
    }

    const share = ShareRepository.findByToken(token);
    if (!share) {
      res.status(404).json({ success: false, error: '分享不存在' });
      return;
    }

    if (share.permission !== 'comment') {
      res.status(403).json({ success: false, error: '该分享不允许评论' });
      return;
    }

    if (!authorName || !content) {
      res.status(400).json({ success: false, error: '请填写昵称和评论内容' });
      return;
    }

    const comment = ShareRepository.addComment({
      shareId: share.id,
      assetId: assetId as number,
      authorName,
      content,
    });

    res.json({ success: true, data: comment, message: '评论成功' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: '评论失败' });
  }
});

router.use(authMiddleware);

router.post('/', (req: AuthRequest, res: Response<ApiResponse<Share>>) => {
  try {
    const { folderId, assetIds, permission, expiresAt } = req.body as CreateShareRequest;
    const userId = req.user!.id;

    if (!assetIds || assetIds.length === 0) {
      res.status(400).json({ success: false, error: '请选择要分享的素材' });
      return;
    }

    const token = uuidv4();
    const share = ShareRepository.create({
      token,
      folderId,
      assetIds,
      permission: permission || 'readonly',
      expiresAt,
      createdBy: userId,
    });

    AuditLogRepository.create({
      userId,
      action: 'share',
      targetType: 'asset',
      targetId: assetIds[0],
      targetName: `分享 ${assetIds.length} 个素材`,
    });

    res.json({ success: true, data: share, message: '分享链接已生成' });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ success: false, error: '创建分享失败' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    ShareRepository.delete(parseInt(id));

    AuditLogRepository.create({
      userId,
      action: 'share',
      targetType: 'asset',
      targetId: parseInt(id),
      targetName: '取消分享',
    });

    res.json({ success: true, message: '已取消分享' });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({ success: false, error: '取消分享失败' });
  }
});

export default router;
