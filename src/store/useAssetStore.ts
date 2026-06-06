import { create } from 'zustand';
import { api } from '../utils/api';
import { Asset, Folder, AssetType, ApiResponse } from '../../shared/types';

interface AssetState {
  assets: Asset[];
  folders: Folder[];
  currentFolderId: number;
  selectedIds: number[];
  searchQuery: string;
  filters: { type?: AssetType; tag?: string };
  isLoading: boolean;
  fetchFolders: () => Promise<void>;
  fetchAssets: () => Promise<void>;
  fetchRecent: () => Promise<Asset[]>;
  fetchFavorites: () => Promise<Asset[]>;
  createFolder: (name: string, parentId?: number) => Promise<boolean>;
  renameFolder: (id: number, name: string) => Promise<boolean>;
  deleteFolder: (id: number) => Promise<boolean>;
  setCurrentFolder: (id: number) => void;
  selectAsset: (id: number, multi?: boolean) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setFilter: (key: 'type' | 'tag', value: string | undefined) => void;
  toggleFavorite: (id: number) => Promise<boolean>;
  moveAssets: (assetIds: number[], targetFolderId: number) => Promise<boolean>;
  deleteAssets: (ids: number[]) => Promise<boolean>;
  uploadAsset: (formData: FormData, onProgress?: (progress: number) => void) => Promise<Asset | null>;
  updateAsset: (id: number, data: { name?: string; description?: string; tags?: string[] }) => Promise<Asset | null>;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  folders: [],
  currentFolderId: 1,
  selectedIds: [],
  searchQuery: '',
  filters: {},
  isLoading: false,

  fetchFolders: async () => {
    set({ isLoading: true });
    try {
      const response = await api.folders.getAll() as ApiResponse<Folder[]>;
      if (response.success && response.data) {
        set({ folders: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAssets: async () => {
    const { currentFolderId, searchQuery, filters } = get();
    set({ isLoading: true });
    try {
      const response = await api.assets.getByFolder(currentFolderId, {
        search: searchQuery || undefined,
        type: filters.type,
        tag: filters.tag,
      }) as ApiResponse<Asset[]>;
      if (response.success && response.data) {
        set({ assets: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRecent: async () => {
    try {
      const response = await api.assets.getRecent(20) as ApiResponse<Asset[]>;
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch recent assets:', error);
      return [];
    }
  },

  fetchFavorites: async () => {
    try {
      const response = await api.assets.getFavorites() as ApiResponse<Asset[]>;
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      return [];
    }
  },

  createFolder: async (name: string, parentId?: number) => {
    try {
      const response = await api.folders.create(name, parentId);
      if (response.success) {
        get().fetchFolders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create folder:', error);
      return false;
    }
  },

  renameFolder: async (id: number, name: string) => {
    try {
      const response = await api.folders.update(id, name);
      if (response.success) {
        get().fetchFolders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to rename folder:', error);
      return false;
    }
  },

  deleteFolder: async (id: number) => {
    try {
      const response = await api.folders.delete(id);
      if (response.success) {
        get().fetchFolders();
        if (get().currentFolderId === id) {
          set({ currentFolderId: 1 });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete folder:', error);
      return false;
    }
  },

  setCurrentFolder: (id: number) => {
    set({ currentFolderId: id, selectedIds: [] });
    get().fetchAssets();
  },

  selectAsset: (id: number, multi = false) => {
    set((state) => {
      if (multi) {
        if (state.selectedIds.includes(id)) {
          return { selectedIds: state.selectedIds.filter((i) => i !== id) };
        }
        return { selectedIds: [...state.selectedIds, id] };
      }
      return { selectedIds: [id] };
    });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().fetchAssets();
  },

  setFilter: (key: 'type' | 'tag', value: string | undefined) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    get().fetchAssets();
  },

  toggleFavorite: async (id: number) => {
    try {
      const response = await api.assets.toggleFavorite(id);
      if (response.success && response.data) {
        const isFavorite = (response.data as { isFavorite: boolean }).isFavorite;
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id ? { ...a, isFavorite } : a
          ),
        }));
        return isFavorite;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  },

  moveAssets: async (assetIds: number[], targetFolderId: number) => {
    try {
      const response = await api.assets.move(assetIds, targetFolderId);
      if (response.success) {
        set({ selectedIds: [] });
        get().fetchAssets();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to move assets:', error);
      return false;
    }
  },

  deleteAssets: async (ids: number[]) => {
    try {
      for (const id of ids) {
        await api.assets.delete(id);
      }
      set({ selectedIds: [] });
      get().fetchAssets();
      return true;
    } catch (error) {
      console.error('Failed to delete assets:', error);
      return false;
    }
  },

  uploadAsset: async (formData: FormData) => {
    try {
      const response = await api.assets.upload(formData);
      if (response.success && response.data) {
        get().fetchAssets();
        return response.data as Asset;
      }
      return null;
    } catch (error) {
      console.error('Failed to upload asset:', error);
      return null;
    }
  },

  updateAsset: async (id: number, data: { name?: string; description?: string; tags?: string[] }) => {
    try {
      const response = await api.assets.update(id, data);
      if (response.success && response.data) {
        get().fetchAssets();
        return response.data as Asset;
      }
      return null;
    } catch (error) {
      console.error('Failed to update asset:', error);
      return null;
    }
  },
}));
