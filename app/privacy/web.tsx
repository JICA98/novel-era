import React from 'react';
import { View, ScrollView, StyleSheet, Linking, Platform } from 'react-native';
import { Text, Card, Button, Divider, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Standalone web component for privacy policy and account deletion
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
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineLarge" style={styles.mainTitle}>
              Novel Era
            </Text>
            <Text variant="headlineSmall" style={styles.title}>
              Data Privacy Disclosure & Account Management
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Transparent data practices for Google Play Store compliance
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title="📊 Data Collection Disclosure"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <View style={styles.disclosureItem}>
              <Text variant="titleMedium" style={styles.question}>
                Does your app collect or share any of the required user data types?
              </Text>
              <Text variant="headlineSmall" style={[styles.answer, styles.yesAnswer]}>
                ✅ YES
              </Text>
            </View>

            <View style={styles.disclosureItem}>
              <Text variant="titleMedium" style={styles.question}>
                Is all of the user data collected by your app encrypted in transit?
              </Text>
              <Text variant="headlineSmall" style={[styles.answer, styles.yesAnswer]}>
                ✅ YES
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📋 Required Data Types We Collect:
            </Text>
            
            <View style={styles.dataTypesList}>
              <View style={styles.dataType}>
                <Text style={styles.dataTypeIcon}>👤</Text>
                <View style={styles.dataTypeContent}>
                  <Text variant="titleSmall" style={styles.dataTypeTitle}>Account Information</Text>
                  <Text variant="bodyMedium">Username, email address for account creation and authentication</Text>
                </View>
              </View>
              
              <View style={styles.dataType}>
                <Text style={styles.dataTypeIcon}>📚</Text>
                <View style={styles.dataTypeContent}>
                  <Text variant="titleSmall" style={styles.dataTypeTitle}>Reading Preferences</Text>
                  <Text variant="bodyMedium">Book favorites, reading progress, and personalization settings</Text>
                </View>
              </View>
              
              <View style={styles.dataType}>
                <Text style={styles.dataTypeIcon}>📈</Text>
                <View style={styles.dataTypeContent}>
                  <Text variant="titleSmall" style={styles.dataTypeTitle}>Usage Analytics</Text>
                  <Text variant="bodyMedium">App usage patterns to improve user experience (anonymized)</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title="🔐 Account Creation Methods"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <Text variant="bodyLarge" style={styles.text}>
              Our app supports the following account creation methods:
            </Text>
            
            <View style={styles.methodsList}>
              <View style={styles.method}>
                <Text style={styles.methodIcon}>✅</Text>
                <Text variant="titleSmall">Username and password</Text>
              </View>
              <View style={styles.method}>
                <Text style={styles.methodIcon}>✅</Text>
                <Text variant="titleSmall">Username and other authentication</Text>
              </View>
              <View style={styles.method}>
                <Text style={styles.methodIcon}>✅</Text>
                <Text variant="titleSmall">Username, password and other authentication</Text>
              </View>
              <View style={styles.method}>
                <Text style={styles.methodIcon}>✅</Text>
                <Text variant="titleSmall">OAuth (Google Sign-In)</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title="🗑️ Account Deletion"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <Text variant="bodyLarge" style={styles.text}>
              You have the right to delete your account and all associated data at any time. 
              This link allows users to request account deletion as required by Google Play Store policies.
            </Text>
            
            <View style={styles.deletionSteps}>
              <Text variant="titleMedium" style={styles.stepsTitle}>
                Steps to Request Account Deletion:
              </Text>
              <Text variant="bodyMedium" style={styles.step}>
                1. Click the "Request Account Deletion" button below
              </Text>
              <Text variant="bodyMedium" style={styles.step}>
                2. Send the pre-filled email to our support team
              </Text>
              <Text variant="bodyMedium" style={styles.step}>
                3. Include your account details (email or user ID)
              </Text>
              <Text variant="bodyMedium" style={styles.step}>
                4. We will process your request within 30 days
              </Text>
            </View>
            
            <View style={styles.dataRetention}>
              <Text variant="titleSmall" style={styles.retentionTitle}>
                Data Retention Policy:
              </Text>
              <Text variant="bodyMedium" style={styles.retentionText}>
                • All personal data is permanently deleted within 30 days
              </Text>
              <Text variant="bodyMedium" style={styles.retentionText}>
                • Backup data may be retained for up to 90 days for security purposes
              </Text>
              <Text variant="bodyMedium" style={styles.retentionText}>
                • No data is kept after the retention period expires
              </Text>
            </View>
            
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
            title="📄 Additional Resources"
            titleStyle={styles.cardTitle}
          />
          <Card.Content>
            <Button
              mode="outlined"
              onPress={openPrivacyPolicy}
              style={styles.policyButton}
              icon="open-in-new"
            >
              View Complete Privacy Policy
            </Button>
            
            <Text variant="bodyMedium" style={styles.contactText}>
              For questions about data practices or privacy concerns:
            </Text>
            <Text variant="bodyMedium" style={styles.emailText}>
              📧 hindevstudios@gmail.com
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.footerCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.footerText}>
              Novel Era • Version 1.0.3+10 • © 2024{'\n'}
              This page complies with Google Play Store data disclosure requirements{'\n'}
              Last updated: October 17, 2025
            </Text>
          </Card.Content>
        </Card>
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
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    elevation: 4,
  },
  card: {
    margin: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  footerCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: '#f8f9fa',
  },
  mainTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    color: '#666',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclosureItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  question: {
    marginBottom: 8,
    color: '#333',
  },
  answer: {
    fontWeight: 'bold',
  },
  yesAnswer: {
    color: '#4caf50',
  },
  text: {
    marginBottom: 16,
    lineHeight: 24,
    color: '#333',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976d2',
  },
  divider: {
    marginVertical: 20,
  },
  dataTypesList: {
    marginTop: 8,
  },
  dataType: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dataTypeIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  dataTypeContent: {
    flex: 1,
  },
  dataTypeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  methodsList: {
    marginTop: 12,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
  },
  methodIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#4caf50',
  },
  deletionSteps: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  stepsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
  },
  step: {
    marginBottom: 6,
    lineHeight: 20,
  },
  dataRetention: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  retentionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#f57c00',
  },
  retentionText: {
    marginBottom: 4,
    lineHeight: 20,
  },
  deleteButton: {
    paddingVertical: 4,
  },
  policyButton: {
    marginBottom: 16,
  },
  contactText: {
    marginTop: 8,
    marginBottom: 4,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});