import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Card, Button, Divider, List, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStateStore } from '../lib/auth';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const authState = authStateStore((state: any) => state.authState);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!authState?.user) {
      Alert.alert(
        'Not Signed In',
        'You need to be signed in to delete your account.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will:\n\n• Delete all your data from our servers\n• Remove your reading progress and favorites\n• Delete your account permanently\n• Clear all local app data',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Import the deletion function
              const { deleteAccountCompletely } = await import('../lib/auth');
              
              // Perform the deletion
              await deleteAccountCompletely();
              
              Alert.alert(
                'Account Deleted',
                'Your account and all associated data have been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back to main screen
                      router.replace('/');
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Account deletion error:', error);
              Alert.alert(
                'Deletion Failed',
                error instanceof Error ? error.message : 'An error occurred while deleting your account. Please try again or contact support.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://novel-era.web.app/privacy-policy');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Privacy & Data Policy
        </Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Novel Era - Data Privacy & Account Management
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
            Your privacy and data security are our top priorities
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Data Collection & Security"
          left={(props) => <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.text}>
            <Text style={styles.bold}>Does our app collect user data?</Text> Yes
          </Text>
          <Text variant="bodyMedium" style={styles.text}>
            <Text style={styles.bold}>Is all user data encrypted in transit?</Text> Yes
          </Text>
          
          <Divider style={styles.divider} />
          
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Required Data Types We Collect:
          </Text>
          <List.Item
            title="Account Information"
            description="Username, email address for account creation and authentication"
            left={() => <List.Icon icon="account" />}
          />
          <List.Item
            title="Reading Preferences"
            description="Book favorites, reading progress, and personalization settings"
            left={() => <List.Icon icon="book-open-variant" />}
          />
          <List.Item
            title="Usage Analytics"
            description="App usage patterns to improve user experience (anonymized)"
            left={() => <List.Icon icon="chart-line" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Account Creation Methods"
          left={(props) => <Ionicons name="person-add" size={24} color="#2196F3" />}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.text}>
            Our app supports the following account creation methods:
          </Text>
          <List.Item
            title="OAuth Authentication"
            description="Sign in with Google or other OAuth providers"
            left={() => <List.Icon icon="google" />}
          />
          <List.Item
            title="Username and Password"
            description="Traditional email and password registration"
            left={() => <List.Icon icon="email" />}
          />
          <List.Item
            title="Username and Other Authentication"
            description="Email with additional verification methods"
            left={() => <List.Icon icon="two-factor-authentication" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Account Deletion"
          left={(props) => <Ionicons name="trash" size={24} color="#F44336" />}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.text}>
            You can delete your account and all associated data instantly using the button below. This action is irreversible.
          </Text>
          
          <Text variant="titleSmall" style={styles.sectionTitle}>
            What gets deleted immediately:
          </Text>
          <List.Item
            title="Account Information"
            description="Username, email, and authentication data"
            left={() => <List.Icon icon="account-remove" />}
          />
          <List.Item
            title="Cloud Data"
            description="All data stored on our servers"
            left={() => <List.Icon icon="cloud-off" />}
          />
          <List.Item
            title="Local Data"
            description="All app data stored on your device"
            left={() => <List.Icon icon="phone-remove" />}
          />
          <List.Item
            title="Reading Data"
            description="Favorites, reading progress, and preferences"
            left={() => <List.Icon icon="book-remove" />}
          />
          
          <Text variant="bodySmall" style={styles.retentionText}>
            <Text style={styles.bold}>Instant Deletion:</Text> Your account and all associated data will be permanently deleted immediately. 
            This action cannot be undone. You will be signed out and returned to the main screen.
          </Text>
          
          <Button
            mode="contained"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            buttonColor="#F44336"
            icon={isDeleting ? undefined : "delete"}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            ) : null}
            {isDeleting ? "Deleting Account..." : "Delete Account Permanently"}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Privacy Policy"
          left={(props) => <Ionicons name="document-text" size={24} color="#9C27B0" />}
        />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.text}>
            For complete details about our data practices, please review our full privacy policy.
          </Text>
          <Button
            mode="outlined"
            onPress={openPrivacyPolicy}
            style={styles.policyButton}
            icon="open-in-new"
          >
            View Full Privacy Policy
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.footerCard}>
        <Card.Content>
          <Text variant="bodySmall" style={styles.footerText}>
            Novel Era • Version 1.0.3 • © 2024{'\n'}
            For support or privacy concerns: hindevstudios@gmail.com
          </Text>
        </Card.Content>
      </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginVertical: 8,
  },
  footerCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  text: {
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  deleteButton: {
    marginTop: 16,
  },
  policyButton: {
    marginTop: 12,
  },
  retentionText: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    lineHeight: 18,
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 18,
  },
});