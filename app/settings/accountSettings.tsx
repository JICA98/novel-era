import React, { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { backupPreferences, restorePreferences, fetchBackupPreview, type BackupPreviewData } from '../lib/firebaseBackup'
import { ActivityIndicator, Button, Divider, List, Text, TextInput, Title, useTheme } from 'react-native-paper'
import { ChapterTracker, NovelTracker, chapterTrackerStore, getAllTrackersAsync, getFavoriteTrackersAsync, noveFavoriteStore } from '../favorites/tracker'
import { UserPreferences, userPrefStore } from '../userpref'
import PaperDialog from '../components/dialog'
import {
    AuthState,
    AuthUser,
    authStateStore,
    signInWithEmail,
    signInWithGoogle,
    signOutUser,
    signUpWithEmail,
} from '../lib/auth'

export function useAccountSettings(setSnackbarText: (text: string) => void) {
    const authUser: AuthUser = authStateStore((state: any) => state.content);
    const userPref: UserPreferences = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const setAllTrackers = chapterTrackerStore((state: any) => state.setContent);
    const setAllNovelTracker = noveFavoriteStore((state: any) => state.setContent);
    const allTrackers = chapterTrackerStore((state: any) => state.content);
    const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);

    const [showBackup, setBackup] = useState(false);
    const [showRestore, setRestore] = useState(false);
    const [showSignOut, setSignOut] = useState(false);
    
    const [restorePreviewSummary, setRestorePreviewSummary] = useState<BackupSummaryData | undefined>();
    const [restorePreviewLoading, setRestorePreviewLoading] = useState(false);
    const [restorePreviewError, setRestorePreviewError] = useState<string | null>(null);

    const localBackupSummary = buildSummaryFromLocal(userPref, allTrackers, allNovelTrackerStore);

    useEffect(() => {
        if (!showRestore) {
            setRestorePreviewSummary(undefined);
            setRestorePreviewError(null);
            setRestorePreviewLoading(false);
            return;
        }

        if (!authUser.authId) {
            setRestorePreviewError('Sign in to restore preferences');
            setRestorePreviewSummary(undefined);
            setRestorePreviewLoading(false);
            return;
        }

        let cancelled = false;
        setRestorePreviewLoading(true);
        setRestorePreviewError(null);
        setRestorePreviewSummary(undefined);

        fetchBackupPreview(authUser.authId)
            .then((result) => {
                if (cancelled) return;
                if (result?.missing) {
                    setRestorePreviewError('No backup found for this account');
                    setRestorePreviewSummary(undefined);
                    return;
                }
                if (result?.error) {
                    setRestorePreviewError('Unable to load cloud backup preview');
                    setRestorePreviewSummary(undefined);
                    return;
                }
                if (result?.data) {
                    setRestorePreviewSummary(buildSummaryFromPreview(result.data));
                }
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Failed to load backup preview:', error);
                setRestorePreviewError('Unable to load cloud backup preview');
                setRestorePreviewSummary(undefined);
            })
            .finally(() => {
                if (!cancelled) {
                    setRestorePreviewLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [showRestore, authUser.authId]);

    const handleBackup = async () => {
        if (!authUser.authId) {
            setSnackbarText('Sign in to enable cloud backup');
            return;
        }
        const chapterPreferences = await getAllTrackersAsync();
        const favPreferences = await getFavoriteTrackersAsync();
        const result = await backupPreferences({
            userId: authUser.authId ?? '',
            userPref,
            chapterPreferences,
            favPreferences,
        });

        if (result?.error) {
            setSnackbarText('Failed to back up preferences');
        } else {
            setSnackbarText('Preferences backed up successfully');
            setBackup(false);
        }
    };

    const handleRestore = async () => {
        if (!authUser.authId) {
            setSnackbarText('Sign in to restore from cloud backup');
            return;
        }
        if (restorePreviewLoading) {
            setSnackbarText('Still loading cloud backup preview. Please wait a moment.');
            return;
        }
        if (restorePreviewError) {
            setSnackbarText(restorePreviewError);
            return;
        }
        const chapterPreferences = await getAllTrackersAsync();
        const favPreferences = await getFavoriteTrackersAsync();
        const result = await restorePreferences({
            userId: authUser.authId ?? '',
            userPref,
            chapterPreferences,
            favPreferences,
            setUserPref,
            setAllTrackers,
            setAllNovelTracker,
        });

        if (result?.restored) {
            setSnackbarText('Preferences restored from backup');
            setRestore(false);
        } else if (result?.missing) {
            setSnackbarText('No backup found for this account');
        } else if (result?.error) {
            setSnackbarText('Failed to restore preferences');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOutUser();
            setSnackbarText('Signed out successfully');
            setSignOut(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unable to sign out';
            setSnackbarText(message);
        }
    };

    return {
        authUser,
        showBackup, setBackup,
        showRestore, setRestore,
        showSignOut, setSignOut,
        localBackupSummary,
        restorePreviewSummary,
        restorePreviewLoading,
        restorePreviewError,
        handleBackup,
        handleRestore,
        handleSignOut,
    };
}

export function AuthDialogs({ 
    actions, 
    setSnackbarText 
}: { 
    actions: ReturnType<typeof useAccountSettings>, 
    setSnackbarText: (text: string) => void 
}) {
    return (
        <>
            {actions.showSignOut && (
                <PaperDialog 
                    title={'Sign out'}
                    description='This will sign you out of your account, continue?' 
                    setVisible={actions.setSignOut}
                    done={actions.handleSignOut}
                />
            )}
            {actions.showBackup && (
                <PaperDialog
                    title={'Backup Preferences'}
                    description='This will overwrite your existing cloud backup with current preferences. Continue?'
                    details={<BackupSummary summary={actions.localBackupSummary} />}
                    setVisible={actions.setBackup}
                    done={actions.handleBackup}
                />
            )}
            {actions.showRestore && (
                <PaperDialog
                    title={'Restore Preferences'}
                    description='This will overwrite your local preferences with the cloud backup. Continue?'
                    details={
                        <BackupSummary
                            summary={actions.restorePreviewSummary}
                            loading={actions.restorePreviewLoading}
                            error={actions.restorePreviewError}
                        />
                    }
                    setVisible={actions.setRestore}
                    done={actions.handleRestore}
                />
            )}
        </>
    );
}

export default function Auth({ setSnackbarText }: { setSnackbarText: (text: string) => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(true);
    const { colors } = useTheme();
    const handlePress = () => setExpanded(!expanded);
    
    const actions = useAccountSettings(setSnackbarText);
    const { authUser } = actions;
    const isSignedIn = authUser.state === AuthState.SIGNED_IN;
    const authStatusLabel = isSignedIn ? `Signed in with ${authUser.provider ?? 'account'}` : 'Signed out';
    const backupActionsDisabled = !isSignedIn;

    function prevalidation(): boolean {
        if (!email || !password) {
            setSnackbarText('Please enter your email and password')
            return false;
        }
        if (password.length < 8) {
            setSnackbarText('Password must be at least 8 characters')
            return false;
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setSnackbarText('Please enter a valid email address')
            return false;
        }
        if (loading) return false;
        return true;
    }

    async function handleEmailSignIn() {
        if (!prevalidation()) return;
        setLoading(true);
        try {
            await signInWithEmail(email, password);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unable to sign in';
            setSnackbarText(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleEmailSignUp() {
        if (!prevalidation()) return;
        setLoading(true);
        try {
            await signUpWithEmail(email, password);
            Alert.alert('Account created', 'Please verify your email before signing in.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unable to create account';
            setSnackbarText(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unable to sign in with Google';
            setSnackbarText(message);
        } finally {
            setLoading(false);
        }
    }

    function signInOptions() {
        return (
            <>
                <View style={[styles.verticallySpaced, styles.mt20]}>
                    <TextInput
                        label="Email"
                        mode="outlined"
                        onChangeText={(text) => setEmail(text)}
                        value={email}
                        placeholder="email@address.com"
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.verticallySpaced}>
                    <TextInput
                        label="Password"
                        mode="outlined"
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        secureTextEntry={true}
                        placeholder="Password"
                        autoCapitalize="none"
                    />
                </View>
                <View style={[styles.verticallySpaced, styles.mt20]}>
                    <Button
                        mode="contained"
                        loading={loading}
                        onPress={() => handleEmailSignIn()}
                    >
                        Sign in
                    </Button>
                </View>
                <View style={styles.verticallySpaced}>
                    <Button mode="contained" disabled={loading} onPress={() => handleEmailSignUp()} >
                        Sign up
                    </Button>
                </View>
                <View style={styles.verticallySpaced}>
                    <Button mode="outlined" disabled={loading} onPress={() => handleGoogleSignIn()}>
                        Sign in with Google
                    </Button>
                </View>
            </>
        );
    }

    function cloudBackupActions() {
        return (
            <>
                <Divider style={styles.sectionDivider} />
                <Title style={{ color: colors.primary }}>Cloud Backup</Title>
                <Text style={styles.helperText}>
                    {isSignedIn
                        ? 'Cloud backup and restore are enabled for your signed-in account.'
                        : 'Sign in with Google or email to enable cloud backup and restore.'}
                </Text>
                <View style={styles.mt20}></View>
                <View style={styles.actionRow}>
                    <Button
                        mode="contained-tonal"
                        disabled={backupActionsDisabled}
                        onPress={() => {
                            actions.setBackup(true);
                        }}
                    >
                        Backup Preferences
                    </Button>
                    <Button
                        mode="contained-tonal"
                        disabled={backupActionsDisabled}
                        onPress={() => {
                            actions.setRestore(true);
                        }}
                    >
                        Restore Preferences
                    </Button>
                </View>
            </>
        );
    }

    return (
        <>
            <AuthDialogs actions={actions} setSnackbarText={setSnackbarText} />
            <List.Accordion
                title="Account Settings"
                left={(props) => <List.Icon {...props} icon="account" />}
                expanded={expanded}
                onPress={handlePress}
                titleStyle={{ color: colors.primary }}
            >
                <View style={styles.container}>
                    <Title style={{ color: colors.primary }}>Account Status</Title>
                    <View style={styles.mt20}></View>
                    <TextInput
                        label="Status"
                        mode="outlined"
                        value={authStatusLabel}
                        editable={false}
                    />
                    <View style={styles.verticallySpaced}>
                        <TextInput
                            label="Email"
                            mode="outlined"
                            value={authUser.email || 'Not signed in'}
                            editable={false}
                        />
                    </View>
                    {isSignedIn ? (
                        <View style={styles.verticallySpaced}>
                            <Button
                                mode="contained"
                                onPress={() => {
                                    actions.setSignOut(true);
                                }}
                            >
                                Sign out
                            </Button>
                        </View>
                    ) : (
                        signInOptions()
                    )}
                    {cloudBackupActions()}
                </View>
            </List.Accordion>
        </>
    )
}

type BackupSummaryProps = {
    summary?: BackupSummaryData;
    loading?: boolean;
    error?: string | null;
};

function BackupSummary({ summary, loading, error }: BackupSummaryProps) {
    if (loading) {
        return (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator animating size="small" />
                <Text style={{ marginTop: 8 }}>Fetching latest backup...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ paddingVertical: 12 }}>
                <Text>{error}</Text>
            </View>
        );
    }

    const fallbackSummary: BackupSummaryData = summary ?? {
        hasPreferences: false,
        chapterCount: 0,
        favoriteCount: 0,
        chapterTitles: [],
        favoriteTitles: [],
    };

    const { hasPreferences, chapterCount, favoriteCount, chapterTitles, favoriteTitles } = fallbackSummary;

    const chapterPreview = formatTitlePreview(chapterTitles);
    const favoritePreview = formatTitlePreview(favoriteTitles);

    return (
        <List.Section style={{ marginTop: 12 }}>
            <List.Item
                title="Editor preferences"
                description={hasPreferences ? 'Theme, reader, and voice settings' : 'No preferences saved'}
                left={(props) => <List.Icon {...props} icon="tune" />}
            />
            <Divider />
            <List.Item
                title={`${chapterCount} chapter${chapterCount === 1 ? '' : 's'}`}
                description={chapterCount > 0 ? chapterPreview : 'No chapters tracked'}
                left={(props) => <List.Icon {...props} icon="book-open-variant" />}
            />
            <Divider />
            <List.Item
                title={`${favoriteCount} favorite${favoriteCount === 1 ? '' : 's'}`}
                description={favoriteCount > 0 ? favoritePreview : 'No favorites saved'}
                left={(props) => <List.Icon {...props} icon="star" />}
            />
        </List.Section>
    );
}

type BackupSummaryData = {
    hasPreferences: boolean;
    chapterCount: number;
    favoriteCount: number;
    chapterTitles: string[];
    favoriteTitles: string[];
};

function buildSummaryFromLocal(
    userPref: UserPreferences,
    chapterStore: Map<string, any> | Record<string, any> | undefined,
    favoriteStore: Map<string, any> | Record<string, any> | undefined,
): BackupSummaryData {
    const chapterTrackers = collectTrackerContent(chapterStore)
        .filter((item: ChapterTracker | undefined): item is ChapterTracker => Boolean(item));

    const favoriteTrackers = collectTrackerContent(favoriteStore)
        .filter((item: NovelTracker | undefined): item is NovelTracker => Boolean(item));

    const chapterTitles = new Set<string>();
    chapterTrackers.forEach((tracker) => {
        if (tracker?.novel?.title) {
            chapterTitles.add(tracker.novel.title);
        }
    });

    const favoriteTitles = new Set<string>();
    favoriteTrackers.forEach((tracker) => {
        if (tracker?.novel?.title) {
            favoriteTitles.add(tracker.novel.title);
        }
    });

    return {
        hasPreferences: userPref ? Object.keys(userPref ?? {}).length > 0 : false,
        chapterCount: chapterTrackers.length,
        favoriteCount: favoriteTrackers.length,
        chapterTitles: Array.from(chapterTitles),
        favoriteTitles: Array.from(favoriteTitles),
    };
}

function buildSummaryFromPreview(preview: BackupPreviewData): BackupSummaryData {
    const chapterEntries = Object.values(preview.chapters ?? {});
    const favoriteEntries = Object.values(preview.favorites ?? {});
    const chapterTitleSet = new Set<string>();
    const favoriteTitleSet = new Set<string>();

    const resolveTitle = (tracker: any) => {
        if (tracker?.novel?.title) {
            return tracker.novel.title;
        }
        if (tracker?.novelId && tracker?.repoId) {
            const reference = preview.novelIndex?.[`${tracker.repoId}::${tracker.novelId}`];
            return reference?.novel?.title ?? String(tracker.novelId);
        }
        return undefined;
    };

    chapterEntries.forEach((tracker) => {
        const title = resolveTitle(tracker);
        if (title) {
            chapterTitleSet.add(title);
        }
    });

    favoriteEntries.forEach((tracker) => {
        const title = resolveTitle(tracker);
        if (title) {
            favoriteTitleSet.add(title);
        }
    });

    return {
        hasPreferences: Boolean(preview.userPref),
        chapterCount: chapterEntries.length,
        favoriteCount: favoriteEntries.length,
        chapterTitles: Array.from(chapterTitleSet),
        favoriteTitles: Array.from(favoriteTitleSet),
    };
}

function formatTitlePreview(titles: string[]): string {
    if (!titles.length) {
        return '';
    }
    const preview = titles.slice(0, 3).join(', ');
    return preview + (titles.length > 3 ? '...' : '');
}

function collectTrackerContent(storeCollection: Map<string, any> | Record<string, any> | undefined | null): any[] {
    if (!storeCollection) {
        return [];
    }

    const entries: any[] = [];

    if (storeCollection instanceof Map) {
        entries.push(...Array.from(storeCollection.values()));
    } else if (typeof storeCollection === 'object') {
        entries.push(...Object.values(storeCollection));
    }

    return entries
        .map((entry) => {
            if (!entry) {
                return undefined;
            }

            const getState = (entry as any)?.getState;
            if (typeof getState === 'function') {
                try {
                    const state = getState();
                    if (state && typeof state === 'object') {
                        return state.content ?? state;
                    }
                    return state;
                } catch (error) {
                    console.warn('Unable to read tracker state for summary', error);
                    return undefined;
                }
            }

            const content = (entry as any)?.content;
            return content !== undefined ? content : entry;
        })
        .filter((value) => value !== undefined);
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    helperText: {
        marginTop: 6,
    },
    sectionDivider: {
        marginTop: 20,
        marginBottom: 20,
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    mt20: {
        marginTop: 20,
    },
})
