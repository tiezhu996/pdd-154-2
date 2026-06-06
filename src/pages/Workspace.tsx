import React, { useState, useEffect } from 'react';
import {
  Clock,
  Heart,
  Folder,
  Upload,
  Download,
  Star,
  TrendingUp,
  HardDrive,
  Image as ImageIcon,
  FileType,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../utils/api';
import { Asset } from '../../shared/types';
import { formatFileSize, formatDate, getTypeLabel, getTypeColor } from '../utils/format';

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [favoriteAssets, setFavoriteAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalSize: 0,
    thisWeekUploads: 0,
    totalFolders: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recentRes, favRes, statsRes, foldersRes] = await Promise.all([
        api.assets.getRecent(),
        api.assets.getFavorites(),
        api.assets.getStorageStats(),
        api.folders.getAll(),
      ]);

      if (recentRes.success && recentRes.data) {
        setRecentAssets(recentRes.data as Asset[]);
      }
      if (favRes.success && favRes.data) {
        setFavoriteAssets(favRes.data as Asset[]);
      }
      if (statsRes.success && statsRes.data) {
        const storageStats = statsRes.data as any;
        setStats({
          totalAssets: storageStats.totalAssets || 0,
          totalSize: storageStats.totalSize || 0,
          thisWeekUploads: recentRes.data ? (recentRes.data as Asset[]).length : 0,
          totalFolders: foldersRes.data ? (foldersRes.data as any[]).length : 0,
        });
      }
    } catch (error) {
      console.error('加载数据失败', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: '总素材数',
      value: stats.totalAssets,
      icon: ImageIcon,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      title: '已用存储空间',
      value: formatFileSize(stats.totalSize),
      icon: HardDrive,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      title: '本周上传',
      value: stats.thisWeekUploads,
      icon: Upload,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: '文件夹数',
      value: stats.totalFolders,
      icon: Folder,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

  const displayedAssets = activeTab === 'recent' ? recentAssets : favoriteAssets;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">个人工作台</h1>
        <p className="text-gray-500 mt-1">
          欢迎回来，{user?.name}！查看您的最近活动和收藏内容。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              最近上传
              <span className="ml-1 px-2 py-0.5 text-xs bg-white/50 rounded-full">
                {recentAssets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              我的收藏
              <span className="ml-1 px-2 py-0.5 text-xs bg-white/50 rounded-full">
                {favoriteAssets.length}
              </span>
            </button>
          </div>
          <button
            onClick={() => navigate('/library')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            查看全部 →
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : displayedAssets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {activeTab === 'recent' ? (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">暂无上传记录</p>
                  <p className="text-sm mt-1">前往素材库上传您的第一个素材</p>
                </>
              ) : (
                <>
                  <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">暂无收藏</p>
                  <p className="text-sm mt-1">收藏您喜欢的素材以便快速访问</p>
                </>
              )}
              <button
                onClick={() => navigate('/library')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                前往素材库
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {displayedAssets.slice(0, 10).map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => navigate(`/asset/${asset.id}`)}
                  className="group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {asset.type !== 'font' ? (
                      <img
                        src={asset.thumbnailPath}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileType className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(asset.type)}`}>
                        {getTypeLabel(asset.type)}
                      </span>
                    </div>
                    {activeTab === 'favorites' && (
                      <div className="absolute top-2 right-2">
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate" title={asset.name}>
                      {asset.name}
                    </h4>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(asset.createdAt)}
                      </span>
                      {asset.width && asset.height && (
                        <span>{asset.width}×{asset.height}</span>
                      )}
                    </div>
                    {asset.dominantColors && asset.dominantColors.length > 0 && (
                      <div className="flex gap-0.5 mt-2">
                        {asset.dominantColors.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-sm border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            存储空间使用
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">已使用空间</span>
                <span className="font-medium text-gray-900">{formatFileSize(stats.totalSize)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">总容量 10 GB</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3">按类型分布</h4>
              <div className="space-y-3">
                {[
                  { type: 'design', label: '设计稿', count: Math.round(stats.totalAssets * 0.5) },
                  { type: 'reference', label: '参考图', count: Math.round(stats.totalAssets * 0.35) },
                  { type: 'font', label: '字体包', count: Math.round(stats.totalAssets * 0.15) },
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${getTypeColor(item.type).replace('bg-', 'bg-').replace('text-', 'text-').split(' ')[0]}`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count} 个</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" />
            快捷操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/library')}
              className="p-4 bg-indigo-50 rounded-xl text-left hover:bg-indigo-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-gray-900">上传素材</p>
              <p className="text-xs text-gray-500 mt-1">上传设计稿、参考图等</p>
            </button>
            <button
              onClick={() => navigate('/library')}
              className="p-4 bg-emerald-50 rounded-xl text-left hover:bg-emerald-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Folder className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-gray-900">浏览素材</p>
              <p className="text-xs text-gray-500 mt-1">查看和管理所有素材</p>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className="p-4 bg-rose-50 rounded-xl text-left hover:bg-rose-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-gray-900">我的收藏</p>
              <p className="text-xs text-gray-500 mt-1">快速访问收藏内容</p>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-4 bg-amber-50 rounded-xl text-left hover:bg-amber-100 transition-colors group"
              >
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-gray-900">管理后台</p>
                <p className="text-xs text-gray-500 mt-1">团队数据和操作日志</p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
