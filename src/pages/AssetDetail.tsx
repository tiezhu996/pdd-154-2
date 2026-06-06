import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  Download,
  Share2,
  Trash2,
  Upload,
  Tag,
  Clock,
  User,
  Image as ImageIcon,
  FileType,
  Plus,
  X,
  Send,
  History,
  Maximize2,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { api } from '../utils/api';
import { Asset, AssetVersion, Comment } from '../../shared/types';
import { formatFileSize, formatDate, getTypeLabel, getTypeColor } from '../utils/format';

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AssetVersion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadAssetData(parseInt(id));
    }
  }, [id]);

  const loadAssetData = async (assetId: number) => {
    setIsLoading(true);
    try {
      const [assetRes, versionsRes, commentsRes, favRes] = await Promise.all([
        api.assets.getById(assetId),
        api.assets.getVersions(assetId),
        api.assets.getComments(assetId),
        api.assets.checkFavorite(assetId),
      ]);

      if (assetRes.success && assetRes.data) {
        setAsset(assetRes.data as Asset);
      }
      if (versionsRes.success && versionsRes.data) {
        setVersions(versionsRes.data as AssetVersion[]);
      }
      if (commentsRes.success && commentsRes.data) {
        setComments(commentsRes.data as Comment[]);
      }
      if (favRes.success) {
        setIsFavorite((favRes.data as any).isFavorite);
      }
    } catch (error) {
      showToast('加载素材详情失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!asset) return;
    try {
      const response = await api.assets.toggleFavorite(asset.id);
      if (response.success) {
        setIsFavorite(!isFavorite);
        showToast(isFavorite ? '已取消收藏' : '已添加收藏', 'success');
      }
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleAddTag = async () => {
    if (!asset || !newTag.trim()) return;
    try {
      const response = await api.assets.addTag(asset.id, newTag.trim());
      if (response.success && response.data) {
        setAsset(response.data as Asset);
        setNewTag('');
        showToast('标签已添加', 'success');
      }
    } catch (error) {
      showToast('添加标签失败', 'error');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!asset) return;
    try {
      const response = await api.assets.removeTag(asset.id, tag);
      if (response.success && response.data) {
        setAsset(response.data as Asset);
        showToast('标签已移除', 'success');
      }
    } catch (error) {
      showToast('移除标签失败', 'error');
    }
  };

  const handleSubmitComment = async () => {
    if (!asset || !newComment.trim()) return;
    try {
      const response = await api.assets.addComment(asset.id, newComment.trim());
      if (response.success && response.data) {
        setComments([...comments, response.data as Comment]);
        setNewComment('');
      }
    } catch (error) {
      showToast('发送评论失败', 'error');
    }
  };

  const handleUploadNewVersion = async () => {
    if (!asset || !uploadFile) {
      showToast('请选择要上传的文件', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadDescription);

      const response = await api.assets.addVersion(asset.id, formData);
      if (response.success) {
        showToast('新版本上传成功', 'success');
        setShowVersionModal(false);
        setUploadFile(null);
        setUploadDescription('');
        loadAssetData(asset.id);
      } else {
        showToast(response.error || '上传失败', 'error');
      }
    } catch (error) {
      showToast('上传失败', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreVersion = async (version: AssetVersion) => {
    if (!asset) return;
    if (!confirm('确定要恢复到此版本吗？当前版本将被保存为历史版本。')) {
      return;
    }
    try {
      const response = await api.assets.restoreVersion(asset.id, version.id);
      if (response.success && response.data) {
        setAsset(response.data as Asset);
        loadAssetData(asset.id);
        showToast('版本已恢复', 'success');
        setSelectedVersion(null);
      }
    } catch (error) {
      showToast('恢复失败', 'error');
    }
  };

  const handleDownload = () => {
    if (!asset) return;
    const link = document.createElement('a');
    link.href = asset.filePath;
    link.download = asset.filename;
    link.click();
  };

  const handleDelete = async () => {
    if (!asset) return;
    if (!confirm('确定要删除这个素材吗？此操作不可撤销。')) {
      return;
    }
    try {
      const response = await api.assets.delete(asset.id);
      if (response.success) {
        showToast('素材已删除', 'success');
        navigate('/library');
      }
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const TypeIcon = asset?.type === 'font' ? FileType : ImageIcon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">素材不存在</p>
        <button
          onClick={() => navigate('/library')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          返回素材库
        </button>
      </div>
    );
  }

  const currentVersion = versions[0];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/library')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(asset.type)}`}>
                {getTypeLabel(asset.type)}
              </span>
              <span className="text-sm text-gray-500">
                {asset.width} × {asset.height}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-md transition-colors ${
              isFavorite
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="下载"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowVersionModal(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="上传新版本"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="删除"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '400px' }}>
              {asset.type !== 'font' ? (
                <img
                  src={selectedVersion?.filePath || asset.filePath}
                  alt={asset.name}
                  className="max-w-full max-h-[600px] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center py-16">
                  <FileType className="w-24 h-24 text-gray-500 mb-4" />
                  <p className="text-white text-lg font-medium">{asset.name}</p>
                  <p className="text-gray-400 text-sm mt-1">字体文件预览不支持</p>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">基本信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">文件大小</span>
                    <span className="text-gray-900">{formatFileSize(asset.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">分辨率</span>
                    <span className="text-gray-900">{asset.width} × {asset.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">上传时间</span>
                    <span className="text-gray-900">{formatDate(asset.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">版本</span>
                    <span className="text-gray-900">v{versions.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">主色调</h3>
                <div className="flex gap-2">
                  {asset.dominantColors?.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 h-12 rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                      onClick={() => {
                        navigator.clipboard.writeText(color);
                        showToast('已复制颜色值', 'success');
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {asset.dominantColors?.map((color, index) => (
                    <span key={index} className="flex-1 text-center text-xs text-gray-500">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {asset.description && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">描述</h3>
                <p className="text-gray-700 text-sm">{asset.description}</p>
              </div>
            )}

            <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {asset.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-indigo-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="添加标签"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                版本历史
              </h3>
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          v{versions.length - index}
                        </span>
                        <span className="font-medium text-gray-900">
                          {version.description || `版本 ${versions.length - index}`}
                        </span>
                      </div>
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(version);
                          }}
                          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                        >
                          恢复此版本
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.uploadedBy?.name || '未知用户'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(version.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" />
                        {version.width} × {version.height}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">评论区</h3>
            <p className="text-sm text-gray-500">{comments.length} 条评论</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Send className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">暂无评论</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-indigo-600">
                      {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {comment.user?.name || '未知用户'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="添加评论..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setUploadFile(null);
          setUploadDescription('');
        }}
        title="上传新版本"
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
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            {uploadFile ? (
              <div>
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-indigo-500" />
                <p className="font-medium text-gray-900">{uploadFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="font-medium text-gray-700">点击选择新文件</p>
                <p className="text-sm text-gray-500 mt-1">上传替换当前素材</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">版本说明</label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="描述此版本的更改..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setShowVersionModal(false);
                setUploadFile(null);
                setUploadDescription('');
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUploadNewVersion}
              disabled={!uploadFile || isUploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? '上传中...' : '上传新版本'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
