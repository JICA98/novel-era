import React, { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { backupPreferences, restorePreferences } from '../lib/supabase'
import { Button, List, TextInput, Title, useTheme } from 'react-native-paper'
import { ChapterTracker, chapterTrackerStore, getAllTrackersAsync, getFavoriteTrackersAsync, noveFavoriteStore, NovelTracker } from '../favorites/tracker'
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


export default function Auth({ setSnackbarText }: { setSnackbarText: (text: string) => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(true);
    const { colors } = useTheme();
    const handlePress = () => setExpanded(!expanded);
    const authUser: AuthUser = authStateStore((state: any) => state.content);
    const userPref: UserPreferences = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const [showBackup, setBackup] = useState(false);
    const [showRestore, setRestore] = useState(false);
    const [showSignOut, setSignOut] = useState(false);
    const allTrackers = chapterTrackerStore((state: any) => state.content);
    const setAllTrackers = chapterTrackerStore((state: any) => state.setContent);
    const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);
    const setAllNovelTracker = noveFavoriteStore((state: any) => state.setContent);

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

    function signInSignUpPage() {
        return (<>
            <View style={styles.container}>
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
            </View>
        </>);
    }

    function accountInfoPage() {
        return (<>
            <View style={styles.container}>
                <View style={[styles.verticallySpaced]}>
                    <Title style={{ color: colors.primary }}>Signed in with</Title>
                    <View style={{ marginTop: 10 }}></View>
                    <TextInput
                        label="Email"
                        mode="outlined"
                        value={authUser.email ?? '?'}
                        editable={false}
                    />
                    <View style={styles.mt20}></View>
                    <Button
                        mode="contained"
                        onPress={() => {
                            setSignOut(true);
                        }}
                    >
                        Sign out
                    </Button>
                    <View style={styles.mt20}></View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Button
                            mode="contained-tonal"
                            onPress={() => {
                                setBackup(true);
                            }}
                        >
                            Backup Preferences
                        </Button>
                        <Button
                            mode="contained-tonal"
                            onPress={() => {
                                setRestore(true);
                            }}
                        >
                            Restore Preferences
                        </Button>
                    </View>
                </View>
            </View>
        </>);
    }

    return (
        <>
            {showSignOut && <PaperDialog title={'Sign out'}
                description='This will sign you out of your account, continue?' setVisible={setSignOut}
                done={async () => {
                    try {
                        await signOutUser();
                        setSnackbarText('Signed out successfully');
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : 'Unable to sign out';
                        setSnackbarText(message);
                    }
                }}
            />}
            {showBackup && <PaperDialog title={'Backup Preferences'}
                description='This will backup all preferences to the cloud, continue?' setVisible={setBackup}
                done={async () => {
                    const chapterPreferences = await getAllTrackersAsync();
                    const favPreferences = await getFavoriteTrackersAsync();
                    backupPreferences({
                        userId: authUser.authId ?? '',
                        userPref,
                        chapterPreferences,
                        favPreferences,
                    })
                }}
            />}
            {showRestore && <PaperDialog title={'Restore Preferences'}
                description='This will restore all preferences from the cloud, continue?' setVisible={setRestore}
                done={async () => {
                    const chapterPreferences = await getAllTrackersAsync();
                    const favPreferences = await getFavoriteTrackersAsync();
                    restorePreferences({
                        userId: authUser.authId ?? '',
                        userPref,
                        chapterPreferences,
                        favPreferences,
                        setUserPref,
                        setAllTrackers,
                        setAllNovelTracker,
                    })
                }}
            />}


            <List.Accordion
                title="Account Settings"
                left={(props) => <List.Icon {...props} icon="account" />}
                expanded={expanded}
                onPress={handlePress}
                titleStyle={{ color: colors.primary }}
            >

                {authUser.state === AuthState.SIGNED_OUT && signInSignUpPage()}
                {authUser.state === AuthState.SIGNED_IN && accountInfoPage()}


            </List.Accordion>
        </>

    )
}

const styles = StyleSheet.create({
    container: {
        paddingInline: 12,
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