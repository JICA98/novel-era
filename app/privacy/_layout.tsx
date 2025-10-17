import { Stack } from 'expo-router';

export default function PrivacyLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Privacy & Data Policy',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="web"
        options={{
          title: 'Privacy Policy - Web View',
          headerShown: false,
        }}
      />
    </Stack>
  );
}