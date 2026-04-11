import React from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedFAB, Appbar, Avatar, FAB, Icon, Title } from "react-native-paper";
import { StyleSheet } from 'react-native';
import { Stack, Redirect } from "expo-router";
import MyBottom from "./bottom";
import { userPrefStore } from "./userpref";

export default function Index() {
    const userPref = userPrefStore((state: any) => state.userPref);
    
    if (userPref && !userPref.hasSeenOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    return (
        <View style={styles.container}>
            <MyBottom />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});