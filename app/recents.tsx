import { RefreshControl, SafeAreaView, View, Text, FlatList, TouchableOpacity, useColorScheme, StyleSheet, ScrollView, LayoutAnimation } from "react-native";
import { normalizeUrl } from "@/types";
import { ChapterTracker, getAllTrackersAsync, saveTracker } from "./favorites/tracker";
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { timeAgo, RenderChapterProps } from "./chapters/common";
import { router } from "expo-router";
import Modal from "./components/modal";
import { AtelierText } from "@/components/AtelierText";
import { BookListItem } from "@/components/BookListItem";
import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const PAGE_SIZE = 20;

enum FilterOption {
    ALL = 'all',
    READ = 'read',
    READING = 'reading',
}

export default function Recents() {
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterOption>(FilterOption.ALL);
    const [refreshing, setRefreshing] = useState(false);
    const [trackers, setTrackers] = useState<ChapterTracker[] | null>(null);
    const [pagination, setPagination] = useState(1);
    const [showDelete, setShowDelete] = useState(false);
    
    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];

    async function fetchTrackers() {
        if (!refreshing) setLoading(true);
        const trackerMap = await getAllTrackersAsync();
        
        const recentTrackers = Object.values(trackerMap)
            ?.filter((tracker) => !tracker.hideHistory && (tracker.status === 'reading' || tracker.status === 'read'))
            ?.sort((a, b) => b.lastRead - a.lastRead);

        setTrackers(recentTrackers);
        setLoading(false);
        setRefreshing(false);
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTrackers();
    }, []);

    useEffect(() => {
        fetchTrackers();
    }, []);

    const filteredTrackers = useMemo(() => {
        if (!trackers) return [];
        let filtered = [...trackers];
        if (filter !== FilterOption.ALL) {
            filtered = filtered.filter(t => t.status === filter);
        }
        return filtered.slice(0, pagination * PAGE_SIZE);
    }, [trackers, filter, pagination]);

    const handleLoadMore = () => {
        if (trackers && filteredTrackers.length < trackers.length) {
            setPagination(prev => prev + 1);
        }
    };

    async function handleDeleteAll() {
        if (!trackers?.length) return;
        setLoading(true);
        for (const tracker of trackers) {
            tracker.hideHistory = true;
            await saveTracker(tracker);
        }
        await fetchTrackers();
    }

    async function deleteItem(chapter: ChapterTracker) {
        chapter.hideHistory = true;
        await saveTracker(chapter);
        fetchTrackers();
    }

    const renderItem = ({ item, index }: { item: ChapterTracker, index: number }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50)}
                exiting={FadeOut}
                layout={LinearTransition.duration(300)}
            >
                <BookListItem
                    item={item.novel}
                    repo={item.repo}
                    status={item.status === 'reading' ? 'Reading' : 'Completed'}
                    lastChapterRead={item.chapterId}
                    lastReadTimestamp={item.lastRead}
                    onPress={() => {
                        const chapterProps: RenderChapterProps = {
                            focusedMode: false, 
                            id: item.chapterId, 
                            content: item.novel, 
                            repo: item.repo,
                            enableNextPrev: true, 
                            speachState: 'unknown',
                            data: ''
                        };
                        router.push({
                            pathname: '/chapters' as any,
                            params: { props: JSON.stringify(chapterProps) }
                        });
                    }}
                    renderRightAction={() => (
                        <TouchableOpacity 
                            onPress={() => deleteItem(item)}
                            style={styles.deleteAction}
                        >
                            <MaterialCommunityIcons name="close-circle-outline" size={24} color={themeColors.onSurfaceVariant} />
                        </TouchableOpacity>
                    )}
                />
            </Animated.View>
        );
    };

    const EmptyState = () => (
        <Animated.View 
            entering={FadeInDown.duration(600)}
            style={styles.emptyContainer}
        >
            <View style={styles.illustrationContainer}>
                <LinearGradient
                    colors={[themeColors.secondaryContainer + '33', 'transparent']}
                    style={styles.glow}
                />
                <MaterialCommunityIcons name="history" size={120} color={themeColors.secondaryContainer} />
            </View>
            <AtelierText variant="title" bold style={styles.emptyTitle}>
                No reading history found.
            </AtelierText>
            <AtelierText variant="body" color={themeColors.onSurfaceVariant} style={styles.emptyDescription}>
                Books you read will appear here. Start your journey!
            </AtelierText>
        </Animated.View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <AtelierText variant="body">Gathering your history...</AtelierText>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Space at the top to match Library */}
            <View style={{ height: 24 }} />
            
            <Modal 
                onResult={(result) => { setShowDelete(false); result && handleDeleteAll(); }} 
                visible={showDelete}
                content={
                    <View style={{ padding: 16 }}>
                        <AtelierText variant="body" bold style={{ marginBottom: 8 }}>Clear all history?</AtelierText>
                        <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>This will hide all your recent reading history. This action cannot be undone.</AtelierText>
                    </View>
                }
            />

            <FlatList
                data={filteredTrackers}
                renderItem={renderItem}
                keyExtractor={(item) => `${item.repo.id}-${item.novel.bookId}-${item.chapterId}`}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
                }
                ListHeaderComponent={() => (
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <AtelierText variant="headline" bold style={styles.title}>Recents</AtelierText>
                            {(trackers && trackers.length > 0) && (
                                <TouchableOpacity 
                                    style={[styles.clearAllButton, { backgroundColor: themeColors.surfaceContainerLow }]}
                                    onPress={() => setShowDelete(true)}
                                >
                                    <MaterialIcons name="delete-sweep" size={20} color={themeColors.onSurfaceVariant} />
                                    <AtelierText variant="caption" bold color={themeColors.onSurfaceVariant}>Clear All</AtelierText>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <AtelierText variant="body" color={themeColors.onSurfaceVariant} style={styles.subtitle}>
                            Pick up where you left off.
                        </AtelierText>

                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterTabs}
                        >
                            {[
                                { id: FilterOption.ALL, label: 'All History' },
                                { id: FilterOption.READING, label: 'Currently Reading' },
                                { id: FilterOption.READ, label: 'Finished' },
                            ].map((opt) => {
                                const isActive = filter === opt.id;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setFilter(opt.id);
                                        }}
                                        style={[
                                            styles.filterTab,
                                            isActive ? 
                                                [styles.filterTabActive, { backgroundColor: themeColors.primary }] : 
                                                [styles.filterTabInactive, { backgroundColor: themeColors.secondaryContainer }]
                                        ]}
                                    >
                                        <AtelierText 
                                            variant="caption" 
                                            bold 
                                            color={isActive ? themeColors.onPrimary : themeColors.onSecondaryContainer}
                                        >
                                            {opt.label}
                                        </AtelierText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
                ListEmptyComponent={EmptyState}
                contentContainerStyle={styles.scrollContent}
                ListFooterComponent={<View style={{ height: 100 }} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
    },
    subtitle: {
        marginTop: 4,
        marginBottom: 20,
    },
    clearAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterTabs: {
        gap: 12,
        paddingBottom: 16,
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
    },
    filterTabActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    filterTabInactive: {
        opacity: 0.8,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    deleteAction: {
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    illustrationContainer: {
        width: 200,
        height: 200,
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: '150%',
        height: '150%',
        borderRadius: 999,
    },
    emptyTitle: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 260,
    },
});