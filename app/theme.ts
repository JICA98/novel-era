import { Material3Theme } from "@pchmn/expo-material3-theme";
import { ColorSchemeName } from "react-native";
import { ThemeOptions } from "./userpref";

export type AccentColor = "blue" | "violet" | "amber" | "teal";
export type AppearanceMode = "light" | "dark";

export interface DesignTokens {
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadow: {
    sm: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
}

export interface AppThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderMuted: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  accentOn: string;
  success: string;
  warning: string;
  danger: string;
}

export interface AppTheme extends DesignTokens {
  appearance: AppearanceMode;
  colors: AppThemeColors;
}

export const designTokens: DesignTokens = {
  radius: {
    sm: 10,
    md: 16,
    lg: 20,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  },
  shadow: {
    sm: {
      shadowColor: "rgba(15, 23, 42, 0.12)",
      shadowOpacity: 0.6,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    md: {
      shadowColor: "rgba(15, 23, 42, 0.18)",
      shadowOpacity: 0.75,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
  },
};

const ACCENT_COLORS: Record<AccentColor, { light: string; dark: string }> = {
  blue: { light: "#3b82f6", dark: "#60a5fa" },
  violet: { light: "#7c3aed", dark: "#a78bfa" },
  amber: { light: "#f59e0b", dark: "#fbbf24" },
  teal: { light: "#14b8a6", dark: "#2dd4bf" },
};

const NEUTRAL_LIGHT = {
  background: "#f7f7fb",
  surface: "#ffffff",
  elevated: "#f1f2fb",
  border: "#e3e5ef",
  borderMuted: "#eceef5",
  text: "#0f172a",
  textMuted: "#475569",
};

const NEUTRAL_DARK = {
  background: "#0f111a",
  surface: "#181b24",
  elevated: "#1f2330",
  border: "#262b3a",
  borderMuted: "#2e3242",
  text: "#f8fafc",
  textMuted: "#94a3b8",
};

export function resolveAppearance(themePreference: ThemeOptions, system: ColorSchemeName): AppearanceMode {
  if (themePreference === ThemeOptions.System) {
    return system === "dark" ? "dark" : "light";
  }
  return themePreference === ThemeOptions.Dark ? "dark" : "light";
}

export function createAppTheme({
  appearance,
  accent,
  materialTheme,
}: {
  appearance: AppearanceMode;
  accent: AccentColor;
  materialTheme?: Material3Theme;
}): AppTheme {
  const palette = appearance === "light" ? NEUTRAL_LIGHT : NEUTRAL_DARK;
  const accentValue = ACCENT_COLORS[accent][appearance];

  const dynamicAccent = materialTheme
    ? appearance === "light"
      ? materialTheme.light.primary
      : materialTheme.dark.primary
    : accentValue;

  return {
    appearance,
    ...designTokens,
    colors: {
      background: palette.background,
      surface: palette.surface,
      surfaceElevated: palette.elevated,
      border: palette.border,
      borderMuted: palette.borderMuted,
      text: palette.text,
      textMuted: palette.textMuted,
      accent: dynamicAccent,
      accentMuted: `${dynamicAccent}22`,
      accentOn: appearance === "light" ? "#ffffff" : "#0f111a",
      success: appearance === "light" ? "#22c55e" : "#4ade80",
      warning: appearance === "light" ? "#f97316" : "#fb923c",
      danger: appearance === "light" ? "#ef4444" : "#f87171",
    },
  };
}

export const DEFAULT_ACCENT: AccentColor = "violet";
