export interface User {
  id: number;
  email: string;
  name: string;
  role: 'member' | 'admin';
  avatar?: string;
  storageUsed?: number;
  assetCount?: number;
  createdAt: string;
}

export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  children?: Folder[];
  assetCount: number;
  createdAt: string;
}

export type AssetType = 'design' | 'reference' | 'font';

export interface Asset {
  id: number;
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
  uploader: User;
  isFavorite: boolean;
  versions: AssetVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetVersion {
  id: number;
  assetId: number;
  version: string;
  filePath: string;
  size?: number;
  width?: number;
  height?: number;
  description?: string;
  uploaderId: number;
  uploadedBy?: User;
  dominantColors?: string[];
  note?: string;
  createdAt: string;
}

export type SharePermission = 'readonly' | 'comment';

export interface Share {
  id: number;
  token: string;
  folderId: number | null;
  assetIds: number[];
  permission: SharePermission;
  expiresAt?: string;
  createdBy: number;
  createdAt: string;
}

export interface ShareAssetInfo {
  id: number;
  name: string;
  thumbnailPath: string;
  type: AssetType;
}

export interface ShareFolderInfo {
  id: number;
  name: string;
}

export interface ShareWithDetails extends Share {
  assets: ShareAssetInfo[];
  folder?: ShareFolderInfo | null;
}

export interface Comment {
  id: number;
  shareId?: number;
  assetId?: number;
  userId?: number;
  user?: User;
  guestName?: string;
  authorName?: string;
  content: string;
  createdAt: string;
}

export type AuditAction = 'upload' | 'delete' | 'move' | 'download' | 'share' | 'edit';
export type AuditTargetType = 'asset' | 'folder';

export interface AuditLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  targetType?: AuditTargetType;
  targetId?: number;
  targetName?: string;
  assetId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface StorageStats {
  totalSize: number;
  totalAssets: number;
  totalShares?: number;
  totalQuota?: number;
  totalUsed?: number;
  byType?: Record<string, { size: number; count: number }>;
  byUser?: { userId: number; userName: string; used: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: number;
}

export interface UploadAssetRequest {
  folderId: number;
  type: AssetType;
  description?: string;
  tags?: string[];
}

export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface CreateShareRequest {
  folderId?: number;
  assetIds?: number[];
  permission: SharePermission;
  expiresAt?: string;
}

export interface AddCommentRequest {
  assetId?: number;
  authorName: string;
  content: string;
}

export interface MoveAssetsRequest {
  assetIds: number[];
  targetFolderId: number;
}
