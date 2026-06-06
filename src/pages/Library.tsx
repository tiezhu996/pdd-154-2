import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Move,
  Trash2,
  Share2,
  Download,
  X,
  Folder,
  Image as ImageIcon,
  FileType,
} from 'lucide-react';
import { useAssetStore } from '../store/useAssetStore';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { FolderTree } from '../components/FolderTree';
import { AssetCard } from '../components/AssetCard';
import { Asset } from '../../shared/types';
import { debounce, getTypeLabel } from '../utils/format';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    assets,
    folders,
    currentFolderId,
    selectedIds,
    isLoading,
    fetchAssets,
    fetchFolders,
    setCurrentFolder,
    selectAsset,
    clearSelection,
    setSearchQuery,
    setFilter,
    moveAssets,
    deleteAssets,
    uploadAsset,
    filters,
    searchQuery,
  } = useAssetStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'design' | 'reference' | 'font'>('reference');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [moveTargetFolder, setMoveTargetFolder] = useState<number | null>(null);
  const [sharePermission, setSharePermission] = useState<'readonly' | 'comment'>('readonly');
  const [shareLink, setShareLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFolders();
    fetchAssets();
  }, [fetchFolders, fetchAssets, currentFolderId]);

  const handleSearchChange = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

      if (fontExtensions.includes(ext)) {
        setUploadType('font');
      } else if (imageExtensions.includes(ext)) {
        setUploadType('reference');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      showToast('请选择要上传的文件', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folderId', String(currentFolderId));
      formData.append('type', uploadType);
      formData.append('description', uploadDescription);
      formData.append('tags', JSON.stringify(uploadTags.split(',').map(t => t.trim()).filter(Boolean)));

      const result = await uploadAsset(formData);
      if (result) {
        showToast('上传成功', 'success');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTags('');
        setUploadDescription('');
      } else {
        showToast('上传失败，请稍后重试', 'error');
      }
    } catch (error) {
      showToast('上传失败，请稍后重试', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMove = async () => {
    if (!moveTargetFolder) {
      showToast('请选择目标文件夹', 'warning');
      return;
    }
    const success = await moveAssets(selectedIds, moveTargetFolder);
    if (success) {
      showToast(`已将 ${selectedIds.length} 个素材移动到目标文件夹`, 'success');
      setShowMoveModal(false);
      setMoveTargetFolder(null);
    } else {
      showToast('移动失败，请稍后重试', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个素材吗？此操作不可撤销。`)) {
      return;
    }
    const success = await deleteAssets(selectedIds);
    if (success) {
      showToast(`已删除 ${selectedIds.length} 个素材`, 'success');
    } else {
      showToast('删除失败，请稍后重试', 'error');
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.shares.create({
        assetIds: selectedIds,
        permission: sharePermission,
      });
      if (response.success && response.data) {
        const link = `${window.location.origin}/share/${(response.data as any).token}`;
        setShareLink(link);
        showToast('分享链接已生成', 'success');
      } else {
        showToast(response.error || '生成分享链接失败', 'error');
      }
    } catch (error) {
      showToast('生成分享链接失败', 'error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showToast('链接已复制到剪贴板', 'success');
  };

  const handleViewAsset = (asset: Asset) => {
    navigate(`/asset/${asset.id}`);
  };

  const flattenFolders = (folders: any[], parentId: number | null = null): any[] => {
    let result: any[] = [];
    for (const folder of folders) {
      if (folder.id !== currentFolderId) {
        result.push(folder);
      }
      if (folder.children) {
        result = result.concat(flattenFolders(folder.children, folder.id));
      }
    }
    return result;
  };

  const allFolders = flattenFolders(folders);

  return (
    <div className="flex h-full">
      <aside className="w-72 border-r border-gray-200 bg-white flex flex-col">
        <FolderTree />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索当前文件夹..."
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-72 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter('type', filters.type === 'design' ? undefined : 'design')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filters.type === 'design'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  设计稿
                </button>
                <button
                  onClick={() => setFilter('type', filters.type === 'reference' ? undefined : 'reference')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filters.type === 'reference'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  参考图
                </button>
                <button
                  onClick={() => setFilter('type', filters.type === 'font' ? undefined : 'font')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filters.type === 'font'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  字体包
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-1 mr-4">
                  <span className="text-sm text-gray-500 mr-2">已选 {selectedIds.length} 项</span>
                  <button
                    onClick={() => setShowMoveModal(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="移动"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="分享"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="取消选择"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                上传素材
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">暂无素材</p>
              <p className="text-sm mt-1">点击右上角按钮上传第一个素材</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onView={handleViewAsset}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleViewAsset(asset)}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {asset.type !== 'font' ? (
                      <img src={asset.thumbnailPath} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileType className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{asset.name}</p>
                    <p className="text-sm text-gray-500">
                      {getTypeLabel(asset.type)} · {asset.width}×{asset.height} · {new Date(asset.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {asset.dominantColors?.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="上传素材"
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.ttf,.otf,.woff,.woff2"
              onChange={handleFileSelect}
            />
            {uploadFile ? (
              <div>
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-indigo-500" />
                <p className="font-medium text-gray-900">{uploadFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="font-medium text-gray-700">点击或拖拽文件到此处上传</p>
                <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、GIF、WebP、字体文件等</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">素材类型</label>
            <div className="flex gap-2">
              {(['design', 'reference', 'font'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUploadType(type)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    uploadType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
            <input
              type="text"
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              placeholder="UI, 移动端, 深色"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="添加素材描述..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? '上传中...' : '上传'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title={`移动 ${selectedIds.length} 个素材`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">选择目标文件夹：</p>
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            {allFolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setMoveTargetFolder(folder.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  moveTargetFolder === folder.id ? 'bg-indigo-50 text-indigo-700' : ''
                }`}
              >
                <Folder className="w-4 h-4 text-amber-500" />
                {folder.name}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowMoveModal(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleMove}
              disabled={!moveTargetFolder}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              移动
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareLink('');
        }}
        title={`分享 ${selectedIds.length} 个素材`}
        width="max-w-lg"
      >
        <div className="space-y-4">
          {!shareLink ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">权限设置</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSharePermission('readonly')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                      sharePermission === 'readonly'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">仅查看</div>
                    <div className="text-xs mt-1 opacity-70">客户只能浏览素材</div>
                  </button>
                  <button
                    onClick={() => setSharePermission('comment')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                      sharePermission === 'comment'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">可评论</div>
                    <div className="text-xs mt-1 opacity-70">客户可以添加评论反馈</div>
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  生成链接
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">分享链接已生成！</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                >
                  复制链接
                </button>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setShareLink('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  完成
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
