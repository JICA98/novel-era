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

export interface AutoScrollSettings {
    enabled: boolean;
    speed: number; // pixels per second
    pauseOnTTS: boolean;
    resumeAfterTTS: boolean;
}

export interface PageTurnAnimation {
    type: 'slide' | 'fade' | 'flip' | 'none';
    speed: number; // animation duration in milliseconds
    enabled: boolean;
}

export interface ReadingModePreferences {
    immersiveByDefault: boolean;
    hideStatusBar: boolean;
    navigationGestureSensitivity: number; // 1-10 scale
    autoHideControls: boolean;
    autoHideDelay: number; // seconds
}

export interface ReadingExperiencePreferences {
    autoScroll: AutoScrollSettings;
    pageTurnAnimation: PageTurnAnimation;
    readingMode: ReadingModePreferences;
}

export const defaultAutoScrollSettings: AutoScrollSettings = {
    enabled: false,
    speed: 50, // pixels per second
    pauseOnTTS: true,
    resumeAfterTTS: true,
};

export const defaultPageTurnAnimation: PageTurnAnimation = {
    type: 'slide',
    speed: 300,
    enabled: true,
};

export const defaultReadingModePreferences: ReadingModePreferences = {
    immersiveByDefault: false,
    hideStatusBar: true,
    navigationGestureSensitivity: 5,
    autoHideControls: true,
    autoHideDelay: 3,
};

export const defaultReadingExperiencePreferences: ReadingExperiencePreferences = {
    autoScroll: defaultAutoScrollSettings,
    pageTurnAnimation: defaultPageTurnAnimation,
    readingMode: defaultReadingModePreferences,
};

export interface UserPreferences {
    theme: ThemeOptions;
    editorPreferences: EditorPreferences;
    ttsConfig: TTSConfig;
    readingExperience: ReadingExperiencePreferences;
    preferredRepositoryId?: string;
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
    setTTSConfig: (ttsConfig: TTSConfig) => {
        const userPref: UserPreferences = get().userPref;
        userPref.ttsConfig = ttsConfig;
        get().setUserPref(userPref);
    },
    setReadingExperience: (readingExperience: ReadingExperiencePreferences) => {
        const current: UserPreferences | null = get().userPref;
        if (!current) {
            return;
        }
        const updated = { ...current, readingExperience };
        set({ userPref: updated });
        setUserPreference(updated).then(() => { });
    },
}));

export async function getUserPreference(): Promise<UserPreferences> {
    const userPref = await getData<UserPreferences>('userPreference');
    return {
        theme: userPref?.theme ?? ThemeOptions.System,
        editorPreferences: userPref?.editorPreferences ?? defaultEditorPreferences,
        ttsConfig: userPref?.ttsConfig ?? defaultTTSConfig,
        readingExperience: userPref?.readingExperience ?? defaultReadingExperiencePreferences,
        preferredRepositoryId: userPref?.preferredRepositoryId,
    };
}


async function setUserPreference(userPref: UserPreferences) {
    await storeData('userPreference', userPref);
}

export default function UserPrefRoute() {
    return null;
}