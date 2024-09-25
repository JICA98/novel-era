import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="repos/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}
