import db from '../database.js';
import { Share, Comment, SharePermission, Asset } from '../../shared/types.js';
import { AssetRepository } from './AssetRepository.js';

interface ShareRow {
  id: number;
  token: string;
  folder_id: number | null;
  asset_ids: string;
  permission: SharePermission;
  expires_at: string | null;
  created_by: number;
  created_at: string;
}

interface CommentRow {
  id: number;
  share_id: number;
  asset_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

function rowToShare(row: ShareRow): Share {
  return {
    id: row.id,
    token: row.token,
    folderId: row.folder_id,
    assetIds: JSON.parse(row.asset_ids),
    permission: row.permission,
    expiresAt: row.expires_at || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    shareId: row.share_id,
    assetId: row.asset_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

export const ShareRepository = {
  findByToken(token: string): (Share & { assets: Asset[] }) | null {
    const row = db
      .prepare('SELECT * FROM shares WHERE token = ?')
      .get(token) as ShareRow | undefined;
    if (!row) return null;

    const share = rowToShare(row);
    const assetIds = share.assetIds;
    const assets: Asset[] = [];

    for (const assetId of assetIds) {
      const asset = db
        .prepare('SELECT * FROM assets WHERE id = ?')
        .get(assetId) as any;
      if (asset) {
        assets.push({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          filename: asset.filename,
          filePath: asset.file_path,
          thumbnailPath: asset.thumbnail_path,
          size: asset.size,
          width: asset.width || undefined,
          height: asset.height || undefined,
          dominantColors: JSON.parse(asset.dominant_colors),
          description: asset.description || undefined,
          tags: JSON.parse(asset.tags),
          folderId: asset.folder_id,
          uploaderId: asset.uploader_id,
          uploader: {} as any,
          isFavorite: false,
          versions: [],
          createdAt: asset.created_at,
          updatedAt: asset.updated_at,
        });
      }
    }

    return { ...share, assets };
  },

  create(data: {
    token: string;
    folderId?: number;
    assetIds: number[];
    permission: SharePermission;
    expiresAt?: string;
    createdBy: number;
  }): Share {
    const result = db
      .prepare(
        `INSERT INTO shares (token, folder_id, asset_ids, permission, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.token,
        data.folderId || null,
        JSON.stringify(data.assetIds),
        data.permission,
        data.expiresAt || null,
        data.createdBy
      );

    const row = db
      .prepare('SELECT * FROM shares WHERE id = ?')
      .get(result.lastInsertRowid as number) as ShareRow;
    return rowToShare(row);
  },

  delete(id: number): void {
    db.prepare('DELETE FROM shares WHERE id = ?').run(id);
  },

  isValid(token: string): boolean {
    const row = db
      .prepare('SELECT expires_at FROM shares WHERE token = ?')
      .get(token) as { expires_at: string | null } | undefined;
    if (!row) return false;
    if (row.expires_at && new Date(row.expires_at) < new Date()) return false;
    return true;
  },

  addComment(data: {
    shareId: number;
    assetId?: number;
    authorName: string;
    content: string;
  }): Comment {
    const result = db
      .prepare(
        `INSERT INTO comments (share_id, asset_id, author_name, content)
         VALUES (?, ?, ?, ?)`
      )
      .run(
        data.shareId,
        data.assetId || null,
        data.authorName,
        data.content
      );

    const row = db
      .prepare('SELECT * FROM comments WHERE id = ?')
      .get(result.lastInsertRowid as number) as CommentRow;
    return rowToComment(row);
  },

  getComments(shareId: number): Comment[] {
    const rows = db
      .prepare(
        'SELECT * FROM comments WHERE share_id = ? ORDER BY created_at DESC'
      )
      .all(shareId) as CommentRow[];
    return rows.map(rowToComment);
  },

  findByCreatedBy(userId: number): Share[] {
    const rows = db
      .prepare(
        'SELECT * FROM shares WHERE created_by = ? ORDER BY created_at DESC'
      )
      .all(userId) as ShareRow[];
    return rows.map(rowToShare);
  },
};
