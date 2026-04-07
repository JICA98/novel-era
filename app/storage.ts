import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error(e);
    }
};

export const removeData = async (key: string) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error(e);
    }
};

export const removeMany = async (keys: string[]) => {
    if (!keys.length) {
        return;
    }
    try {
        await AsyncStorage.multiRemove(keys);
    } catch (e) {
        console.error(e);
    }
};

export const getData = async <T>(key: string): Promise<T | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const getAllKeys = async () => {
    try {
        return await AsyncStorage.getAllKeys();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function cacheValue(key: string, value: any) {
    await storeData(key, value);
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
    return await getData(key);
}

interface HttpGetOptions<T> {
    init?: RequestInit,
    cached?: boolean,
    cachedKey?: string,
    onCache?: (data: T) => boolean,
    onResponse?: (response: Response) => Promise<T>
    text?: boolean,
};

export async function httpGet<T>(
    input: string | URL | Request,
    options: HttpGetOptions<T> = {}): Promise<T> {
    let { init, cached, cachedKey, onCache, onResponse } = options;
    cachedKey = cachedKey ?? input.toString();

    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    };

    if (cached) {
        const cachedData = await getCachedValue<T>(cachedKey);
        if (cachedData && (!onCache || onCache(cachedData))) {
            console.log('Cached -> ', input)
            return cachedData;
        }
    }

    try {
        console.log('API ->', input);
        const fetchInit: RequestInit = {
            ...init,
            headers: {
                ...defaultHeaders,
                ...init?.headers,
            }
        };
        const response = await fetch(input, fetchInit);
        if (!onResponse) {
            if (options.text) {
                return await response.text() as T;
            } else {
                return await response.json() as T;
            }
        }
        const transformed = await onResponse(response);
        cacheValue(cachedKey, transformed).then(() => { });
        return transformed;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch content');
    }
}

export default function StorageRoute(): null {
    return null;
}