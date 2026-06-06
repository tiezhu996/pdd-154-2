import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { AssetRepository } from '../repositories/AssetRepository.js';
import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { processImage, moveFile } from '../services/imageProcessor.js';
import { ApiResponse, Asset, AssetType, MoveAssetsRequest, UpdateAssetRequest } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: path.join(uploadsDir, 'temp'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response<ApiResponse<Asset[]>>) => {
  try {
    const { folderId, search, type, tag } = req.query;
    const userId = req.user!.id;

    const assets = AssetRepository.findByFolderId(
      parseInt(folderId as string) || 1,
      userId,
      {
        search: search as string,
        type: type as AssetType,
        tag: tag as string,
      }
    );

    res.json({ success: true, data: assets });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ success: false, error: '获取素材列表失败' });
  }
});

router.get('/recent', (req: AuthRequest, res: Response<ApiResponse<Asset[]>>) => {
  try {
    const userId = req.user!.id;
    const { limit = '20' } = req.query;
    const assets = AssetRepository.findRecent(userId, parseInt(limit as string));
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error('Get recent assets error:', error);
    res.status(500).json({ success: false, error: '获取最近上传失败' });
  }
});

router.get('/favorites', (req: AuthRequest, res: Response<ApiResponse<Asset[]>>) => {
  try {
    const userId = req.user!.id;
    const assets = AssetRepository.findFavorites(userId);
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, error: '获取收藏列表失败' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response<ApiResponse<Asset>>) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const asset = AssetRepository.findById(parseInt(id), userId);

    if (!asset) {
      res.status(404).json({ success: false, error: '素材不存在' });
      return;
    }

    res.json({ success: true, data: asset });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ success: false, error: '获取素材详情失败' });
  }
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response<ApiResponse<Asset>>) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: '请选择要上传的文件' });
      return;
    }

    const { folderId, type, description, tags } = req.body;
    const userId = req.user!.id;

    if (!folderId) {
      res.status(400).json({ success: false, error: '请指定文件夹' });
      return;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isImage = imageExtensions.includes(ext);

    let width: number | undefined;
    let height: number | undefined;
    let dominantColors: string[] = [];
    let thumbnailPath = '';

    if (isImage) {
      const imageResult = await processImage(req.file.path, req.file.originalname, uploadsDir);
      width = imageResult.width;
      height = imageResult.height;
      dominantColors = imageResult.dominantColors;
      thumbnailPath = imageResult.thumbnailPath;
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const thumbName = `${id}_thumb.jpg`;
      thumbnailPath = `/uploads/thumbnails/${thumbName}`;
      const fontThumbPath = path.join(uploadsDir, 'thumbnails', thumbName);
      fs.writeFileSync(fontThumbPath, Buffer.from(''));
      dominantColors = ['#666666', '#888888', '#aaaaaa'];
    }

    const { fileUrl } = await moveFile(req.file.path, uploadsDir, req.file.originalname);

    const asset = AssetRepository.create({
      name: req.body.name || req.file.originalname,
      type: (type as AssetType) || 'reference',
      filename: req.file.originalname,
      filePath: fileUrl,
      thumbnailPath,
      size: req.file.size,
      width,
      height,
      dominantColors,
      description: description as string,
      tags: tags ? JSON.parse(tags as string) : [],
      folderId: parseInt(folderId as string),
      uploaderId: userId,
    });

    AuditLogRepository.create({
      userId,
      action: 'upload',
      targetType: 'asset',
      targetId: asset.id,
      targetName: asset.name,
    });

    res.json({ success: true, data: asset, message: '上传成功' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: '上传失败，请稍后重试' });
  }
});

router.post('/:id/version', upload.single('file'), async (req: AuthRequest, res: Response<ApiResponse<Asset>>) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { note } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, error: '请选择要上传的文件' });
      return;
    }

    const existingAsset = AssetRepository.findById(parseInt(id), userId);
    if (!existingAsset) {
      res.status(404).json({ success: false, error: '素材不存在' });
      return;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isImage = imageExtensions.includes(ext);

    let width: number | undefined;
    let height: number | undefined;
    let dominantColors: string[] = [];

    if (isImage) {
      const imageResult = await processImage(req.file.path, req.file.originalname, uploadsDir);
      width = imageResult.width;
      height = imageResult.height;
      dominantColors = imageResult.dominantColors;
    } else {
      dominantColors = ['#666666', '#888888', '#aaaaaa'];
    }

    const { fileUrl } = await moveFile(req.file.path, uploadsDir, req.file.originalname);
    const version = AssetRepository.getNextVersion(parseInt(id));

    AssetRepository.addVersion({
      assetId: parseInt(id),
      version,
      filePath: fileUrl,
      width,
      height,
      dominantColors,
      note: note as string,
      uploaderId: userId,
    });

    const updatedAsset = AssetRepository.findById(parseInt(id), userId)!;

    AuditLogRepository.create({
      userId,
      action: 'edit',
      targetType: 'asset',
      targetId: parseInt(id),
      targetName: `${existingAsset.name} (${version})`,
    });

    res.json({ success: true, data: updatedAsset, message: '版本上传成功' });
  } catch (error) {
    console.error('Upload version error:', error);
    res.status(500).json({ success: false, error: '版本上传失败' });
  }
});

router.put('/:id', (req: AuthRequest, res: Response<ApiResponse<Asset>>) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = req.body as UpdateAssetRequest;

    const existingAsset = AssetRepository.findById(parseInt(id), userId);
    if (!existingAsset) {
      res.status(404).json({ success: false, error: '素材不存在' });
      return;
    }

    AssetRepository.update(parseInt(id), data);
    const updatedAsset = AssetRepository.findById(parseInt(id), userId)!;

    AuditLogRepository.create({
      userId,
      action: 'edit',
      targetType: 'asset',
      targetId: parseInt(id),
      targetName: updatedAsset.name,
    });

    res.json({ success: true, data: updatedAsset, message: '更新成功' });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const asset = AssetRepository.findById(parseInt(id), userId);
    if (!asset) {
      res.status(404).json({ success: false, error: '素材不存在' });
      return;
    }

    AssetRepository.delete(parseInt(id));

    AuditLogRepository.create({
      userId,
      action: 'delete',
      targetType: 'asset',
      targetId: parseInt(id),
      targetName: asset.name,
    });

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

router.post('/:id/favorite', (req: AuthRequest, res: Response<ApiResponse<{ isFavorite: boolean }>>) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const isFavorite = AssetRepository.toggleFavorite(userId, parseInt(id));

    res.json({ success: true, data: { isFavorite }, message: isFavorite ? '已收藏' : '已取消收藏' });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

router.post('/move', (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const { assetIds, targetFolderId } = req.body as MoveAssetsRequest;
    const userId = req.user!.id;

    if (!assetIds || !targetFolderId) {
      res.status(400).json({ success: false, error: '参数错误' });
      return;
    }

    AssetRepository.move(assetIds, targetFolderId);

    for (const assetId of assetIds) {
      AuditLogRepository.create({
        userId,
        action: 'move',
        targetType: 'asset',
        targetId: assetId,
        targetName: `移动到文件夹 ${targetFolderId}`,
      });
    }

    res.json({ success: true, message: '移动成功' });
  } catch (error) {
    console.error('Move assets error:', error);
    res.status(500).json({ success: false, error: '移动失败' });
  }
});

export default router;
