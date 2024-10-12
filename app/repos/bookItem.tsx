import { Content, Repo } from "@/types";
import { router } from "expo-router";
import { View } from "react-native";
import { Card } from "react-native-paper";

export default function BookItem({ repo, item }: { repo: Repo, item: Content }) {
    const size = 44.0;
    return (
        <Card style={styles.card} onPress={() => {
            return router.push({
                pathname: '/contents',
                params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
            });
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Card.Cover source={{ uri: item.bookImage }} style={{ width: size * 2, height: size * 3, marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                    <Card.Title title={item.title} titleNumberOfLines={2} />
                </View>
            </View>
        </Card>
    );
}

const styles = {
    card: {
        flex: 1,
        margin: 2,
    },
};