import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { getUserPreference, userPrefStore } from "../storage";
import { ThemeSelectionAccordion } from "./themeSettings";


export default function Settings() {
    const userPref = userPrefStore((state: any) => state.userPref);
    const setUserPref = userPrefStore((state: any) => state.setUserPref);

    useEffect(() => {
        async function fetchUserPreferences() {
            const preferences = await getUserPreference();
            setUserPref(preferences);
        }
        fetchUserPreferences();
    }, []);

    return (
        <View style={[styles.container]}>
            {userPref && (<ThemeSelectionAccordion userPref={userPref} setUserPref={setUserPref} />)}
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