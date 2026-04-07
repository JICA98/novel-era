import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Pressable } from "react-native";
import { ThemeSelectionAccordion } from "./themeSettings";
import { userPrefStore, getUserPreference } from "../userpref";
import Auth from "./accountSettings";
import { List, RadioButton, Snackbar, Switch, Text, useTheme, Avatar, IconButton } from "react-native-paper";
import UseRepositoryLayout from "../_repos";
import { Repo } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { authStateStore, signOutUser } from "../lib/auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Settings() {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const [snackbarText, setSnackbarText] = useState('');
    const { colors } = useTheme();
    const authUser = authStateStore((state: any) => state.content);

    useEffect(() => {
        async function fetchUserPreferences() {
            const preferences = await getUserPreference();
            setUserPref(preferences);
        }
        fetchUserPreferences();
    }, [setUserPref]);

    const handleLogOut = async () => {
        try {
            await signOutUser();
            setSnackbarText('Signed out successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unable to sign out';
            setSnackbarText(message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* User Profile Header */}
                <View style={styles.profileSection}>
                    <LinearGradient
                        colors={[colors.primary, colors.primaryContainer]}
                        style={styles.profileCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.profileContent}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2ko2D-ttQqT9AIKONgZHA9tiCiTr7svsc9wcZlOaq5gfFPmd-djJdjhgC7eWyVhCzQl3qAczgCKKGKuPJor2ga399wm6KZMpJL1YfUCx341-7axDyl6T6s0hDvqL-lfkwcPKpDnnapeH06fQwZ75GqziALBtsE4fYuJO0kam4R0V2203E8_8XqpXzggnntAHAu6aESgb-lZsmMl-K8FbXzQ9rENYgL7_fIKqFRjPAV4nl6WEiJgl1U4dfKIayCtbGTr5hZ4mEKo9h" }}
                                    style={styles.avatar}
                                />
                                <View style={[styles.premiumBadge, { backgroundColor: colors.tertiaryContainer }]}>
                                    <Text style={[styles.premiumText, { color: colors.onTertiaryContainer }]}>PREMIUM</Text>
                                </View>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, { color: 'white' }]}>Elias Thorne</Text>
                                <Text style={[styles.profileTitle, { color: 'rgba(255,255,255,0.8)' }]}>Librarian of the Nocturne Realm</Text>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'white' }]}>
                                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit Profile</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, styles.outlineButton]}>
                                        <Text style={[styles.actionButtonText, { color: 'white' }]}>Share Profile</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Reading Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>12 Books</Text>
                                <Text style={styles.statLabel}>TOTAL READ</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>452 hrs</Text>
                                <Text style={styles.statLabel}>TIME SPENT</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>15 Days</Text>
                                <Text style={styles.statLabel}>CURRENT STREAK</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.settingsContainer}>
                    {/* Account Settings */}
                    <View style={[styles.settingGroup, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={styles.groupHeader}>
                            <MaterialIcons name="account-circle" size={24} color={colors.primary} />
                            <Text style={styles.groupTitle}>Account</Text>
                        </View>
                        <Auth setSnackbarText={setSnackbarText} />
                    </View>

                    {userPref && (
                        <>
                            {/* Reading Preferences */}
                            <View style={[styles.settingGroup, { backgroundColor: colors.surfaceVariant }]}>
                                <View style={styles.groupHeader}>
                                    <MaterialIcons name="menu-book" size={24} color={colors.primary} />
                                    <Text style={styles.groupTitle}>Reading Preferences</Text>
                                </View>
                                <ThemeSelectionAccordion
                                    userPref={userPref}
                                    setUserPref={setUserPref}
                                    setSnackbarText={setSnackbarText}
                                />
                            </View>

                            {/* Search Preferences */}
                            <View style={[styles.settingGroup, { backgroundColor: colors.surfaceVariant }]}>
                                <View style={styles.groupHeader}>
                                    <MaterialIcons name="search" size={24} color={colors.primary} />
                                    <Text style={styles.groupTitle}>Search Preferences</Text>
                                </View>
                                <UseRepositoryLayout
                                    props={{
                                        renderRepositories: (repos) => (
                                            <SearchPreferencesSection
                                                repos={repos}
                                                setSnackbarText={setSnackbarText}
                                            />
                                        ),
                                    }}
                                />
                            </View>
                        </>
                    )}

                    {/* Log Out Button */}
                    {authUser.state === 'SIGNED_IN' && (
                        <TouchableOpacity
                            style={[styles.logoutButton, { borderColor: colors.error + '40' }]}
                            onPress={handleLogOut}
                        >
                            <MaterialIcons name="logout" size={20} color={colors.error} />
                            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
            <Snackbar
                visible={!!snackbarText.length}
                onDismiss={() => setSnackbarText('')}
                action={{
                    label: 'Dismiss',
                    onPress: () => setSnackbarText(''),
                }}
            >
                {snackbarText}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    profileSection: {
        padding: 24,
        paddingBottom: 12,
    },
    profileCard: {
        borderRadius: 32,
        padding: 32,
        overflow: 'hidden',
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 32,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 32,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    premiumBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    premiumText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    profileInfo: {
        flex: 1,
        minWidth: 200,
    },
    profileName: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'serif',
    },
    profileTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 24,
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    actionButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
    },
    outlineButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    actionButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 40,
        gap: 16,
        flexWrap: 'wrap',
    },
    statBox: {
        flex: 1,
        minWidth: 100,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    statValue: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
        fontFamily: 'serif',
        marginBottom: 4,
    },
    statLabel: {
        color: '#A5B4FC', // indigo-300
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingsContainer: {
        padding: 24,
        gap: 24,
    },
    settingGroup: {
        borderRadius: 24,
        padding: 24,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
        paddingHorizontal: 8,
    },
    groupTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        borderRadius: 100,
        borderWidth: 2,
        marginTop: 8,
    },
    logoutText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});

