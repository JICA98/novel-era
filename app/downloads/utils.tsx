import { FetchData } from "@/types";
import { create, StoreApi, UseBoundStore } from "zustand";
import * as FileSystem from 'expo-file-system';

export const allDownloadsStore = create((set) => ({
    downloads: new Map<string, UseBoundStore<StoreApi<FetchData<any>>>>(),
    setDownloads: (downloads: Map<string, UseBoundStore<StoreApi<FetchData<any>>>>) => set({ downloads }),
}));

export function startDownload({ fetcher, setLoading, setContent }: {
    fetcher: () => Promise<any>,
    setLoading: any, setContent: any
}) {
    setLoading();
    fetcher()
        .then(data => setContent({ data }))
        .catch(error => setContent({ error }));
}

function createStore(data?: any) {
    return create<any>((set) => ({
        content: { noStarted: true, data } as FetchData<any>,
        setContent: (content: FetchData<any>) => set({ content }),
        setLoading: () => set({ content: { isLoading: true } }),
    }));
}

export function useDownloadStore({ key, downloads, setDownloads }:
    {
        key: string, downloads: Map<string, UseBoundStore<StoreApi<FetchData<any>>>>
        setDownloads: any
    },
) {
    if (downloads.has(key)) {
        return downloads.get(key)!;
    } else {
        const store = createStore();
        downloads.set(key, store);
        setDownloads(downloads);
        return store;
    }
}

export function removeFromStore({ key, downloads, setDownloads }: {
    key: string, 
    downloads: Map<string, UseBoundStore<StoreApi<FetchData<any>>>>
    setDownloads: any
}) {
    if (downloads.has(key)) {
        downloads.delete(key);
        setDownloads(downloads);
        deleteFile(key);
    }
}

export async function saveFile(key: string, data: any) {
    try {
        const key64 = btoa(key);
        const saveFile = JSON.stringify({ data });
        await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + '/' + key64, saveFile, {
            encoding: 'utf8'
        });
    } catch (error) {
        console.error(error);
    }
}

export async function readFile(key: string) {
    try {
        const key64 = btoa(key);
        const uri = FileSystem.documentDirectory + '/' + key64;
        console.log('Reading', uri);
        const data = await FileSystem.readAsStringAsync(uri);
        const parsed = JSON.parse(data ?? '{}');
        return parsed?.data;
    } catch (error) {
        console.warn(error);
        return null;
    }
}

export async function deleteFile(key: string) {
    try {
        const key64 = btoa(key);
        const uri = FileSystem.documentDirectory + '/' + key64;
        await FileSystem.deleteAsync(uri);
    } catch (error) {
        console.error(error);
    }
}

export async function setupDownloadStores(downloads: any, setDownloads: any) {
    const uri = FileSystem.documentDirectory;
    if (!uri) return;
    const paths = await FileSystem.readDirectoryAsync(uri);
    for (const path of paths) {
        try {
            const info = await FileSystem.getInfoAsync(path);
            if (path && !info.isDirectory) {
                const key = atob(path);
                const data = await readFile(key);
                if (data) {
                    const store = createStore(data);
                    downloads.set(key, store);
                    setDownloads(downloads);
                }
            }
        } catch (error) {
            // console.warn('Skipping path :', path, error);
        }
    }
}