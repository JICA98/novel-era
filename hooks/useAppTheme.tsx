import { createContext, type ReactNode, useContext } from 'react';

export interface AppTheme {
  dark: boolean;
  colors: any;
  [key: string]: any;
}

const AppThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({
  children,
  theme,
}: {
  children: ReactNode;
  theme: AppTheme;
}) {
  return <AppThemeContext.Provider value={theme}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }

  return theme;
}
