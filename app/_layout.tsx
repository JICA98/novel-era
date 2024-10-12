import { Stack } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { allDownloadsStore, setupDownloadStores } from "./downloads/utils";
import * as p from "plimit-lit";
import { chapterTrackerStore, noveFavoriteStore, setupFavoriteStores, setupTrackingStores } from "./favorites/tracker";
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useColorScheme } from "react-native";
import { getUserPreference, userPrefStore } from "./storage";
import { getTheme } from "./settings/themeSettings";

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
  const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);
  const setAllNovelTracker = noveFavoriteStore((state: any) => state.setContent);
  const userPref = userPrefStore((state: any) => state.userPref);
  const setUserPref = userPrefStore((state: any) => state.setUserPref);

  useEffect(() => {
    try {
      async function fetchUserPreferences() {
        const preferences = await getUserPreference();
        setUserPref(preferences);
      }
      fetchUserPreferences();
      setupDownloadStores(downloads, setDownloads);
      setupTrackingStores(allTrackers, setAllTrackers);
      setupFavoriteStores(allNovelTrackerStore, setAllNovelTracker);
    } catch (error) {
      console.error(error);
    }
  }, []);
  console.log(userPref);
  return (
    userPref && (<PaperProvider theme={getTheme({ colorScheme, theme, themeOptions: userPref.theme })}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="repos" options={{ headerShown: false }} />
        <Stack.Screen name="contents" options={{ headerShown: false }} />
        <Stack.Screen name="chapters" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
    </PaperProvider>)
  );
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
