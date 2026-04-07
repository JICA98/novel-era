import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Snackbar, Switch, useTheme } from "react-native-paper";

import { Colors } from "@/constants/Colors";
import { AtelierText } from "@/components/AtelierText";
import { userPrefStore, getUserPreference, ThemeOptions } from "../userpref";
import { authStateStore } from "../lib/auth";
import { useAccountSettings, AuthDialogs } from "./accountSettings";
import { SettingsSection, SettingsItem, StatBox } from "./components";
import UseRepositoryLayout from "../_repos";
import { Repo } from "@/types";
import { chapterTrackerStore, noveFavoriteStore } from "../favorites/tracker";

const { width } = Dimensions.get('screen');

export default function Settings() {
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];
    
    const userPref = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const [snackbarText, setSnackbarText] = useState('');

    const actions = useAccountSettings(setSnackbarText);
    const { authUser } = actions;

    // Stats data
    const allTrackers = chapterTrackerStore((state: any) => state.content);
    const favoriteTrackers = noveFavoriteStore((state: any) => state.content);

    const totalRead = allTrackers instanceof Map ? allTrackers.size : Object.keys(allTrackers || {}).length;
    const favoriteCount = favoriteTrackers instanceof Map ? favoriteTrackers.size : Object.keys(favoriteTrackers || {}).length;

    useEffect(() => {
        async function fetchUserPreferences() {
            const preferences = await getUserPreference();
            setUserPref(preferences);
        }
        fetchUserPreferences();
    }, [setUserPref]);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card Section */}
                <View style={styles.profileSection}>
                    <LinearGradient
                        colors={[themeColors.primary, themeColors.primaryContainer]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileCard}
                    >
                        <View style={styles.profileContent}>
                            <View style={styles.profileImageContainer}>
                                <Image 
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2ko2D-ttQqT9AIKONgZHA9tiCiTr7svsc9wcZlOaq5gfFPmd-djJdjhgC7eWyVhCzQl3qAczgCKKGKuPJor2ga399wm6KZMpJL1YfUCx341-7axDyl6T6s0hDvqL-lfkwcPKpDnnapeH06fQwZ75GqziALBtsE4fYuJO0kam4R0V2203E8_8XqpXzggnntAHAu6aESgb-lZsmMl-K8FbXzQ9rENYgL7_fIKqFRjPAV4nl6WEiJgl1U4dfKIayCtbGTr5hZ4mEKo9h' }} 
                                    style={styles.profileImage}
                                />
                                <View style={[styles.premiumBadge, { backgroundColor: '#ffdcc3' }]}>
                                    <AtelierText variant="caption" bold style={{ color: '#2f1500', fontSize: 10 }}>PREMIUM</AtelierText>
                                </View>
                            </View>
                            
                            <View style={styles.profileInfo}>
                                <AtelierText variant="headline" bold style={{ color: '#ffffff' }}>
                                    {authUser.email?.split('@')[0] || "Elias Thorne"}
                                </AtelierText>
                                <AtelierText variant="body" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Librarian of the Nocturne Realm
                                </AtelierText>
                                
                                <View style={styles.profileActions}>
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ffffff' }]}>
                                        <AtelierText variant="label" bold style={{ color: themeColors.primary }}>Edit Profile</AtelierText>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                        <AtelierText variant="label" bold style={{ color: '#ffffff' }}>Share</AtelierText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Bento Stats Row */}
                        <View style={styles.statsRow}>
                            <StatBox value={`${totalRead} Books`} label="Total Read" />
                            <StatBox value="452 hrs" label="Time Spent" />
                            <StatBox value="15 Days" label="Streak" />
                        </View>
                    </LinearGradient>
                </View>

                {/* Settings Groups */}
                <View style={styles.settingsGroups}>
                    {/* Account Section */}
                    <SettingsSection title="Account" icon="account-circle">
                        <SettingsItem 
                            title="Email" 
                            description={authUser.email || "Sign in to see email"} 
                            showChevron 
                            onPress={() => {}}
                        />
                        <SettingsItem 
                            title="Cloud Backup" 
                            description="Backup or restore preferences" 
                            showChevron 
                            onPress={() => actions.setBackup(true)}
                        />
                        <SettingsItem 
                            title="Restore Data" 
                            description="Fetch from cloud" 
                            showChevron 
                            onPress={() => actions.setRestore(true)}
                        />
                    </SettingsSection>

                    {/* Reading Preferences Section */}
                    <SettingsSection title="Reading Preferences" icon="book-open-variant">
                        <SettingsItem 
                            title="Default Font" 
                            description={`${userPref?.editorPreferences?.fontFamily || 'Serif'} (18px)`} 
                            icon="format-font"
                        />
                        <SettingsItem 
                            title="Reading Mode" 
                            description="Continuous Scroll" 
                            rightElement={
                                <View style={[styles.toggleContainer, { backgroundColor: themeColors.secondaryContainer }]}>
                                    <TouchableOpacity style={[styles.toggleOption, { backgroundColor: '#ffffff' }]}>
                                        <AtelierText variant="caption" bold style={{ color: themeColors.secondary }}>Scroll</AtelierText>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.toggleOption}>
                                        <AtelierText variant="caption" bold style={{ color: themeColors.onSecondaryContainer }}>Page</AtelierText>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                        <SettingsItem 
                            title="Auto-scroll speed" 
                            description="2.5x" 
                            rightElement={
                                <View style={styles.sliderMock}>
                                    <View style={[styles.sliderTrack, { backgroundColor: themeColors.outlineVariant }]}>
                                        <View style={[styles.sliderFill, { backgroundColor: themeColors.primary, width: '60%' }]} />
                                    </View>
                                </View>
                            }
                        />
                    </SettingsSection>

                    {/* App Theme Section */}
                    <SettingsSection title="App Theme" icon="theme-light-dark">
                        <SettingsItem 
                            title="Theme Mode" 
                            description={userPref?.theme || "System"}
                            rightElement={
                                <View style={[styles.toggleContainer, { backgroundColor: themeColors.secondaryContainer }]}>
                                    <TouchableOpacity 
                                       onPress={() => setUserPref({...userPref, theme: ThemeOptions.Light})}
                                       style={[styles.toggleOption, userPref?.theme === ThemeOptions.Light && { backgroundColor: '#ffffff' }]}
                                    >
                                        <AtelierText variant="caption" bold>Light</AtelierText>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                       onPress={() => setUserPref({...userPref, theme: ThemeOptions.Dark})}
                                       style={[styles.toggleOption, userPref?.theme === ThemeOptions.Dark && { backgroundColor: '#ffffff' }]}
                                    >
                                        <AtelierText variant="caption" bold>Dark</AtelierText>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </SettingsSection>

                    {/* Search Preferences Section */}
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

                    {/* About Section */}
                    <SettingsSection title="About" icon="information-outline">
                        <SettingsItem title="Version" description="2.4.1" />
                        <SettingsItem title="Privacy Policy" icon="open-in-new" showChevron onPress={() => {}} />
                        <SettingsItem title="Terms of Service" icon="open-in-new" showChevron onPress={() => {}} />
                    </SettingsSection>

                    {/* Logout Button */}
                    <TouchableOpacity 
                        style={[styles.logoutButton, { borderColor: themeColors.error + '33' }]}
                        onPress={() => actions.setSignOut(true)}
                    >
                        <MaterialCommunityIcons name="logout" size={20} color={themeColors.error} />
                        <AtelierText variant="body" bold style={{ color: themeColors.error }}>Log Out</AtelierText>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Auth Dialogs */}
            <AuthDialogs actions={actions} setSnackbarText={setSnackbarText} />

            <Snackbar
                visible={!!snackbarText.length}
                onDismiss={() => setSnackbarText('')}
                duration={3000}
                style={{ marginBottom: 90 }}
            >
                {snackbarText}
            </Snackbar>
        </View>
    );
}

