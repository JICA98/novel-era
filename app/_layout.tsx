import { Stack } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { allDownloadsStore, setupDownloadStores } from "./downloads/utils";
import * as p from "plimit-lit";
import { chapterTrackerStore, noveFavoriteStore, setupFavoriteStores, setupTrackingStores } from "./favorites/tracker";
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useColorScheme } from "react-native";
import { getTheme } from "./settings/themeSettings";
import { userPrefStore, getUserPreference } from "./userpref";
import { setUpVoices, voicesStore } from "./chapters/ttscontrols";
import { authStateStore, setUpAuthUser } from "./lib/auth";
import { setUpFirebaseUser, firebaseStore } from "./lib/firebaseBackup";

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {
  // preventAutoHideAsync may fail in some configurations - safe to ignore
});

export function pLimitLit(concurrency: number) {
  return p.pLimit(concurrency);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'NotoSerif-Regular': require('../assets/fonts/NotoSerif-Regular.ttf'),
    'NotoSerif-Bold': require('../assets/fonts/NotoSerif-Bold.ttf'),
    'NotoSerif-Black': require('../assets/fonts/NotoSerif-Black.ttf'),
    'NotoSerif-Italic': require('../assets/fonts/NotoSerif-Italic.ttf'),
    'Manrope-Regular': require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('../assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
    'Manrope-ExtraBold': require('../assets/fonts/Manrope-ExtraBold.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
  const setVoices = voicesStore((state: any) => state.setContent);
  const setAuthState = authStateStore((state: any) => state.setContent);
  const setFirebaseUser = firebaseStore((state: any) => state.setContent);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

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

  if (!loaded && !error) {
    return null;
  }
  console.log(userPref);
  return (
    userPref && (<PaperProvider theme={getTheme({ colorScheme, theme, themeOptions: userPref.theme })}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="repos" options={{ headerShown: false }} />
        <Stack.Screen name="contents" options={{ headerShown: false }} />
        <Stack.Screen name="chapters" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="browser" options={{ headerShown: false }} />
        <Stack.Screen name="explore_all" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
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
