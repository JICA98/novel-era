import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="repos/[repoId]" options={{ headerShown: false }} />
      <Stack.Screen name="content/[contentId]" options={{ headerShown: false }} />
    </Stack>
  );
}
