import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Lock,
  Send,
  Download,
  Heart,
  Image as ImageIcon,
  FileType,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../components/Toast';
import { Asset, Comment } from '../../shared/types';
import { formatDate, getTypeLabel, getTypeColor } from '../utils/format';

export const ShareView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [permission, setPermission] = useState<'readonly' | 'comment'>('readonly');
  const [viewerName, setViewerName] = useState('访客');

  useEffect(() => {
    if (token) {
      loadShareData();
    }
  }, [token]);

  const loadShareData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await api.shares.getByToken(token);
      if (response.success && response.data) {
        const data = response.data as any;
        setAssets(data.assets || []);
        setPermission(data.permission || 'readonly');
        setViewerName(data.createdBy?.name || '分享者');

        if (data.permission === 'comment') {
          const commentsRes = await api.shares.getComments(token);
          if (commentsRes.success && commentsRes.data) {
            setComments(commentsRes.data as Comment[]);
          }
        }
      } else {
        showToast(response.error || '分享链接无效或已过期', 'error');
      }
    } catch (error) {
      showToast('加载分享内容失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!token || !newComment.trim()) return;

    if (!guestName.trim()) {
      showToast('请输入您的名称', 'warning');
      return;
    }

    try {
      const response = await api.shares.addComment(token, {
        content: newComment.trim(),
        guestName: guestName.trim(),
      });
      if (response.success && response.data) {
        setComments([...comments, response.data as Comment]);
        setNewComment('');
        setShowNameInput(false);
      }
    } catch (error) {
      showToast('发送评论失败', 'error');
    }
  };

  const handleDownload = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.filePath;
    link.download = asset.filename;
    link.click();
  };

  const currentAsset = assets[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">分享链接无效</h1>
          <p className="text-gray-500">该分享链接已过期或不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {viewerName} 分享的素材
            </h1>
            <p className="text-sm text-gray-500">
              共 {assets.length} 个素材 · {permission === 'comment' ? '可评论' : '仅查看'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {getTypeLabel(currentAsset?.type || 'reference')}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative max-w-5xl w-full">
            {assets.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-3 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentIndex(Math.min(assets.length - 1, currentIndex + 1))}
                  disabled={currentIndex === assets.length - 1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-3 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              {currentAsset && (
                <div className="relative" style={{ minHeight: '500px' }}>
                  {currentAsset.type !== 'font' ? (
                    <img
                      src={currentAsset.filePath}
                      alt={currentAsset.name}
                      className="w-full h-full max-h-[70vh] object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <FileType className="w-24 h-24 text-gray-500 mb-4" />
                      <p className="text-white text-xl font-medium">{currentAsset.name}</p>
                      <p className="text-gray-400 mt-2">字体文件预览不支持，请下载查看</p>
                      <button
                        onClick={() => handleDownload(currentAsset)}
                        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        下载字体
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentAsset && (
              <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentAsset.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(currentAsset.type)}`}>
                        {getTypeLabel(currentAsset.type)}
                      </span>
                      {currentAsset.width && currentAsset.height && (
                        <span className="text-sm text-gray-500">
                          {currentAsset.width} × {currentAsset.height}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(currentAsset)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>

                {currentAsset.dominantColors && currentAsset.dominantColors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">主色调</p>
                    <div className="flex gap-2">
                      {currentAsset.dominantColors.map((color, index) => (
                        <div
                          key={index}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                          onClick={() => {
                            navigator.clipboard.writeText(color);
                            showToast('已复制颜色值', 'success');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentAsset.tags && currentAsset.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">标签</p>
                    <div className="flex flex-wrap gap-2">
                      {currentAsset.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentAsset.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">描述</p>
                    <p className="text-gray-700">{currentAsset.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {permission === 'comment' && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">评论区</h3>
              <p className="text-sm text-gray-500">{comments.length} 条评论</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Send className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无评论</p>
                  <p className="text-xs mt-1">发表您的反馈意见</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {(comment.user?.name || comment.guestName || '访').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.user?.name || comment.guestName || '访客'}
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

            <div className="p-4 border-t border-gray-100">
              {showNameInput && !guestName && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="输入您的名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}
              <div className="flex gap-2">
                {guestName && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs flex items-center">
                    {guestName}
                    <button
                      onClick={() => {
                        setGuestName('');
                        setShowNameInput(true);
                      }}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
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
        )}
      </div>

      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>分享链接由素材管理平台生成</span>
        </div>
      </footer>
    </div>
  );
};
