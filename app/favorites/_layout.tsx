import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getFavoriteTrackersAsync, NovelTracker, noveFavoriteStore } from '../../lib/favorites/tracker';
import BookItem from '../repos/bookItem';
import { emptyFavoritePlaceholder } from '../placeholders';

const FavoriteScreen = () => {
    const [favoriteTrackers, setFavoriteTrackers] = useState<NovelTracker[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    
    // Get the store content directly - this will automatically trigger re-renders when the store updates
    const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);

    const fetchFavoriteTrackers = useCallback(async () => {
        setRefreshing(true);
        try {
            const trackers = await getFavoriteTrackersAsync();
            console.log('Raw favorite trackers:', Object.keys(trackers).length, 'items');
            const extractedTrackers = extractTrackers(trackers);
            console.log('Filtered favorite trackers:', extractedTrackers.length, 'items');
            setFavoriteTrackers(extractedTrackers);
        } catch (error) {
            console.error('Error fetching favorite trackers:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Update from store when it changes
    const updateFromStore = useCallback(() => {
        if (allNovelTrackerStore && allNovelTrackerStore.size > 0) {
            const trackers = extractTrackersFromStore(allNovelTrackerStore);
            console.log('Store favorite trackers:', trackers.length, 'items');
            setFavoriteTrackers(prevTrackers => {
                // Only update if there's a real change to prevent unnecessary re-renders
                if (JSON.stringify(prevTrackers) !== JSON.stringify(trackers)) {
                    return trackers;
                }
                return prevTrackers;
            });
        }
    }, [allNovelTrackerStore]);

    // Initial load
    useEffect(() => {
        fetchFavoriteTrackers();
    }, [fetchFavoriteTrackers]);

    // Update when the store changes
    useEffect(() => {
        updateFromStore();
    }, [updateFromStore]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchFavoriteTrackers();
        }, [fetchFavoriteTrackers])
    );

    const renderItem = useCallback(({ item }: { item: NovelTracker }) => (
        <BookItem item={item.novel} repo={item.repo} />
    ), []);

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

export default React.memo(FavoriteScreen);

function extractTrackers(t: Record<string, NovelTracker>): NovelTracker[] {
    const trackers = Object.values(t);
    return trackers.filter((tracker) => tracker.favorite)
        .sort((a, b) => b.updated - a.updated);
}

function extractTrackersFromStore(storeMap: Map<string, any>): NovelTracker[] {
    const trackers: NovelTracker[] = [];
    storeMap.forEach((store) => {
        const state = store.getState();
        const content = state?.content;
        if (content && content.favorite) {
            trackers.push(content);
        }
    });
    return trackers.sort((a, b) => b.updated - a.updated);
}