function SearchPreferencesSection({ repos, setSnackbarText }: { repos: Repo[]; setSnackbarText: (text: string) => void; }) {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setDefaultUniversalSearch = userPrefStore((state: any) => state.setDefaultUniversalSearch);
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];
    
    const defaultUniversalSearch = userPref?.defaultUniversalSearch ?? false;

    if (!userPref) return null;

    return (
        <SettingsSection title="Search Preferences" icon="magnify">
            <SettingsItem 
                title="Universal Search" 
                description="Search across all sources" 
                rightElement={
                    <Switch
                        value={defaultUniversalSearch}
                        onValueChange={(value) => {
                            setDefaultUniversalSearch(value);
                            setSnackbarText('Universal search updated');
                        }}
                        color={themeColors.primary}
                    />
                }
            />
            <SettingsItem 
                title="Preferred Source" 
                description={userPref.preferredRepositoryId ? repos.find(r => r.id === userPref.preferredRepositoryId)?.name : "Auto"}
                showChevron
                onPress={() => {}}
            />
        </SettingsSection>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
    },
    headerIcon: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 120, // Space for bottom nav
    },
    profileSection: {
        paddingHorizontal: 24,
        marginTop: 64,
        marginBottom: 24,
    },
    profileCard: {
        borderRadius: 36,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    premiumBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    profileInfo: {
        flex: 1,
    },
    profileActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 32,
        gap: 12,
    },
    settingsGroups: {
        paddingHorizontal: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 24,
        gap: 4,
    },
    toggleOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    sliderMock: {
        width: 120,
        height: 24,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    sliderFill: {
        height: '100%',
        borderRadius: 3,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 32,
        borderWidth: 2,
        marginTop: 16,
        marginBottom: 24,
    },
});