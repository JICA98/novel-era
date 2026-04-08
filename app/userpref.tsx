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
    hasChapterNumber: boolean;
    lineHeight?: number;
    padding?: number;
    theme?: 'light' | 'sepia' | 'dark' | 'oled';
}

export const ReaderThemes = {
    light: { background: '#fcf8fb', text: '#1b1b1e', highlight: '#dee1ff' },
    sepia: { background: '#F4ECD8', text: '#2f1500', highlight: '#ffdcc3' },
    dark: { background: '#171c3c', text: '#dee1ff', highlight: '#2d3252' },
    oled: { background: '#000000', text: '#ffffff', highlight: '#2c2c2e' },
};

export interface TTSConfig {
    rate: number;
    voice: string;
    pitch: number;
    volume: number;
}

export interface UserProfilePreferences {
    displayName?: string;
    tagline?: string;
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
    hasChapterNumber: false,
    lineHeight: 1.5,
    padding: 16,
    theme: 'light',
};

export interface UserPreferences {
    theme: ThemeOptions;
    editorPreferences: EditorPreferences;
    ttsConfig: TTSConfig;
    preferredRepositoryId?: string;
    defaultUniversalSearch?: boolean;
    profile?: UserProfilePreferences;
}

export const userPrefStore = create((set, get: any) => ({
    userPref: null,
    setUserPref: (userPref: UserPreferences) => {
        set({ userPref });
        setUserPreference(userPref).then(() => { });
    },
    setPreferredRepository: (repoId?: string) => {
        const current: UserPreferences | null = get().userPref;
        if (!current) {
            return;
        }
        const updated = { ...current, preferredRepositoryId: repoId };
        set({ userPref: updated });
        setUserPreference(updated).then(() => { });
    },
    setDefaultUniversalSearch: (enabled: boolean) => {
        const current: UserPreferences | null = get().userPref;
        if (!current) {
            return;
        }
        const updated = { ...current, defaultUniversalSearch: enabled };
        set({ userPref: updated });
        setUserPreference(updated).then(() => { });
    },
    setProfile: (profile: UserProfilePreferences) => {
        const current: UserPreferences | null = get().userPref;
        if (!current) {
            return;
        }
        const updated = { ...current, profile };
        set({ userPref: updated });
        setUserPreference(updated).then(() => { });
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
        preferredRepositoryId: userPref?.preferredRepositoryId,
        defaultUniversalSearch: userPref?.defaultUniversalSearch ?? false,
        profile: userPref?.profile ?? {},
    };
}


async function setUserPreference(userPref: UserPreferences) {
    await storeData('userPreference', userPref);
}

export default function UserPrefRoute() {
    return null;
}
