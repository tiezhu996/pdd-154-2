import React, { useState } from 'react';
import { Heart, Download, Eye, FileImage, FileText, FileType, Maximize2 } from 'lucide-react';
import { useAssetStore } from '../store/useAssetStore';
import { cn } from '../lib/utils';
import { Asset } from '../../shared/types';

interface AssetCardProps {
  asset: Asset;
  onView?: (asset: Asset) => void;
  className?: string;
}

const typeIcons = {
  design: FileImage,
  reference: FileImage,
  font: FileType,
};

const typeLabels = {
  design: '设计稿',
  reference: '参考图',
  font: '字体包',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onView, className }) => {
  const { toggleFavorite, selectAsset, selectedIds } = useAssetStore();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isSelected = selectedIds.includes(asset.id);
  const TypeIcon = typeIcons[asset.type];

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(asset.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      selectAsset(asset.id, true);
    } else {
      selectAsset(asset.id, false);
      if (onView) {
        onView(asset);
      }
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = asset.filePath;
    link.download = asset.filename;
    link.click();
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(asset);
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-white rounded-lg border overflow-hidden cursor-pointer transition-all duration-200',
        isHovered
          ? 'shadow-lg -translate-y-0.5 border-indigo-200'
          : 'shadow-sm border-slate-200 hover:border-slate-300',
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : '',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        {asset.type !== 'font' && !imageError ? (
          <img
            src={asset.thumbnailPath}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <FileType className="w-12 h-12 text-slate-400" />
          </div>
        )}

        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        <div
          className={cn(
            'absolute top-2 right-2 flex gap-1 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'p-1.5 rounded-md backdrop-blur-sm transition-all duration-200',
              asset.isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-slate-600 hover:bg-white hover:text-red-500'
            )}
            title={asset.isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart className={cn('w-4 h-4', asset.isFavorite ? 'fill-current' : '')} />
          </button>
          <button
            onClick={handleView}
            className="p-1.5 bg-white/90 text-slate-600 rounded-md backdrop-blur-sm hover:bg-white hover:text-indigo-600 transition-all duration-200"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 bg-white/90 text-slate-600 rounded-md backdrop-blur-sm hover:bg-white hover:text-indigo-600 transition-all duration-200"
            title="下载"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div
          className={cn(
            'absolute top-2 left-2 flex gap-1 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-md">
            {typeLabels[asset.type]}
          </span>
        </div>

        {asset.width && asset.height && (
          <div
            className={cn(
              'absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-black/50 text-white text-xs rounded-md backdrop-blur-sm transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Maximize2 className="w-3 h-3" />
            {asset.width} × {asset.height}
          </div>
        )}

        {isSelected && (
          <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-slate-900 truncate flex-1" title={asset.name}>
            {asset.name}
          </h4>
          <TypeIcon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        </div>

        {asset.dominantColors && asset.dominantColors.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">主色:</span>
            <div className="flex gap-0.5">
              {asset.dominantColors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-sm border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>{formatFileSize(asset.size)}</span>
          <span>{new Date(asset.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
};
