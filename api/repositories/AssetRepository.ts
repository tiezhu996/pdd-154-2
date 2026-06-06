import db from '../database.js';
import { Asset, AssetVersion, AssetType, User } from '../../shared/types.js';
import { UserRepository } from './UserRepository.js';

interface AssetRow {
  id: number;
  name: string;
  type: AssetType;
  filename: string;
  file_path: string;
  thumbnail_path: string;
  size: number;
  width: number | null;
  height: number | null;
  dominant_colors: string;
  description: string | null;
  tags: string;
  folder_id: number;
  uploader_id: number;
  created_at: string;
  updated_at: string;
}

interface AssetVersionRow {
  id: number;
  asset_id: number;
  version: string;
  file_path: string;
  width: number | null;
  height: number | null;
  dominant_colors: string;
  note: string | null;
  uploader_id: number;
  created_at: string;
}

function rowToAsset(row: AssetRow, uploader: User, isFavorite: boolean, versions: AssetVersion[]): Asset {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    filename: row.filename,
    filePath: row.file_path,
    thumbnailPath: row.thumbnail_path,
    size: row.size,
    width: row.width || undefined,
    height: row.height || undefined,
    dominantColors: JSON.parse(row.dominant_colors),
    description: row.description || undefined,
    tags: JSON.parse(row.tags),
    folderId: row.folder_id,
    uploaderId: row.uploader_id,
    uploader,
    isFavorite,
    versions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVersion(row: AssetVersionRow): AssetVersion {
  return {
    id: row.id,
    assetId: row.asset_id,
    version: row.version,
    filePath: row.file_path,
    width: row.width || undefined,
    height: row.height || undefined,
    dominantColors: JSON.parse(row.dominant_colors),
    note: row.note || undefined,
    uploaderId: row.uploader_id,
    createdAt: row.created_at,
  };
}

export const AssetRepository = {
  findByFolderId(folderId: number, userId: number, options?: {
    search?: string;
    type?: AssetType;
    tag?: string;
  }): Asset[] {
    let sql = `
      SELECT a.* FROM assets a
      WHERE a.folder_id = ?
    `;
    const params: (string | number)[] = [folderId];

    if (options?.search) {
      sql += ' AND (a.name LIKE ? OR a.description LIKE ? OR a.tags LIKE ?)';
      const search = `%${options.search}%`;
      params.push(search, search, search);
    }

    if (options?.type) {
      sql += ' AND a.type = ?';
      params.push(options.type);
    }

    if (options?.tag) {
      sql += ' AND a.tags LIKE ?';
      params.push(`%"${options.tag}"%`);
    }

    sql += ' ORDER BY a.created_at DESC';

    const rows = db.prepare(sql).all(...params) as AssetRow[];

    return rows.map((row) => {
      const uploader = UserRepository.findById(row.uploader_id)!;
      const isFavorite = !!db
        .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND asset_id = ?')
        .get(userId, row.id);
      const versions = AssetRepository.findVersions(row.id);
      return rowToAsset(row, uploader, isFavorite, versions);
    });
  },

  findById(id: number, userId: number): Asset | null {
    const row = db
      .prepare('SELECT * FROM assets WHERE id = ?')
      .get(id) as AssetRow | undefined;
    if (!row) return null;

    const uploader = UserRepository.findById(row.uploader_id)!;
    const isFavorite = !!db
      .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND asset_id = ?')
      .get(userId, row.id);
    const versions = AssetRepository.findVersions(id);

    return rowToAsset(row, uploader, isFavorite, versions);
  },

  findVersions(assetId: number): AssetVersion[] {
    const rows = db
      .prepare('SELECT * FROM asset_versions WHERE asset_id = ? ORDER BY created_at DESC')
      .all(assetId) as AssetVersionRow[];
    return rows.map(rowToVersion);
  },

  findFavorites(userId: number): Asset[] {
    const rows = db
      .prepare(
        `SELECT a.* FROM assets a
         INNER JOIN favorites f ON f.asset_id = a.id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`
      )
      .all(userId) as AssetRow[];

    return rows.map((row) => {
      const uploader = UserRepository.findById(row.uploader_id)!;
      const versions = AssetRepository.findVersions(row.id);
      return rowToAsset(row, uploader, true, versions);
    });
  },

  findRecent(userId: number, limit: number = 20): Asset[] {
    const rows = db
      .prepare(
        `SELECT * FROM assets 
         WHERE uploader_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(userId, limit) as AssetRow[];

    return rows.map((row) => {
      const uploader = UserRepository.findById(row.uploader_id)!;
      const isFavorite = !!db
        .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND asset_id = ?')
        .get(userId, row.id);
      const versions = AssetRepository.findVersions(row.id);
      return rowToAsset(row, uploader, isFavorite, versions);
    });
  },

  create(data: {
    name: string;
    type: AssetType;
    filename: string;
    filePath: string;
    thumbnailPath: string;
    size: number;
    width?: number;
    height?: number;
    dominantColors: string[];
    description?: string;
    tags: string[];
    folderId: number;
    uploaderId: number;
  }): Asset {
    const result = db
      .prepare(
        `INSERT INTO assets 
         (name, type, filename, file_path, thumbnail_path, size, width, height, 
          dominant_colors, description, tags, folder_id, uploader_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.name,
        data.type,
        data.filename,
        data.filePath,
        data.thumbnailPath,
        data.size,
        data.width || null,
        data.height || null,
        JSON.stringify(data.dominantColors),
        data.description || null,
        JSON.stringify(data.tags),
        data.folderId,
        data.uploaderId
      );

    return AssetRepository.findById(result.lastInsertRowid as number, data.uploaderId)!;
  },

  addVersion(data: {
    assetId: number;
    version: string;
    filePath: string;
    width?: number;
    height?: number;
    dominantColors: string[];
    note?: string;
    uploaderId: number;
  }): void {
    db.prepare(
      `INSERT INTO asset_versions 
       (asset_id, version, file_path, width, height, dominant_colors, note, uploader_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.assetId,
      data.version,
      data.filePath,
      data.width || null,
      data.height || null,
      JSON.stringify(data.dominantColors),
      data.note || null,
      data.uploaderId
    );

    db.prepare(
      `UPDATE assets SET 
       file_path = ?, width = ?, height = ?, dominant_colors = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      data.filePath,
      data.width || null,
      data.height || null,
      JSON.stringify(data.dominantColors),
      data.assetId
    );
  },

  update(id: number, data: {
    name?: string;
    description?: string;
    tags?: string[];
  }): void {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description || null);
    }
    if (data.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  delete(id: number): void {
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  },

  move(assetIds: number[], targetFolderId: number): void {
    const placeholders = assetIds.map(() => '?').join(', ');
    db.prepare(`UPDATE assets SET folder_id = ? WHERE id IN (${placeholders})`)
      .run(targetFolderId, ...assetIds);
  },

  toggleFavorite(userId: number, assetId: number): boolean {
    const existing = db
      .prepare('SELECT id FROM favorites WHERE user_id = ? AND asset_id = ?')
      .get(userId, assetId) as { id: number } | undefined;

    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      return false;
    } else {
      db.prepare('INSERT INTO favorites (user_id, asset_id) VALUES (?, ?)').run(userId, assetId);
      return true;
    }
  },

  getNextVersion(assetId: number): string {
    const count = db
      .prepare('SELECT COUNT(*) as count FROM asset_versions WHERE asset_id = ?')
      .get(assetId) as { count: number };
    return `v${count.count + 2}`;
  },

  getStorageStats(): {
    totalUsed: number;
    byUser: { userId: number; userName: string; used: number }[];
    byType: { type: AssetType; used: number; count: number }[];
  } {
    const totalRow = db
      .prepare('SELECT COALESCE(SUM(size), 0) as total FROM assets')
      .get() as { total: number };

    const byUserRows = db
      .prepare(
        `SELECT u.id as userId, u.name as userName, COALESCE(SUM(a.size), 0) as used
         FROM users u LEFT JOIN assets a ON a.uploader_id = u.id
         GROUP BY u.id ORDER BY used DESC`
      )
      .all() as { userId: number; userName: string; used: number }[];

    const byTypeRows = db
      .prepare(
        `SELECT type, COALESCE(SUM(size), 0) as used, COUNT(*) as count
         FROM assets GROUP BY type`
      )
      .all() as { type: AssetType; used: number; count: number }[];

    return {
      totalUsed: totalRow.total,
      byUser: byUserRows,
      byType: byTypeRows,
    };
  },
};
