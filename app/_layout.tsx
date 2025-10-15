import { Stack } from "expo-router";
import { useEffect } from "react";
import { allDownloadsStore, setupDownloadStores } from "./downloads/utils";
import * as p from "plimit-lit";
import { chapterTrackerStore, noveFavoriteStore, setupFavoriteStores, setupTrackingStores } from "./favorites/tracker";
import { userPrefStore, getUserPreference } from "./userpref";
import { setUpVoices, voicesStore } from "./chapters/ttscontrols";
import { authStateStore, setUpAuthUser } from "./lib/auth";
import { setUpFirebaseUser, firebaseStore } from "./lib/firebaseBackup";
import { ThemeProvider } from "./providers/theme-provider";

export function pLimitLit(concurrency: number) {
  return p.pLimit(concurrency);
}

export default function RootLayout() {
  const setDownloads = allDownloadsStore((state: any) => state.setDownloads);
  const downloads = allDownloadsStore((state: any) => state.downloads);
  const allTrackers = chapterTrackerStore((state: any) => state.content);
  const setAllTrackers = chapterTrackerStore((state: any) => state.setContent);
  const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);
  const setAllNovelTracker = noveFavoriteStore((state: any) => state.setContent);
  const userPref = userPrefStore((state: any) => state.userPref);
  const setUserPref = userPrefStore((state: any) => state.setUserPref);
  const setVoices = voicesStore((state: any) => state.setContent);
  const setAuthState = authStateStore((state: any) => state.setContent);
  const setFirebaseUser = firebaseStore((state: any) => state.setContent);

  useEffect(() => {
    let unsubscribeFromBackup: (() => void) | undefined;

    try {
      async function fetchUserPreferences() {
        const preferences = await getUserPreference();
        setUserPref(preferences);
      }
      fetchUserPreferences();
      setupDownloadStores(downloads, setDownloads);
      setupTrackingStores(allTrackers, setAllTrackers);
      setupFavoriteStores(allNovelTrackerStore, setAllNovelTracker);
      setUpVoices(setVoices);
      setUpAuthUser(setAuthState).then((authUser) => {
        const teardown = setUpFirebaseUser(setFirebaseUser, authUser);
        if (typeof teardown === 'function') {
          unsubscribeFromBackup = teardown;
        }
      });
    } catch (error) {
      console.error(error);
    }

    return () => {
      if (unsubscribeFromBackup) {
        unsubscribeFromBackup();
      }
    };
  }, []);
  return (
    userPref && (
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="repos" options={{ headerShown: false }} />
          <Stack.Screen name="contents" options={{ headerShown: false }} />
          <Stack.Screen name="chapters" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    )
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
