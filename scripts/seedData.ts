import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file: string) => file.endsWith('.sql'))
    .sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedMigrations = db
    .prepare('SELECT filename FROM migrations')
    .all() as { filename: string }[];
  const appliedFilenames = new Set(appliedMigrations.map((m) => m.filename));

  for (const file of migrationFiles) {
    if (!appliedFilenames.has(file)) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      db.exec(sql);
      db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
      console.log(`Applied migration: ${file}`);
    }
  }
}

runMigrations();

db.pragma('foreign_keys = OFF');

function randomColor() {
  const colors = ['#1e3a8a', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateColors() {
  return JSON.stringify([
    randomColor(),
    randomColor(),
    randomColor(),
    randomColor(),
    randomColor(),
  ]);
}

function generateTags() {
  const allTags = ['UI', '移动端', '网页', '深色模式', '浅色模式', '品牌', '插画', '图标', '3D', '渐变', '简约', '复古', '科技', '自然'];
  const count = Math.floor(Math.random() * 4) + 1;
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  return JSON.stringify(shuffled.slice(0, count));
}

async function seed() {
  console.log('开始填充模拟数据...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@example.com', name: '管理员', password: hashedPassword, role: 'admin' },
    { email: 'designer1@example.com', name: '张设计', password: hashedPassword, role: 'member' },
    { email: 'designer2@example.com', name: '李美工', password: hashedPassword, role: 'member' },
    { email: 'designer3@example.com', name: '王创意', password: hashedPassword, role: 'member' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, name, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.email, user.name, user.password, user.role);
    console.log(`已创建用户: ${user.name} (${user.email})`);
  });

  const folders = [
    { name: '品牌设计', parentId: 1 },
    { name: 'UI界面', parentId: 1 },
    { name: '运营素材', parentId: 1 },
    { name: '参考图库', parentId: 1 },
    { name: '字体资源', parentId: 1 },
    { name: 'Logo设计', parentId: 2 },
    { name: 'VI系统', parentId: 2 },
    { name: 'APP设计', parentId: 3 },
    { name: '网页设计', parentId: 3 },
    { name: '活动海报', parentId: 4 },
    { name: '社交媒体', parentId: 4 },
  ];

  const insertFolder = db.prepare(`
    INSERT OR IGNORE INTO folders (name, parent_id)
    VALUES (?, ?)
  `);

  folders.forEach(folder => {
    insertFolder.run(folder.name, folder.parentId);
    console.log(`已创建文件夹: ${folder.name}`);
  });

  const assetNames = [
    { name: '品牌主视觉设计稿', type: 'design', folderId: 6 },
    { name: '移动端首页设计', type: 'design', folderId: 8 },
    { name: '产品详情页UI', type: 'design', folderId: 8 },
    { name: '企业官网首页', type: 'design', folderId: 9 },
    { name: '双11活动海报', type: 'design', folderId: 10 },
    { name: '618大促Banner', type: 'design', folderId: 10 },
    { name: '品牌色参考图', type: 'reference', folderId: 5 },
    { name: '极简风格参考', type: 'reference', folderId: 5 },
    { name: '渐变色彩搭配', type: 'reference', folderId: 5 },
    { name: '创意构图参考', type: 'reference', folderId: 5 },
    { name: '科技感背景素材', type: 'reference', folderId: 5 },
    { name: '自然风景参考', type: 'reference', folderId: 5 },
    { name: 'HarmonyOS Sans字体', type: 'font', folderId: 5 },
    { name: '思源黑体字体包', type: 'font', folderId: 5 },
    { name: '站酷文艺体', type: 'font', folderId: 5 },
    { name: '微信小程序设计规范', type: 'design', folderId: 8 },
    { name: '会员中心页面', type: 'design', folderId: 8 },
    { name: '支付流程设计', type: 'design', folderId: 8 },
    { name: '个人中心界面', type: 'design', folderId: 8 },
    { name: '登录注册页面', type: 'design', folderId: 8 },
    { name: '品牌Logo矢量图', type: 'design', folderId: 6 },
    { name: '品牌VI基础部分', type: 'design', folderId: 7 },
    { name: '品牌VI应用部分', type: 'design', folderId: 7 },
    { name: '春节活动海报', type: 'design', folderId: 10 },
    { name: '五一促销海报', type: 'design', folderId: 10 },
    { name: '国庆节宣传图', type: 'design', folderId: 10 },
    { name: '双十一预售页面', type: 'design', folderId: 9 },
    { name: '产品发布会邀请函', type: 'design', folderId: 10 },
    { name: 'H5活动页面设计', type: 'design', folderId: 9 },
    { name: '数据可视化大屏', type: 'design', folderId: 9 },
  ];

  const insertAsset = db.prepare(`
    INSERT INTO assets (name, filename, type, folder_id, file_path, thumbnail_path, size, width, height, dominant_colors, tags, description, uploader_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  assetNames.forEach((asset, index) => {
    const width = [1920, 1080, 750, 1440, 2560][Math.floor(Math.random() * 5)];
    const height = [1080, 1920, 1334, 900, 1440][Math.floor(Math.random() * 5)];
    const size = Math.floor(Math.random() * 10 * 1024 * 1024) + 100 * 1024;
    const userId = (index % 3) + 2;
    
    const filename = `${asset.name.replace(/\s+/g, '_')}.${asset.type === 'font' ? 'ttf' : 'png'}`;
    const filePath = `/uploads/${filename}`;
    const thumbnailPath = `/uploads/thumbnails/${filename}`;
    const dominantColors = generateColors();
    const tags = generateTags();
    const description = `这是${asset.name}的详细描述，包含了设计理念和使用场景说明。`;

    insertAsset.run(
      asset.name,
      filename,
      asset.type,
      asset.folderId,
      filePath,
      thumbnailPath,
      size,
      width,
      height,
      dominantColors,
      tags,
      description,
      userId
    );

    const insertVersion = db.prepare(`
      INSERT INTO asset_versions (asset_id, version, file_path, width, height, dominant_colors, note, uploader_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertVersion.run(
      index + 1,
      'v1',
      filePath,
      width,
      height,
      dominantColors,
      '初始版本',
      userId
    );

    if (Math.random() > 0.7) {
      insertVersion.run(
        index + 1,
        'v2',
        filePath,
        width,
        height,
        dominantColors,
        '优化细节调整',
        userId
      );
    }

    console.log(`已创建素材: ${asset.name}`);
  });

  const actions = ['upload', 'download', 'view', 'delete', 'move', 'share', 'favorite', 'login', 'comment'];
  const insertLog = db.prepare(`
    INSERT INTO audit_logs (user_id, action, asset_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 50; i++) {
    const userId = Math.floor(Math.random() * 4) + 1;
    const action = actions[Math.floor(Math.random() * actions.length)];
    const assetId = Math.random() > 0.3 ? Math.floor(Math.random() * 30) + 1 : null;
    const details = `用户执行了${action}操作`;
    const ipAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const timestamp = date.toISOString();

    const log = insertLog.run(userId, action, assetId, details, ipAddress);
    db.prepare('UPDATE audit_logs SET created_at = ? WHERE id = ?').run(timestamp, log.lastInsertRowid);
  }
  console.log('已创建50条操作日志');

  const insertFavorite = db.prepare(`
    INSERT OR IGNORE INTO favorites (user_id, asset_id)
    VALUES (?, ?)
  `);

  for (let i = 0; i < 20; i++) {
    const userId = Math.floor(Math.random() * 4) + 1;
    const assetId = Math.floor(Math.random() * 30) + 1;
    insertFavorite.run(userId, assetId);
  }
  console.log('已创建20条收藏记录');

  const comments = [
    '这个设计很棒！色彩搭配很和谐。',
    '建议调整一下字体大小，可能会更清晰。',
    '整体风格很统一，继续保持！',
    '图标可以再优化一下，现在有点模糊。',
    '这个方案我觉得可以，过了。',
    '能不能再出几个配色方案供选择？',
    '交互逻辑很清晰，用户体验不错。',
    '建议增加一些动效，会更生动。',
    '整体感觉很专业，辛苦了！',
    '这个方向对了，继续深化。',
  ];

  const insertComment = db.prepare(`
    INSERT INTO comments (asset_id, user_id, content)
    VALUES (?, ?, ?)
  `);

  for (let i = 0; i < 30; i++) {
    const assetId = Math.floor(Math.random() * 30) + 1;
    const userId = Math.floor(Math.random() * 4) + 1;
    const content = comments[Math.floor(Math.random() * comments.length)];

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 15));
    const timestamp = date.toISOString();

    const result = insertComment.run(assetId, userId, content);
    db.prepare('UPDATE comments SET created_at = ? WHERE id = ?').run(timestamp, result.lastInsertRowid);
  }
  console.log('已创建30条评论');

  db.pragma('foreign_keys = ON');
  db.close();
  console.log('\n模拟数据填充完成！');
  console.log('测试账号:');
  console.log('  管理员: admin@example.com / admin123');
  console.log('  普通用户: designer1@example.com / password123');
}

seed().catch(console.error);
