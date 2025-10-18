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

export interface TextDisplaySettings {
    fontSize: number; // 12-32
    lineSpacing: number; // 1.0-2.5
    paragraphSpacing: number; // 0-20 pixels
    textAlignment: 'left' | 'center' | 'justify';
    marginHorizontal: number; // 8-40 pixels
    marginVertical: number; // 8-40 pixels
}

export interface ReadingBehaviorSettings {
    keepScreenOn: boolean;
    tapToScroll: boolean;
    tapScrollDistance: number; // percentage of screen height
    volumeKeysForNavigation: boolean;
    confirmBeforeClosing: boolean;
}

export interface ReadingExperiencePreferences {
    autoScroll: AutoScrollSettings;
    pageTurnAnimation: PageTurnAnimation;
    readingMode: ReadingModePreferences;
    textDisplay: TextDisplaySettings;
    readingBehavior: ReadingBehaviorSettings;
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

export const defaultTextDisplaySettings: TextDisplaySettings = {
    fontSize: 16,
    lineSpacing: 1.4,
    paragraphSpacing: 8,
    textAlignment: 'left',
    marginHorizontal: 16,
    marginVertical: 16,
};

export const defaultReadingBehaviorSettings: ReadingBehaviorSettings = {
    keepScreenOn: true,
    tapToScroll: true,
    tapScrollDistance: 80, // 80% of screen height
    volumeKeysForNavigation: false,
    confirmBeforeClosing: false,
};

export const defaultReadingExperiencePreferences: ReadingExperiencePreferences = {
    autoScroll: defaultAutoScrollSettings,
    pageTurnAnimation: defaultPageTurnAnimation,
    readingMode: defaultReadingModePreferences,
    textDisplay: defaultTextDisplaySettings,
    readingBehavior: defaultReadingBehaviorSettings,
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
    const readingExperience = userPref?.readingExperience ?? defaultReadingExperiencePreferences;
    
    // Ensure backward compatibility with existing preferences
    const completeReadingExperience: ReadingExperiencePreferences = {
        autoScroll: readingExperience.autoScroll ?? defaultAutoScrollSettings,
        pageTurnAnimation: readingExperience.pageTurnAnimation ?? defaultPageTurnAnimation,
        readingMode: readingExperience.readingMode ?? defaultReadingModePreferences,
        textDisplay: readingExperience.textDisplay ?? defaultTextDisplaySettings,
        readingBehavior: readingExperience.readingBehavior ?? defaultReadingBehaviorSettings,
    };
    
    return {
        theme: userPref?.theme ?? ThemeOptions.System,
        editorPreferences: userPref?.editorPreferences ?? defaultEditorPreferences,
        ttsConfig: userPref?.ttsConfig ?? defaultTTSConfig,
        readingExperience: completeReadingExperience,
        preferredRepositoryId: userPref?.preferredRepositoryId,
    };
}


async function setUserPreference(userPref: UserPreferences) {
    await storeData('userPreference', userPref);
}

export default function UserPrefRoute() {
    return null;
}