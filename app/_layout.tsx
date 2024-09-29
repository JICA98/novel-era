import { Stack } from "expo-router";
import { useEffect } from "react";
import { PaperProvider, DefaultTheme, MD3DarkTheme } from "react-native-paper";
import { allDownloadsStore, setupDownloadStores } from "./downloads/utils";
import * as p from "plimit-lit";

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
  useEffect(() => {
    try {
      initApp(downloads, setDownloads);
    } catch (error) {

      console.error(error);
    }
  }, []);
  return (
    <PaperProvider theme={darkTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="repos" options={{ headerShown: false }} />
        <Stack.Screen name="contents" options={{ headerShown: false }} />
        <Stack.Screen name="chapters" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}

function initApp(downloads: any, setDownloads: any) {
  setupDownloadStores(downloads, setDownloads);
}

