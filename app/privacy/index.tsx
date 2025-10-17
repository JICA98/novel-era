import React from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Text, Card, Button, Divider, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStateStore } from '../lib/auth';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const authState = authStateStore((state: any) => state.authState);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'To delete your account and associated data, please send an email to support@novel-era.com with your account details. We will process your request within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => {
            const subject = 'Account Deletion Request - Novel Era';
            const body = `Please delete my account and all associated data.
            
Account Details:
- User ID: ${authState?.user?.uid || 'Not logged in'}
- Email: ${authState?.user?.email || 'Not provided'}

I understand that this action is irreversible and all my data will be permanently deleted.`;
            
            Linking.openURL(`mailto:support@novel-era.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          }
        }
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://novel-era.com/privacy-policy');
  };

  return (
    <ScrollView style={styles.container}>
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
            You have the right to delete your account and all associated data at any time.
          </Text>
          
          <Text variant="titleSmall" style={styles.sectionTitle}>
            What gets deleted:
          </Text>
          <List.Item
            title="Account Information"
            description="Username, email, and authentication data"
            left={() => <List.Icon icon="account-remove" />}
          />
          <List.Item
            title="Reading Data"
            description="Favorites, reading progress, and preferences"
            left={() => <List.Icon icon="book-remove" />}
          />
          <List.Item
            title="Usage Analytics"
            description="All associated usage data and analytics"
            left={() => <List.Icon icon="analytics" />}
          />
          
          <Text variant="bodySmall" style={styles.retentionText}>
            <Text style={styles.bold}>Data Retention:</Text> All data is permanently deleted within 30 days of your request. 
            Some backup data may be retained for up to 90 days for security purposes before permanent deletion.
          </Text>
          
          <Button
            mode="contained"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            buttonColor="#F44336"
            icon="email"
          >
            Request Account Deletion
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
            For support or privacy concerns: support@novel-era.com
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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