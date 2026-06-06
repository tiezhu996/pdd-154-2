import db from '../database.js';
import { User } from '../../shared/types.js';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'member' | 'admin';
  avatar: string | null;
  created_at: string;
}

function rowToUser(row: UserRow): Omit<User, 'passwordHash'> {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatar: row.avatar || undefined,
    createdAt: row.created_at,
  };
}

export const UserRepository = {
  findByEmail(email: string): (User & { passwordHash: string }) | null {
    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRow | undefined;
    if (!row) return null;
    return {
      ...rowToUser(row),
      passwordHash: row.password_hash,
    } as User & { passwordHash: string };
  },

  findById(id: number): Omit<User, 'passwordHash'> | null {
    const row = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  },

  findAll(): Omit<User, 'passwordHash'>[] {
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];
    return rows.map(rowToUser);
  },

  create(email: string, passwordHash: string, name: string): Omit<User, 'passwordHash'> {
    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
      )
      .run(email, passwordHash, name, 'member');
    return UserRepository.findById(result.lastInsertRowid as number)!;
  },

  updateRole(id: number, role: 'member' | 'admin'): void {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  },

  delete(id: number): void {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },
};