function SearchPreferencesSection({ repos, setSnackbarText }: { repos: Repo[]; setSnackbarText: (text: string) => void; }) {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setDefaultUniversalSearch = userPrefStore((state: any) => state.setDefaultUniversalSearch);
    const setPreferredRepository = userPrefStore((state: any) => state.setPreferredRepository);
    const [expanded, setExpanded] = useState(false);
    const preferredRepoId = userPref?.preferredRepositoryId;
    const defaultUniversalSearch = userPref?.defaultUniversalSearch ?? false;

    const repoItems = useMemo(() => {
        return repos.map((repo) => ({ id: repo.id, name: repo.name }));
    }, [repos]);

    if (!userPref) {
        return null;
    }

    return (
        <List.Accordion
            title="Search Preferences"
            expanded={expanded}
            onPress={() => setExpanded((value) => !value)}
            left={(props) => <List.Icon {...props} icon="magnify" />}
        >
            <List.Item
                title="Enable universal search by default"
                description="Use all sources when opening search"
                right={() => (
                    <Switch
                        value={defaultUniversalSearch}
                        onValueChange={(value) => {
                            setDefaultUniversalSearch(value);
                            setSnackbarText('Universal search preference updated');
                        }}
                    />
                )}
            />
            <List.Item
                title="Preferred source"
                description={preferredRepoId ? repoItems.find((item) => item.id === preferredRepoId)?.name : 'First available'}
                right={() => (
                    <Text variant="labelMedium" style={{ alignSelf: 'center' }}>
                        {preferredRepoId ? 'Selected' : 'Auto'}
                    </Text>
                )}
            />
            <RadioButton.Group
                value={preferredRepoId ?? ''}
                onValueChange={(value) => {
                    const repoId = value || undefined;
                    setPreferredRepository(repoId);
                    setSnackbarText('Preferred source updated');
                }}
            >
                <List.Item
                    title="No preference"
                    description="Use the first available source"
                    left={(props) => <List.Icon {...props} icon="circle-outline" />}
                    right={() => <RadioButton value="" />}
                    onPress={() => {
                        setPreferredRepository(undefined);
                        setSnackbarText('Preferred source cleared');
                    }}
                />
                {repoItems.map((repo) => (
                    <List.Item
                        key={repo.id}
                        title={repo.name}
                        onPress={() => {
                            setPreferredRepository(repo.id);
                            setSnackbarText('Preferred source updated');
                        }}
                        right={() => <RadioButton value={repo.id} />}
                    />
                ))}
            </RadioButton.Group>
        </List.Accordion>
    );
}