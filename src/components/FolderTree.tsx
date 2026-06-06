import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';
import { useAssetStore } from '../store/useAssetStore';
import { cn } from '../lib/utils';
import { Folder as FolderType } from '../../shared/types';

interface FolderTreeProps {
  className?: string;
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
  expandedFolders: Set<number>;
  toggleFolder: (id: number) => void;
  renamingId: number | null;
  setRenamingId: (id: number | null) => void;
  renameValue: string;
  setRenameValue: (value: string) => void;
  contextMenu: { id: number; x: number; y: number } | null;
  setContextMenu: (menu: { id: number; y: number; x: number } | null) => void;
}

function buildFolderTree(folders: FolderType[]): FolderType[] {
  const folderMap = new Map<number, FolderType>();
  const roots: FolderType[] = [];

  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  folders.forEach((folder) => {
    const folderWithChildren = folderMap.get(folder.id)!;
    if (folder.parentId === null) {
      roots.push(folderWithChildren);
    } else {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(folderWithChildren);
      }
    }
  });

  return roots;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  level,
  expandedFolders,
  toggleFolder,
  renamingId,
  setRenamingId,
  renameValue,
  setRenameValue,
  contextMenu,
  setContextMenu,
}) => {
  const { currentFolderId, setCurrentFolder, renameFolder, deleteFolder } = useAssetStore();
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = currentFolderId === folder.id;
  const isRenaming = renamingId === folder.id;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue.trim() !== folder.name) {
      renameFolder(folder.id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleDelete = () => {
    if (confirm(`确定要删除文件夹 "${folder.name}" 吗？此操作不可撤销。`)) {
      deleteFolder(folder.id);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id: folder.id, x: e.clientX, y: e.clientY });
  };

  return (
    <div>
      <div
        className={cn(
          'group relative flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150',
          isSelected
            ? 'bg-indigo-50 text-indigo-700'
            : isHovered
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-700'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
      >
        <button
          onClick={() => hasChildren && toggleFolder(folder.id)}
          className={cn(
            'p-0.5 rounded transition-transform duration-200',
            isExpanded ? 'rotate-90' : 'rotate-0',
            hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setCurrentFolder(folder.id)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div
            className={cn(
              'flex-shrink-0 transition-colors duration-150',
              isSelected ? 'text-indigo-500' : 'text-amber-500'
            )}
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <Folder className="w-4 h-4" />
            )}
          </div>

          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRenameSubmit}
              className="flex-1 min-w-0 px-1 py-0.5 text-sm border border-indigo-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="text-sm font-medium truncate">{folder.name}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                ({folder.assetCount})
              </span>
            </>
          )}
        </button>

        {isRenaming ? (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRenameSubmit();
              }}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRenameCancel();
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-0.5 transition-opacity duration-150',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenameValue(folder.name);
                setRenamingId(folder.id);
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="重命名"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu({ id: folder.id, x: e.clientX, y: e.clientY });
              }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="更多操作"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {hasChildren && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-in-out',
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          {folder.children?.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />
          ))}
        </div>
      )}

      {contextMenu && contextMenu.id === folder.id && (
        <div
          className="fixed z-50 min-w-[140px] bg-white rounded-lg shadow-xl border border-slate-200 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setRenameValue(folder.name);
              setRenamingId(folder.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            重命名
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除文件夹
          </button>
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ className }) => {
  const { folders, fetchFolders, createFolder, currentFolderId } = useAssetStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1]));
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (showNewFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolder]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const folderTree = buildFolderTree(folders);

  const toggleFolder = (id: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setShowNewFolder(false);
      setExpandedFolders((prev) => new Set([...prev, currentFolderId]));
    }
  };

  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setShowNewFolder(false);
      setNewFolderName('');
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">文件夹</h3>
        <button
          onClick={() => setShowNewFolder(true)}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="新建文件夹"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {showNewFolder && (
          <div className="flex items-center gap-1 px-2 py-1.5 mb-1">
            <div className="w-4 h-4 text-amber-500 mr-1">
              <Folder className="w-4 h-4" />
            </div>
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleNewFolderKeyDown}
              onBlur={handleCreateFolder}
              placeholder="文件夹名称"
              className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleCreateFolder}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {folderTree.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              level={0}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
