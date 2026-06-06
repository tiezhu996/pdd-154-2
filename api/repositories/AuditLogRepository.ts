import db from '../database.js';
import { AuditLog, AuditAction, AuditTargetType, User } from '../../shared/types.js';
import { UserRepository } from './UserRepository.js';

interface AuditLogRow {
  id: number;
  user_id: number;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: number;
  target_name: string;
  created_at: string;
}

function rowToAuditLog(row: AuditLogRow, user: User): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    user,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetName: row.target_name,
    createdAt: row.created_at,
  };
}

export const AuditLogRepository = {
  create(data: {
    userId: number;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: number;
    targetName: string;
  }): void {
    db.prepare(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, target_name)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      data.userId,
      data.action,
      data.targetType,
      data.targetId,
      data.targetName
    );
  },

  findAll(options?: {
    userId?: number;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): { logs: AuditLog[]; total: number } {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (options?.userId) {
      sql += ' AND user_id = ?';
      countSql += ' AND user_id = ?';
      params.push(options.userId);
      countParams.push(options.userId);
    }

    if (options?.action) {
      sql += ' AND action = ?';
      countSql += ' AND action = ?';
      params.push(options.action);
      countParams.push(options.action);
    }

    if (options?.startDate) {
      sql += ' AND created_at >= ?';
      countSql += ' AND created_at >= ?';
      params.push(options.startDate);
      countParams.push(options.startDate);
    }

    if (options?.endDate) {
      sql += ' AND created_at <= ?';
      countSql += ' AND created_at <= ?';
      params.push(options.endDate + ' 23:59:59');
      countParams.push(options.endDate + ' 23:59:59');
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = db.prepare(sql).all(...params) as AuditLogRow[];
    const countRow = db.prepare(countSql).get(...countParams) as { total: number };

    const logs = rows.map((row) => {
      const user = UserRepository.findById(row.user_id)!;
      return rowToAuditLog(row, user);
    });

    return {
      logs,
      total: countRow.total,
    };
  },
};
