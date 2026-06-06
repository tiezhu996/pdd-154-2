import { ApiResponse } from '../../shared/types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();
  return data as ApiResponse<T>;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, name: string) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    me: () => apiRequest('/auth/me', { method: 'GET' }),
  },
  folders: {
    getAll: () => apiRequest('/folders', { method: 'GET' }),
    create: (name: string, parentId?: number) =>
      apiRequest('/folders', {
        method: 'POST',
        body: JSON.stringify({ name, parentId }),
      }),
    update: (id: number, name: string) =>
      apiRequest(`/folders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    delete: (id: number) =>
      apiRequest(`/folders/${id}`, { method: 'DELETE' }),
  },
  assets: {
    getByFolder: (folderId: number, filters?: { search?: string; type?: string; tag?: string }) => {
      const params = new URLSearchParams({ folderId: String(folderId) });
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.tag) params.append('tag', filters.tag);
      return apiRequest(`/assets?${params.toString()}`, { method: 'GET' });
    },
    getById: (id: number) => apiRequest(`/assets/${id}`, { method: 'GET' }),
    getRecent: (limit?: number) =>
      apiRequest(`/assets/recent${limit ? `?limit=${limit}` : ''}`, { method: 'GET' }),
    getFavorites: () => apiRequest('/assets/favorites', { method: 'GET' }),
    getVersions: (id: number) => apiRequest(`/assets/${id}/versions`, { method: 'GET' }),
    getComments: (id: number) => apiRequest(`/assets/${id}/comments`, { method: 'GET' }),
    checkFavorite: (id: number) => apiRequest(`/assets/${id}/favorite/check`, { method: 'GET' }),
    getStorageStats: () => apiRequest('/assets/storage/stats', { method: 'GET' }),
    upload: (formData: FormData) =>
      apiRequest('/assets/upload', {
        method: 'POST',
        body: formData,
      }),
    addVersion: (id: number, formData: FormData) =>
      apiRequest(`/assets/${id}/versions`, {
        method: 'POST',
        body: formData,
      }),
    restoreVersion: (assetId: number, versionId: number) =>
      apiRequest(`/assets/${assetId}/versions/${versionId}/restore`, {
        method: 'POST',
      }),
    addTag: (id: number, tag: string) =>
      apiRequest(`/assets/${id}/tags`, {
        method: 'POST',
        body: JSON.stringify({ tag }),
      }),
    removeTag: (id: number, tag: string) =>
      apiRequest(`/assets/${id}/tags`, {
        method: 'DELETE',
        body: JSON.stringify({ tag }),
      }),
    addComment: (id: number, content: string) =>
      apiRequest(`/assets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    update: (id: number, data: { name?: string; description?: string; tags?: string[] }) =>
      apiRequest(`/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) => apiRequest(`/assets/${id}`, { method: 'DELETE' }),
    toggleFavorite: (id: number) =>
      apiRequest(`/assets/${id}/favorite`, { method: 'POST' }),
    move: (assetIds: number[], targetFolderId: number) =>
      apiRequest('/assets/move', {
        method: 'POST',
        body: JSON.stringify({ assetIds, targetFolderId }),
      }),
  },
  shares: {
    getByToken: (token: string) =>
      apiRequest(`/shares/${token}`, { method: 'GET' }),
    getComments: (token: string) =>
      apiRequest(`/shares/${token}/comments`, { method: 'GET' }),
    addComment: (token: string, data: { assetId?: number; guestName?: string; authorName?: string; content: string }) =>
      apiRequest(`/shares/${token}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    create: (data: { folderId?: number; assetIds: number[]; permission: string; expiresAt?: string }) =>
      apiRequest('/shares', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiRequest(`/shares/${id}`, { method: 'DELETE' }),
  },
  admin: {
    getUsers: () => apiRequest('/admin/users', { method: 'GET' }),
    updateUserRole: (id: number, role: string) =>
      apiRequest(`/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    deleteUser: (id: number) =>
      apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
    getAuditLogs: (filters?: { userId?: number; action?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', String(filters.userId));
      if (filters?.action) params.append('action', filters.action);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
      return apiRequest(`/admin/logs?${params.toString()}`, { method: 'GET' });
    },
    exportAuditLogs: (filters?: { userId?: number; action?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', String(filters.userId));
      if (filters?.action) params.append('action', filters.action);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      return apiRequest(`/admin/logs/export?${params.toString()}`, { method: 'GET' });
    },
    getStorageStats: () => apiRequest('/admin/stats', { method: 'GET' }),
    getStats: () => apiRequest('/admin/stats', { method: 'GET' }),
  },
};
