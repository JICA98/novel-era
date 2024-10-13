import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
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
    if (cached) {
        const cachedData = await getCachedValue<T>(cachedKey);
        if (cachedData && (!onCache || onCache(cachedData))) {
            console.log('Cached -> ', input)
            return cachedData;
        }
    }
    try {
        console.log('API ->', input);
        const response = await fetch(input, init);
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