import { create } from 'zustand';

export const indexes = {
    favorites: 0,
    explore: 1,
    recents: 2,
    settings: 3,
};

interface BottomIndexState {
    index: number;
    setIndex: (index: number) => void;
}

export const useBottomIndexStore = create<BottomIndexState>((set) => ({
    index: 0,
    setIndex: (index: number) => set({ index }),
}));
