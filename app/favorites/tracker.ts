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

export interface NovelTracker {
    repo: Repo;
    novel: Content;
    added: number;
    updated: number;
    favorite: boolean;
}

export const chapterTrackerStore = create((set) => ({
    content: new Map<string, UseBoundStore<StoreApi<ChapterTracker>>>(),
    setContent: (content: Map<string, UseBoundStore<StoreApi<ChapterTracker>>>) => set({ content }),
}));

export const noveFavoriteStore = create((set) => ({
    content: new Map<string, UseBoundStore<StoreApi<NovelTracker>>>(),
    setContent: (content: Map<string, UseBoundStore<StoreApi<NovelTracker>>>) => set({ content }),
}));

export function createChapterTrackerStore(tracker: ChapterTracker) {
    return create<any>((set) => ({
        content: tracker,
        setContent: (content: ChapterTracker) => set({ content }),
    }));
}

export function createNovelTrackerStore(tracker: NovelTracker) {
    return create<any>((set) => ({
        content: tracker,
        setContent: (content: NovelTracker) => set({ content }),
    }));
}

export function getOrCreateTrackerStore({
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
        const tracker = createChapterTrackerStore(createChapter(repo, content, chapterId));
        allTrackers.set(key, tracker);
        setAllTrackers(allTrackers);
        return tracker;
    }
}

export function getOrCreateNovelTrackerStore({
    repo, content, setAllTrackers, allTrackers
}: {
    repo: Repo, content: Content, setAllTrackers: any,
    allTrackers: Map<string, UseBoundStore<StoreApi<NovelTracker>>>
}) {
    const key = novelKey(repo.id, content.bookId);
    if (allTrackers && allTrackers.has(key)) {
        return allTrackers.get(key)!;
    } else {
        const tracker = createNovelTrackerStore(createNovel(repo, content));
        allTrackers.set(key, tracker);
        setAllTrackers(allTrackers);
        return tracker;
    }
}

export function inverseFavoriteTracker({ novelTracker, repo, content, allNovelTrackerStore, setAllNovelTracker, setNovelTracker }: {
    novelTracker: NovelTracker,
    repo: Repo, content: Content,
    allNovelTrackerStore: Map<string, UseBoundStore<StoreApi<NovelTracker>>>,
    setAllNovelTracker: any, setNovelTracker: any
}) {
    const key = novelKey(repo.id, content.bookId);
    const updatedTracker: NovelTracker = { ...novelTracker, favorite: !novelTracker.favorite, updated: Date.now() };
    setNovelTracker(updatedTracker);
    allNovelTrackerStore.set(key, createNovelTrackerStore(updatedTracker));
    setAllNovelTracker(allNovelTrackerStore);
    saveNovelTracker(updatedTracker).then(() => {});
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

export function createNovel(repo: Repo, novel: Content): NovelTracker {
    return {
        repo,
        novel,
        added: Date.now(),
        updated: Date.now(),
        favorite: false,
    };
}

export function trackerKey(repoId: string, novelId: string, chapterId: string): string {
    return `trackerv1-${repoId}-${novelId}-${chapterId}`;
}

export function novelKey(repoId: string, novelId: string): string {
    return `favoritev1-${repoId}-${novelId}`;
}

export async function setupTrackingStores(allTrackers: any, setAllTrackers: any) {
    const trackers = await getAllTrackersAsync();
    for (const key in trackers) {
        allTrackers.set(key, createChapterTrackerStore(trackers[key]));
    }
    setAllTrackers(allTrackers);
}

export async function getAllTrackersAsync() {
    return await getDataByKeyPrefix<ChapterTracker>('trackerv1-');
}

async function getDataByKeyPrefix<T>(prefix: string) {
    const allKeys = await AsyncStorage.getAllKeys();
    const trackers = {} as Record<string, T>;
    for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        if (key.startsWith(prefix)) {
            const tracker = await getData(key);
            if (tracker) {
                trackers[key] = tracker;
            }
        }
    }
    return trackers;
}

export async function setupFavoriteStores(allTrackers: any, setAllTrackers: any) {
    const trackers = await getFavoriteTrackersAsync();
    for (const key in trackers) {
        allTrackers.set(key, createNovelTrackerStore(trackers[key]));
    }
    setAllTrackers(allTrackers);
}

export async function getFavoriteTrackersAsync() {
    return await getDataByKeyPrefix<NovelTracker>('favoritev1-');
}

export async function saveTracker(tracker: ChapterTracker) {
    const key = trackerKey(tracker.repo.id, tracker.novel.bookId, tracker.chapterId);
    await storeData(key, tracker);
}

export async function saveNovelTracker(tracker: NovelTracker) {
    const key = novelKey(tracker.repo.id, tracker.novel.bookId);
    await storeData(key, tracker);
}