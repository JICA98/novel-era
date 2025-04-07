import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ThemeSelectionAccordion } from "./themeSettings";
import { userPrefStore, getUserPreference } from "../userpref";
import Auth from "./accountSettings";
import { List, Snackbar } from "react-native-paper";


export default function Settings() {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);
    const [snackbarText, setSnackbarText] = useState('');
    useEffect(() => {
        async function fetchUserPreferences() {
            const preferences = await getUserPreference();
            setUserPref(preferences);
        }
        fetchUserPreferences();
    }, []);

    return (
        <View style={[styles.container]}>
            <View style={[styles.container]}>
                <List.Section>
                    <Auth setSnackbarText={setSnackbarText} />
                    {userPref && (<ThemeSelectionAccordion
                        userPref={userPref}
                        setUserPref={setUserPref}
                        setSnackbarText={setSnackbarText}
                    />)}
                </List.Section>
            </View>
            <Snackbar
                visible={!!snackbarText.length}
                onDismiss={() => setSnackbarText('')}
                action={{
                    label: 'Dismiss',
                    onPress: () => setSnackbarText(''),
                }} children={snackbarText}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
    },
    text: {
        fontSize: 20,
    },
});