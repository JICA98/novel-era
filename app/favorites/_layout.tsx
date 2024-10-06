import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { getFavoriteTrackersAsync, NovelTracker } from './tracker'; // Adjust the import path as needed
import BookItem from '../repos/bookItem';
import { emptyFavoritePlaceholder } from '../placeholders';

const FavoriteScreen = () => {
    const [favoriteTrackers, setFavoriteTrackers] = useState<NovelTracker[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchFavoriteTrackers();
    }, []);

    const fetchFavoriteTrackers = async () => {
        setRefreshing(true);
        const trackers = await getFavoriteTrackersAsync();
        setFavoriteTrackers(extractTrackers(trackers));
        setRefreshing(false);
    };

    const renderItem = ({ item }: { item: NovelTracker }) => (
        <BookItem item={item.novel} repo={item.repo} />
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={favoriteTrackers}
                renderItem={renderItem}
                keyExtractor={(item) => item.novel.bookId}
                ListEmptyComponent={emptyFavoritePlaceholder}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchFavoriteTrackers} />
                }
                contentContainerStyle={styles.grid}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 8,
    },
    grid: {
        justifyContent: 'space-between',
    },
    card: {
        margin: 8,
    },
    cardImage: {
        height: 150,
    },
});

export default FavoriteScreen;

function extractTrackers(t: Record<string, NovelTracker>): NovelTracker[] {
    const trackers = Object.values(t);
    return trackers.filter((tracker) => tracker.favorite)
        .sort((a, b) => b.updated - a.updated);
}
