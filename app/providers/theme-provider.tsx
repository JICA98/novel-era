import { ReactNode, createContext, useContext, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { NativeWindStyleSheet } from "nativewind";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { AccentColor, AppTheme, DEFAULT_ACCENT, createAppTheme, resolveAppearance } from "../theme";
import { ThemeOptions, userPrefStore } from "../userpref";

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme: materialTheme } = useMaterial3Theme();
  const colorScheme = useColorScheme();
  const userPref = userPrefStore((state: any) => state.userPref);

  const appearance = resolveAppearance(userPref?.theme ?? ThemeOptions.System, colorScheme);
  const accent: AccentColor = userPref?.accent ?? DEFAULT_ACCENT;

  const value = useMemo(
    () => createAppTheme({ appearance, accent, materialTheme }),
    [appearance, accent, materialTheme]
  );

  useEffect(() => {
    NativeWindStyleSheet.setColorScheme(appearance);
  }, [appearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return context;
}
