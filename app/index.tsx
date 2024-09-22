import React from "react";
import { Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedFAB, Appbar, FAB, Title } from "react-native-paper";
import { StyleSheet } from 'react-native';
import { Stack } from "expo-router";
import MyBottom from "./bottom";

export default function Index() {
    const [isExtended, setIsExtended] = React.useState(true);

    const isIOS = Platform.OS === 'ios';

    const onScroll = ({ nativeEvent }: { nativeEvent: any }) => {
        const currentScrollPosition =
            Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

        setIsExtended(currentScrollPosition <= 0);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Novel Era" />
            </Appbar.Header>
            <MyBottom />
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => console.log('Pressed')}
            />
        </SafeAreaView>
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