import { Content, Repo } from "@/types";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

export default function BookItem({ repo, item }: { repo: Repo, item: Content }) {
    const size = 44.0;
    const ratingLabel = item.rating ? `${item.rating} ★` : undefined;
    const coverUri = item.bookImage?.length ? item.bookImage : `https://picsum.photos/seed/${item.bookId}/200/300`;
    const subtitle = item.bookLink?.length ? item.bookLink : undefined;
    return (
        <Card
            style={styles.card}
            onPress={() => {
                router.push({
                    pathname: '/contents',
                    params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
                } as never);
            }}
        >
            <View style={styles.row}>
                <Card.Cover source={{ uri: coverUri }} style={[styles.cover, { width: size * 2, height: size * 3 }]} />
                <View style={styles.info}>
                    <Card.Title
                        title={item.title}
                        titleNumberOfLines={2}
                        subtitle={subtitle}
                        subtitleNumberOfLines={1}
                    />
                    {ratingLabel && (
                        <Text variant="labelLarge" style={styles.rating}>
                            {ratingLabel}
                        </Text>
                    )}
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        marginVertical: 4,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
    },
    cover: {
        marginRight: 12,
        borderRadius: 6,
    },
    info: {
        flex: 1,
    },
    rating: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
});