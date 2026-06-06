import db from '../database.js';
import { Folder } from '../../shared/types.js';

interface FolderRow {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
}

function rowToFolder(row: FolderRow, assetCount: number = 0): Folder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    assetCount,
    createdAt: row.created_at,
  };
}

export const FolderRepository = {
  findAllWithCount(): Folder[] {
    const rows = db
      .prepare(
        `SELECT f.*, 
         (SELECT COUNT(*) FROM assets a WHERE a.folder_id = f.id) as asset_count
         FROM folders f ORDER BY f.name`
      )
      .all() as (FolderRow & { asset_count: number })[];

    const folders = rows.map((row) => rowToFolder(row, row.asset_count));
    return FolderRepository.buildTree(folders);
  },

  buildTree(folders: Folder[], parentId: number | null = null): Folder[] {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((folder) => ({
        ...folder,
        children: FolderRepository.buildTree(folders, folder.id),
      }));
  },

  findById(id: number): (Folder & { path?: string }) | null {
    const row = db
      .prepare('SELECT * FROM folders WHERE id = ?')
      .get(id) as FolderRow | undefined;
    if (!row) return null;

    const countRow = db
      .prepare('SELECT COUNT(*) as count FROM assets WHERE folder_id = ?')
      .get(id) as { count: number };

    return rowToFolder(row, countRow.count);
  },

  create(name: string, parentId: number | null): Folder {
    const result = db
      .prepare('INSERT INTO folders (name, parent_id) VALUES (?, ?)')
      .run(name, parentId);
    return FolderRepository.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, name: string): void {
    db.prepare('UPDATE folders SET name = ? WHERE id = ?').run(name, id);
  },

  delete(id: number): void {
    db.prepare('DELETE FROM folders WHERE id = ?').run(id);
  },

  getFolderPath(folderId: number): string {
    let path: string[] = [];
    let currentId: number | null = folderId;

    while (currentId) {
      const row = db
        .prepare('SELECT id, name, parent_id FROM folders WHERE id = ?')
        .get(currentId) as FolderRow | undefined;
      if (!row) break;
      path.unshift(row.name);
      currentId = row.parent_id;
    }

    return path.join(' / ');
  },
};
