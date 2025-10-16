import { create } from "zustand";

export interface SearchResultItem {
  id: string;
  title: string;
  bookId?: string;
  coverUrl?: string;
  link?: string;
  rating?: string;
  summary?: string;
  sourceId: string;
  sourceName: string;
}

export interface SearchCacheEntry {
  results: SearchResultItem[];
  timestamp: number;
}

interface SearchState {
  selectedRepositoryId?: string;
  results: SearchResultItem[];
  isLoading: boolean;
  error?: string;
  cache: Record<string, SearchCacheEntry>;
  setSelectedRepository: (repoId?: string) => void;
  setResults: (results: SearchResultItem[]) => void;
  resetResults: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  updateCache: (key: string, entry: SearchCacheEntry) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  results: [],
  isLoading: false,
  cache: {},
  setSelectedRepository: (repoId) => set({ selectedRepositoryId: repoId }),
  setResults: (results) => set({ results }),
  resetResults: () => set({ results: [], error: undefined }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  updateCache: (key, entry) =>
    set((state) => ({ cache: { ...state.cache, [key]: entry } })),
}));

export default function SearchStoreRoute(): null {
  return null;
}
