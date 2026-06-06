import React, { useState, useEffect } from 'react';
import {
  Users,
  HardDrive,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Download,
  Shield,
  MoreVertical,
  Eye,
  Trash2,
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../components/Toast';
import { AuditLog, User as UserType, StorageStats } from '../../shared/types';
import { formatFileSize, formatDate, getActionLabel, getTypeColor } from '../utils/format';

export const Admin: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'logs'>('users');
  const [users, setUsers] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    userId: undefined as number | undefined,
    action: undefined as string | undefined,
    startDate: '',
    endDate: '',
  });
  const [showUserMenu, setShowUserMenu] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadAuditLogs();
    }
  }, [activeTab, page, filters]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getStorageStats(),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data as UserType[]);
      }
      if (statsRes.success && statsRes.data) {
        setStorageStats(statsRes.data as StorageStats);
      }
    } catch (error) {
      showToast('加载数据失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await api.admin.getAuditLogs({
        page,
        pageSize,
        ...filters,
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setAuditLogs(data.logs || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (error) {
      showToast('加载操作日志失败', 'error');
    }
  };

  const handleUpdateRole = async (userId: number, role: 'member' | 'admin') => {
    try {
      const response = await api.admin.updateUserRole(userId, role);
      if (response.success) {
        showToast('角色已更新', 'success');
        loadAllData();
      } else {
        showToast(response.error || '更新失败', 'error');
      }
    } catch (error) {
      showToast('更新失败', 'error');
    }
    setShowUserMenu(null);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除此用户吗？此操作不可撤销。')) return;
    try {
      const response = await api.admin.deleteUser(userId);
      if (response.success) {
        showToast('用户已删除', 'success');
        loadAllData();
      } else {
        showToast(response.error || '删除失败', 'error');
      }
    } catch (error) {
      showToast('删除失败', 'error');
    }
    setShowUserMenu(null);
  };

  const handleExportLogs = async () => {
    try {
      const response = await api.admin.exportAuditLogs(filters);
      if (response.success && response.data) {
        const data = response.data as any;
        const csvContent = [
          ['时间', '用户', '操作', '详情', 'IP地址'].join(','),
          ...data.logs.map((log: any) => [
            formatDate(log.createdAt),
            log.user?.name || '未知',
            getActionLabel(log.action),
            log.details ? '"' + log.details.replace(/"/g, '""') + '"' : '',
            log.ipAddress || '',
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        showToast('日志已导出', 'success');
      }
    } catch (error) {
      showToast('导出失败', 'error');
    }
  };

  const tabs = [
    { id: 'users', label: '成员管理', icon: Users },
    { id: 'storage', label: '存储统计', icon: HardDrive },
    { id: 'logs', label: '操作日志', icon: Clock },
  ];

  if (isLoading && activeTab !== 'logs') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
        <p className="text-gray-500 mt-1">管理团队成员、存储空间和查看操作日志。</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">成员</th>
                    <th className="pb-3 font-medium">邮箱</th>
                    <th className="pb-3 font-medium">角色</th>
                    <th className="pb-3 font-medium">已用空间</th>
                    <th className="pb-3 font-medium">素材数量</th>
                    <th className="pb-3 font-medium">注册时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600">{user.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '成员'}
                      </span>
                    </td>
                    <td className="py-4 text-gray-600">{formatFileSize(user.storageUsed || 0)}</td>
                    <td className="py-4 text-gray-600">{user.assetCount || 0}</td>
                    <td className="py-4 text-gray-500 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showUserMenu === user.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleUpdateRole(user.id, 'admin')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Shield className="w-4 h-4" />
                                设为管理员
                              </button>
                            )}
                            {user.role !== 'member' && (
                              <button
                                onClick={() => handleUpdateRole(user.id, 'member')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <User className="w-4 h-4" />
                                设为成员
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              删除用户
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'storage' && storageStats && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-indigo-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-600">总存储使用</p>
                    <p className="text-3xl font-bold text-indigo-700 mt-2">
                      {formatFileSize(storageStats.totalSize)}
                    </p>
                  </div>
                  <HardDrive className="w-10 h-10 text-indigo-400" />
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min((storageStats.totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-indigo-600 mt-2">
                    {(((storageStats.totalSize / (10 * 1024 * 1024 * 1024)) * 100).toFixed(1))}% 已使用（10 GB 总容量）
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600">素材总数</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-2">
                      {storageStats.totalAssets}
                    </p>
                  </div>
                  <FileText className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">分享次数</p>
                    <p className="text-3xl font-bold text-amber-700 mt-2">
                      {storageStats.totalShares || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-amber-400" />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">按类型统计</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'design', label: '设计稿', size: storageStats.byType?.design || { size: 0, count: 0 }, color: getTypeColor('design') },
                { type: 'reference', label: '参考图', size: storageStats.byType?.reference || { size: 0, count: 0 }, color: getTypeColor('reference') },
                { type: 'font', label: '字体包', size: storageStats.byType?.font || { size: 0, count: 0 }, color: getTypeColor('font') },
              ].map((item) => (
                <div key={item.type} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-gray-900">{item.label}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.color}`}>
                      {item.size.count || 0} 个
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatFileSize(item.size.size || 0)}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">成员存储排行</h3>
            <div className="space-y-3">
              {users.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.assetCount || 0} 个素材
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatFileSize(user.storageUsed || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="p-6 pb-0">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filters.userId || ''}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                  >
                    <option value="">全部用户</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={filters.action || ''}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                >
                  <option value="">全部操作</option>
                  {['upload', 'download', 'delete', 'move', 'share', 'login', 'comment', 'favorite'].map((action) => (
                    <option key={action} value={action}>
                      {getActionLabel(action)}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleExportLogs}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  导出日志
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">时间</th>
                    <th className="px-6 py-3 font-medium">用户</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                    <th className="px-6 py-3 font-medium">详情</th>
                    <th className="px-6 py-3 font-medium">IP地址</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        暂无操作记录
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-indigo-600">
                                {log.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">
                              {log.user?.name || '未知用户'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.action.includes('delete')
                              ? 'bg-red-100 text-red-700'
                              : log.action.includes('upload')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.details || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                第 {page} 页，共 {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
