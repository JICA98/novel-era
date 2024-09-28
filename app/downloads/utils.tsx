import { FetchData } from "@/types";
import { create, StoreApi, UseBoundStore } from "zustand";

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

function createStore() {
    return create<any>((set) => ({
        content: { noStarted: true } as FetchData<any>,
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
