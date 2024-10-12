
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

export const defaultEditorPreferences: EditorPreferences = {
    fontSize: 18,
    fontFamily: 'serif',
    letterSpacing: 0,
    textAlign: 'left',
};

export interface UserPreferences {
    theme: ThemeOptions;
    editorPreferences: EditorPreferences;
}