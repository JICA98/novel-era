import React, { useState } from 'react'
import { Alert, StyleSheet, View, AppState } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, List, TextInput, useTheme } from 'react-native-paper'
import { UserPreferences } from '../userpref'

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})



export default function Auth({ setSnackbarText }: { setSnackbarText: (text: string) => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(true);
    const { colors } = useTheme();
    const handlePress = () => setExpanded(!expanded);

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

    async function signInWithEmail() {
        if (!prevalidation()) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error) setSnackbarText(error.message);
        setLoading(false)
    }

    async function signUpWithEmail() {
        if (!prevalidation()) return;
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (error) setSnackbarText(error.message);
        if (!session) Alert.alert('Please check your inbox for email verification!')
        setLoading(false)
    }

    return (
        <List.Accordion
            title="Account Settings"
            left={(props) => <List.Icon {...props} icon="account" />}
            expanded={expanded}
            onPress={handlePress}
            titleStyle={{ color: colors.primary }}
        >

            <View style={styles.container}>
                <View style={[styles.verticallySpaced, styles.mt20]}>
                    <TextInput
                        label="Email"
                        mode="outlined"
                        onChangeText={(text) => setEmail(text)}
                        value={email}
                        placeholder="email@address.com"
                        autoCapitalize="none"
                        style={{ backgroundColor: 'white' }}
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
                        style={{ backgroundColor: 'white' }}
                    />
                </View>
                <View style={[styles.verticallySpaced, styles.mt20]}>
                    <Button
                        mode="contained"
                        loading={loading}
                        onPress={() => signInWithEmail()}
                    >
                        Sign in
                    </Button>
                </View>
                <View style={styles.verticallySpaced}>
                    <Button mode="contained" disabled={loading} onPress={() => signUpWithEmail()} >
                        Sign up
                    </Button>
                </View>
            </View>
        </List.Accordion>
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