import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, useColorScheme, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Snackbar, Switch } from "react-native-paper";

import { Colors } from "@/constants/Colors";
import { AtelierText } from "@/components/AtelierText";
import { userPrefStore, getUserPreference, ThemeOptions } from "../userpref";
import { useAccountSettings, AuthDialogs } from "./accountSettings";
import { SettingsSection, SettingsItem, StatBox } from "./components";
import UseRepositoryLayout from "../_repos";
import { Repo } from "@/types";
import { ChapterTracker, NovelTracker, chapterTrackerStore, noveFavoriteStore } from "../favorites/tracker";
import { AuthState, signInWithGoogle } from "../lib/auth";
import { useTheme } from 'react-native-paper';

function getBoundStoreContent<T>(store: any): T | undefined {
    if (!store) {
        return undefined;
    }
    if (typeof store.getState === 'function') {
        return store.getState().content as T;
    }
    return store.content as T | undefined;
}

function normalizeDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatStatNumber(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
        return '0';
    }
    if (value >= 1000) {
        const compact = value / 1000;
        return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}k`;
    }
    return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

function calculateReadingStreak(dayKeys: string[]): number {
    if (!dayKeys.length) {
        return 0;
    }

    const timestamps = dayKeys
        .map((dayKey) => new Date(`${dayKey}T00:00:00`).getTime())
        .sort((a, b) => b - a);

    let streak = 1;
    for (let index = 1; index < timestamps.length; index += 1) {
        const previous = timestamps[index - 1];
        const current = timestamps[index];
        const dayDifference = Math.round((previous - current) / (24 * 60 * 60 * 1000));
        if (dayDifference !== 1) {
            break;
        }
        streak += 1;
    }

    return streak;
}

export default function Settings() {
    const themeColors = useTheme().colors as any;
    
    const userPref = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const [snackbarText, setSnackbarText] = useState('');
    const [authActionLoading, setAuthActionLoading] = useState(false);

    const actions = useAccountSettings(setSnackbarText);
    const { authUser } = actions;
    const isSignedIn = authUser.state === AuthState.SIGNED_IN;
    const authStatusDescription = isSignedIn
        ? `Signed in with ${authUser.provider ?? 'account'}`
        : 'Not signed in';
    const accountActionTitle = isSignedIn ? 'Google Account' : 'Google Sign-In';
    const accountActionDescription = isSignedIn
        ? authUser.email || 'Signed in'
        : authActionLoading
            ? 'Connecting to Google...'
            : 'Tap to sign in with Google';

    // Stats data
    const allTrackers = chapterTrackerStore((state: any) => state.content);
    const favoriteTrackers = noveFavoriteStore((state: any) => state.content);
    const profileStats = useMemo(() => {
        const chapterTrackers = allTrackers instanceof Map
            ? Array.from(allTrackers.values())
                .map((trackerStore) => getBoundStoreContent<ChapterTracker>(trackerStore))
                .filter((tracker): tracker is ChapterTracker => Boolean(tracker))
            : [];

        const novelTrackers = favoriteTrackers instanceof Map
            ? Array.from(favoriteTrackers.values())
                .map((trackerStore) => getBoundStoreContent<NovelTracker>(trackerStore))
                .filter((tracker): tracker is NovelTracker => Boolean(tracker))
            : [];

        const startedNovels = new Set<string>();
        const activeDayKeys = new Set<string>();
        let chaptersRead = 0;

        for (const tracker of chapterTrackers) {
            const hasProgress = tracker.status !== 'unread' || tracker.chapterProgress > 0;
            if (!hasProgress) {
                continue;
            }

            startedNovels.add(`${tracker.repo.id}:${tracker.novel.bookId}`);
            chaptersRead += tracker.status === 'read' || tracker.chapterProgress >= 1
                ? 1
                : Math.max(tracker.chapterProgress, 0);

            if (tracker.lastRead) {
                activeDayKeys.add(normalizeDateKey(tracker.lastRead));
            }
        }

        const libraryCount = novelTrackers.filter((tracker) => tracker.favorite).length;

        return {
            booksStarted: startedNovels.size,
            chaptersRead,
            streakDays: calculateReadingStreak(Array.from(activeDayKeys)),
            libraryCount,
        };
    }, [allTrackers, favoriteTrackers]);

    useEffect(() => {
        async function fetchUserPreferences() {
            const preferences = await getUserPreference();
            setUserPref(preferences);
        }
        fetchUserPreferences();
    }, [setUserPref]);

    async function handleAccountPress() {
        if (isSignedIn) {
            actions.setSignOut(true);
            return;
        }

        setAuthActionLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unable to sign in with Google';
            setSnackbarText(message);
        } finally {
            setAuthActionLoading(false);
        }
    }

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
                        <View style={styles.statsHeader}>
                            <AtelierText variant="title" bold style={{ color: '#ffffff' }}>
                                Reading Statistics
                            </AtelierText>
                            <AtelierText variant="body" style={{ color: 'rgba(255, 255, 255, 0.72)' }}>
                                A quick snapshot of your reading journey.
                            </AtelierText>
                        </View>
                        <View style={styles.statsRow}>
                            <StatBox value={profileStats.booksStarted} label="Books Started" />
                            <StatBox value={formatStatNumber(profileStats.chaptersRead)} label="Chapters Read" />
                            <StatBox value={`${profileStats.streakDays} Days`} label="Streak" />
                        </View>
                    </LinearGradient>
                </View>

                {/* Settings Groups */}
                <View style={styles.settingsGroups}>
                    {/* Account Section */}
                    <SettingsSection title="Account" icon="account-circle">
                        <SettingsItem 
                            title="Auth Status" 
                            description={authStatusDescription}
                            rightElement={
                                <MaterialCommunityIcons
                                    name={isSignedIn ? "check-decagram" : "account-off-outline"}
                                    size={20}
                                    color={isSignedIn ? themeColors.primary : themeColors.outline}
                                />
                            }
                        />
                        <SettingsItem
                            title={accountActionTitle}
                            description={accountActionDescription}
                            showChevron 
                            onPress={handleAccountPress}
                        />
                        <SettingsItem 
                            title="Cloud Backup" 
                            description={isSignedIn ? "Backup or restore preferences" : "Sign in required"} 
                            showChevron 
                            disabled={!isSignedIn}
                            onPress={() => actions.setBackup(true)}
                        />
                        <SettingsItem 
                            title="Restore Data" 
                            description={isSignedIn ? "Fetch from cloud" : "Sign in required"} 
                            showChevron 
                            disabled={!isSignedIn}
                            onPress={() => actions.setRestore(true)}
                        />
                    </SettingsSection>

                    {/* Reading Preferences Section */}
                    {false && <SettingsSection title="Reading Preferences" icon="book-open-variant">
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
                                    <TouchableOpacity style={[styles.toggleOption, { backgroundColor: themeColors.surface }]}>
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
                    </SettingsSection>}

                    {/* App Theme Section */}
                    <SettingsSection title="App Theme" icon="theme-light-dark">
                        <SettingsItem 
                            title="Theme Mode" 
                            description={userPref?.theme || "System"}
                            rightElement={
                                <View style={[styles.toggleContainer, { backgroundColor: themeColors.secondaryContainer }]}>
                                    <TouchableOpacity 
                                       onPress={() => setUserPref({...userPref, theme: ThemeOptions.System})}
                                       style={[styles.toggleOption, userPref?.theme === ThemeOptions.System && { backgroundColor: themeColors.surface }]}
                                    >
                                        <AtelierText variant="caption" bold>System</AtelierText>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                       onPress={() => setUserPref({...userPref, theme: ThemeOptions.Light})}
                                       style={[styles.toggleOption, userPref?.theme === ThemeOptions.Light && { backgroundColor: themeColors.surface }]}
                                    >
                                        <AtelierText variant="caption" bold>Light</AtelierText>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                       onPress={() => setUserPref({...userPref, theme: ThemeOptions.Dark})}
                                       style={[styles.toggleOption, userPref?.theme === ThemeOptions.Dark && { backgroundColor: themeColors.surface }]}
                                    >
                                        <AtelierText variant="caption" bold>Dark</AtelierText>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </SettingsSection>

                    {/* Search Preferences Section */}
                    {false && <UseRepositoryLayout
                        props={{
                            renderRepositories: (repos) => (
                                <SearchPreferencesSection
                                    repos={repos}
                                    setSnackbarText={setSnackbarText}
                                />
                            ),
                        }}
                    />}

                    {/* About Section */}
                    <SettingsSection title="About" icon="information-outline">
                        <SettingsItem title="Privacy Policy" icon="open-in-new" showChevron onPress={() => Linking.openURL('https://zenith-blue.web.app/privacy')} />
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
    const themeColors = useTheme().colors as any;
    
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
    statsHeader: {
        marginBottom: 20,
        gap: 6,
    },
    statsRow: {
        flexDirection: 'row',
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
