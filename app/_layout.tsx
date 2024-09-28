import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="repos" options={{ headerShown: false }} />
        <Stack.Screen name="contents" options={{ headerShown: false }} />
        <Stack.Screen name="chapters" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
