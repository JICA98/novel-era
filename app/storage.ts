import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from './settings';
import { create } from 'zustand';

export const storeData = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error(e);
    }
};

export const getData = async (key: string) => {
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

export const userPrefStore = create((set) => ({
    userPref: null,
    setUserPref: (userPref: UserPreferences) => set({ userPref }),
}));

export async function getUserPreference(): Promise<UserPreferences> {
    const userPref = await getData('userPreference');
    return userPref ?? { theme: 'system' };
}

export async function setUserPreference(userPref: UserPreferences) {
    await storeData('userPreference', userPref);
}