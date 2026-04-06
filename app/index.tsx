import React from "react";
import { Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedFAB, Appbar, Avatar, FAB, Icon, Title } from "react-native-paper";
import { StyleSheet } from 'react-native';
import { Stack } from "expo-router";
import MyBottom, { indexes, useBottomIndexStore } from "./bottom";

export default function Index() {
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