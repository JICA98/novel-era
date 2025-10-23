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
    hasChapterNumber: false,
};

// Entitlement to unlock paid features like cloud backup
export interface Entitlements {
    cloudBackup: boolean;
    purchase?: {
        productId?: string;
        purchaseToken?: string;
        platform?: 'android' | 'ios' | 'web';
        acknowledged?: boolean;
        purchaseTime?: number;
    };
}

export const defaultEntitlements: Entitlements = {
    cloudBackup: false,
};

export interface UserPreferences {
    theme: ThemeOptions;
    editorPreferences: EditorPreferences;
    ttsConfig: TTSConfig;
    entitlements?: Entitlements;
    preferredRepositoryId?: string;
}

export const userPrefStore = create((set, get: any) => ({
    userPref: null,
    setUserPref: (userPref: UserPreferences) => {
        set({ userPref });
        setUserPreference(userPref).then(() => { });
    },
    setEntitlements: (entitlements: Partial<Entitlements>) => {
        const current: UserPreferences | null = get().userPref;
        if (!current) return;
        const updated: UserPreferences = {
            ...current,
            entitlements: { ...(current.entitlements ?? defaultEntitlements), ...entitlements },
        };
        set({ userPref: updated });
        setUserPreference(updated).then(() => { });
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
        entitlements: {
            ...defaultEntitlements,
            ...(userPref?.entitlements ?? {}),
        },
        preferredRepositoryId: userPref?.preferredRepositoryId,
    };
}


async function setUserPreference(userPref: UserPreferences) {
    await storeData('userPreference', userPref);
}

export default function UserPrefRoute() {
    return null;
}