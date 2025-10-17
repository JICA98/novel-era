import React from 'react';
import { View, ScrollView, StyleSheet, Linking, Platform } from 'react-native';
import { Text, Card, Button, Divider, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Simplified mobile component with just privacy policy link and account deletion
export default function PrivacyWebComponent() {
  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      const subject = 'Account Deletion Request - Novel Era';
      const body = `Please delete my account and all associated data.
      
I understand that this action is irreversible and all my data will be permanently deleted.

Account Details:
- Please provide your user ID or email address associated with your Novel Era account
- Date of request: ${new Date().toLocaleDateString()}

Thank you.`;
      
      window.open(`mailto:hindevstudios@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } else {
      Linking.openURL(`mailto:hindevstudios@gmail.com?subject=Account Deletion Request&body=Please delete my account and all associated data.`);
    }
  };

  const openPrivacyPolicy = () => {
    if (Platform.OS === 'web') {
      window.open('https://novel-era.web.app/privacy-policy', '_blank');
    } else {
      Linking.openURL('https://novel-era.web.app/privacy-policy');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.webContainer}>
        <Button
          mode="outlined"
          onPress={openPrivacyPolicy}
          style={styles.button}
          icon="open-in-new"
        >
          View Privacy Policy
        </Button>
        
        <Button
          mode="contained"
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
          buttonColor="#F44336"
          icon="delete"
        >
          Delete Account
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  webContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    padding: 16,
  },
  button: {
    marginBottom: 16,
  },
  deleteButton: {
    marginBottom: 16,
  },
});