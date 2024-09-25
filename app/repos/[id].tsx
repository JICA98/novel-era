import { Appbar, Title } from "react-native-paper";
import { Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StyleSheet } from 'react-native';

export default function RepositorLayout() {
    return (
        <SafeAreaView style={styles.container}>

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