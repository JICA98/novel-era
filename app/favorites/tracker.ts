import { Content, FetchData, Repo } from "@/types";
import { Chapter } from "epub-gen";
import { create, StoreApi, UseBoundStore } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error(e);
    }
};

const getData = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export interface ChapterTracker {
    repo: Repo;
    novel: Content;
    chapterName?: string;
    chapterId: string;
    chapterProgress: number;
    status: 'read' | 'unread' | 'reading';
    lastRead: number;
}

export const novelTrackerStore = create((set) => ({
    content: new Map<string, UseBoundStore<StoreApi<ChapterTracker>>>(),
    setContent: (content: Map<string, UseBoundStore<StoreApi<ChapterTracker>>>) => set({ content }),
}));

export function updateNovelTracker({ chapterTrackers, setAllTracker, allTracker }: {
    allTracker: Map<string, UseBoundStore<StoreApi<ChapterTracker>>>,
    chapterTrackers: ChapterTracker[],
    setAllTracker: any
}) {
    chapterTrackers.forEach((tracker) => {
        const key = trackerKey(tracker.repo.id, tracker.novel.bookId, tracker.chapterId);
        allTracker.set(key, createNovelStore(tracker));
        storeData(key, tracker).then(() => console.log('Saved'));
    });
    setAllTracker(allTracker);
}

export function createNovelStore(tracker: ChapterTracker) {
    return create<any>((set) => ({
        content: tracker,
        setContent: (content: ChapterTracker) => set({ content }),
    }));
}

export function useNovelTrackerStore({
    repo, content, chapterId,
    allTrackers, setAllTrackers
}: {
    repo: Repo, content: Content, chapterId: string, setAllTrackers: any,
    allTrackers: Map<string, UseBoundStore<StoreApi<ChapterTracker>>>
}) {
    const key = trackerKey(repo.id, content.bookId, chapterId);
    if (allTrackers && allTrackers.has(key)) {
        return allTrackers.get(key)!;
    } else {
        const tracker = createNovelStore(createChapter(repo, content, chapterId));
        allTrackers.set(key, tracker);
        setAllTrackers(allTrackers);
        return tracker;
    }
}

export function createChapter(repo: Repo, novel: Content, chapterId: string): ChapterTracker {
    return {
        repo,
        novel,
        chapterId,
        chapterProgress: 0,
        status: 'unread',
        lastRead: Date.now(),
    };
}

export function trackerKey(repoId: string, novelId: string, chapterId: string): string {
    return `trackerv1-${repoId}-${novelId}-${chapterId}`;
}

export async function setupTrackingStores(allTrackers: any, setAllTrackers: any) {
    const trackers = await getAllTrackersAsync();
    for (const key in trackers) {
        allTrackers.set(key, createNovelStore(trackers[key]));
    }
    setAllTrackers(allTrackers);
}

export async function getAllTrackersAsync() {
    const allKeys = await AsyncStorage.getAllKeys();
    const trackers = {} as Record<string, ChapterTracker>;
    for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        if (key.startsWith('trackerv1-')) {
            const tracker = await getData(key);
            if (tracker) {
                trackers[key] = tracker;
            }
        }
    }
    return trackers;
}

export async function saveTracker(tracker: ChapterTracker) {
    const key = trackerKey(tracker.repo.id, tracker.novel.bookId, tracker.chapterId);
    await storeData(key, tracker);
}