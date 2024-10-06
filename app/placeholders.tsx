import { ImageBackground, View, StyleSheet } from "react-native";
import { Title } from "react-native-paper";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 8,
    },
    emptyImage: {
        height: 130,
    }
});

export const emptyFavoritePlaceholder = (
    <View style={[styles.container, { marginTop: 150, marginHorizontal: 15 }]}>
        <ImageBackground
            source={require('../assets/images/box.png')}
            style={styles.emptyImage}
            resizeMode="contain"
        />
        <Title style={{
            textAlign: 'center', marginTop: 20, fontSize: 16
        }}>Nothing found in favorites, try refreshing or adding something to the collection</Title>
    </View>
);

export const emptyRecentsPlaceholder = (message: string) => (
    <View style={[styles.container, { marginTop: 100, marginHorizontal: 20 }]}>
        <ImageBackground
            source={require('../assets/images/inbox.png')}
            style={styles.emptyImage}
            resizeMode="contain"
        />
        <Title style={{ textAlign: 'center', marginTop: 20, fontSize: 16 }}>{message}</Title>
    </View>
);