import { Platform, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function WebChaptersLayout() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 16 }}>
        Chapter Reading
      </Text>
      <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
        Chapter reading is available in the mobile app.
      </Text>
    </View>
  );
}