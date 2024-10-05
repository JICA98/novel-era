import { Content, Repo } from "@/types";
import { router } from "expo-router";
import { View } from "react-native";
import { Card } from "react-native-paper";

export default function BookItem({ repo, item }: { repo: Repo, item: Content }) {
    return (
        <Card style={styles.card} onPress={() => {
            return router.push({
                pathname: '/contents',
                params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
            });
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Card.Cover source={{ uri: item.bookImage }} style={{ width: 100, height: 100, marginRight: 8 }} />
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