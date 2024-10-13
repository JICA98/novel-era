import { create } from "zustand";
import { getData, storeData } from "./storage";

export enum ThemeOptions {
    System = 'system',
    Light = 'light',
    Dark = 'dark',
}

export interface EditorPreferences {
    fontSize: number;
    fontFamily: string;
    letterSpacing: number;
    textAlign: 'left' | 'center' | 'right' | 'justify' | 'auto';
}

export interface TTSConfig {
    rate: number;
    voice: string;
    pitch: number;
    volume: number;
}

export const defaultTTSConfig: TTSConfig = {
    rate: 1,
    voice: 'system',
    pitch: 1,
    volume: 0.8,
}

export const defaultEditorPreferences: EditorPreferences = {
    fontSize: 18,
    fontFamily: 'serif',
    letterSpacing: 0,
    textAlign: 'left',
};

export interface UserPreferences {
    theme: ThemeOptions;
    editorPreferences: EditorPreferences;
    ttsConfig: TTSConfig;
}

export const userPrefStore = create((set, get: any) => ({
    userPref: null,
    setUserPref: (userPref: UserPreferences) => {
        set({ userPref });
        setUserPreference(userPref).then(() => { });
    },
    setTTSConfig: (ttsConfig: TTSConfig) => {
        const userPref: UserPreferences = get().userPref;
        userPref.ttsConfig = ttsConfig;
        get().setUserPref(userPref);
    },
}));

export async function getUserPreference(): Promise<UserPreferences> {
    const userPref = await getData<UserPreferences>('userPreference');
    return {
        theme: userPref?.theme ?? ThemeOptions.System,
        editorPreferences: userPref?.editorPreferences ?? defaultEditorPreferences,
        ttsConfig: userPref?.ttsConfig ?? defaultTTSConfig,
    };
}


async function setUserPreference(userPref: UserPreferences) {
    await storeData('userPreference', userPref);
}