import React from "react";
import { Linking, SafeAreaView, StyleSheet, View } from "react-native";
import { Appbar, Button, Title, Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

export default function AtelierNovels() {
    const router = useRouter();
    const { colors } = useTheme();

    const handleAccountDeletion = async () => {
        const email = "novelera@gmail.com"; // fallback email
        const subject = "Account Deletion Request";
        const body = "Please delete my account and all associated data.";
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error("Error opening email client:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Atelier Novels" />
            </Appbar.Header>
            <View style={styles.content}>
                <Title>Account Management</Title>
                <Text style={styles.description}>
                    If you wish to delete your account, please send us a request via email.
                </Text>
                <Button
                    mode="contained"
                    buttonColor={colors.error}
                    onPress={handleAccountDeletion}
                    style={styles.button}
                >
                    Request Account Deletion
                </Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    description: {
        marginVertical: 12,
    },
    button: {
        marginTop: 16,
    }
});