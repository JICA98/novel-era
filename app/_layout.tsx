import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="repos" options={{ headerShown: false }} />
      <Stack.Screen name="contents" options={{ headerShown: false }} />
      <Stack.Screen name="chapters" options={{ headerShown: false }} />
    </Stack>
  );
}
