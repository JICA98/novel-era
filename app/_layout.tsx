import { Stack } from "expo-router";
import { useEffect } from "react";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { allDownloadsStore, setupDownloadStores } from "./downloads/utils";
import * as p from "plimit-lit";
import { chapterTrackerStore, setupTrackingStores } from "./favorites/tracker";
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useColorScheme } from "react-native";

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: '#121212',
    surface: '#121212',
    text: '#ffffff',
    primary: '#bb86fc',
    accent: '#03dac6',
  },
};

export function pLimitLit(concurrency: number) {
  return p.pLimit(concurrency);
}

export default function RootLayout() {
  const setDownloads = allDownloadsStore((state: any) => state.setDownloads);
  const downloads = allDownloadsStore((state: any) => state.downloads);
  const allTrackers = chapterTrackerStore((state: any) => state.content);
  const setAllTrackers = chapterTrackerStore((state: any) => state.setContent);
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();
  const paperTheme =
    colorScheme === 'dark'
      ? { ...MD3DarkTheme, colors: theme.dark }
      : { ...MD3LightTheme, colors: theme.light };
  useEffect(() => {
    try {
      initApp(downloads, setDownloads, allTrackers, setAllTrackers);
    } catch (error) {
      console.error(error);
    }
  }, []);
  return (
    <PaperProvider theme={paperTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="repos" options={{ headerShown: false }} />
        <Stack.Screen name="contents" options={{ headerShown: false }} />
        <Stack.Screen name="chapters" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
    </PaperProvider>
  );
}

function initApp(downloads: any, setDownloads: any, allTrackers: any, setAllTrackers: any) {
  setupDownloadStores(downloads, setDownloads);
  setupTrackingStores(allTrackers, setAllTrackers);
}

const ignoredWarnings = [
  'There is no custom renderer',
  '[xmldom warning]',
];
const consoleWarn = console.warn;
console.warn = (message: string) => {
  if (ignoredWarnings.some((warning) => message.includes(warning))) {
    return;
  }
  consoleWarn(message);
}
