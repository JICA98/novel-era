import React from "react";
import { Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AnimatedFAB, Appbar, Avatar, FAB, Icon, Title } from "react-native-paper";
import { StyleSheet } from 'react-native';
import { Stack } from "expo-router";
import MyBottom, { indexes, useBottomIndexStore } from "./bottom";

export default function Index() {
    const index = useBottomIndexStore((state: any) => state.index);
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
                <Appbar.Content title={<View style={{ flexDirection: 'row', }}>
                    <Avatar.Image size={32}
                        source={require('../assets/images/icon.png')} />
                    <Title style={{ marginHorizontal: 10 }}>Novel Era</Title>
                </View>} />
            </Appbar.Header>
            <MyBottom />
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