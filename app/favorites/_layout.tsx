import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Image, TouchableOpacity, Dimensions, ScrollView, Modal, Pressable, LayoutAnimation, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { getFavoriteTrackersAsync, NovelTracker, NovelReadingStatus, getNovelReadingStatus, getAllTrackersAsync, ChapterTracker } from './tracker';
import { fetchContentChapters } from '../contents/_layout';
import BookItem from '../repos/bookItem';
import { BookListItem } from '@/components/BookListItem';
import { AtelierText } from '@/components/AtelierText';
import { AtelierButton } from '@/components/AtelierButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { normalizeUrl } from '@/types';
import { RenderChapterProps } from '../chapters/common';

const { width } = Dimensions.get('window');

interface EnrichedTracker {
    novelTracker: NovelTracker;
    readingStatus: NovelReadingStatus;
}

const FavoriteScreen = () => {
    const [enrichedTrackers, setEnrichedTrackers] = useState<EnrichedTracker[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('Updated');
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];

    useEffect(() => {
        fetchFavoriteTrackers();
    }, []);

    const fetchFavoriteTrackers = async () => {
        setRefreshing(true);
        const [novelTrackers, chapterTrackers] = await Promise.all([
            getFavoriteTrackersAsync(),
            getAllTrackersAsync(),
        ]);
        const trackers = extractTrackers(novelTrackers);

        // Enrich each novel tracker with reading status and latest chapter count
        const enriched: EnrichedTracker[] = await Promise.all(
            trackers.map(async (novelTracker) => {
                let enrichedNovel = novelTracker.novel;
                
                // Fetch latest chapter count if not available
                if (!enrichedNovel.latestChapter) {
                    try {
                        const freshContent = await fetchContentChapters(
                            novelTracker.repo,
                            novelTracker.novel,
                            true // use cache
                        );
                        if (freshContent.latestChapter) {
                            enrichedNovel = freshContent;
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch chapter count for ${novelTracker.novel.title}:`, error);
                    }
                }

                const enrichedTracker = { ...novelTracker, novel: enrichedNovel };
                return {
                    novelTracker: enrichedTracker,
                    readingStatus: await getNovelReadingStatus(enrichedTracker, chapterTrackers),
                };
            })
        );
        setEnrichedTrackers(enriched);
        setRefreshing(false);
    };

    const displayedTrackers = useMemo(() => {
        let filtered = [...enrichedTrackers];

        // Filtering by real reading status
        if (filterStatus !== 'All') {
            filtered = filtered.filter(t => t.readingStatus.status === filterStatus);
        }

        // Sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'Title') {
                return a.novelTracker.novel.title.localeCompare(b.novelTracker.novel.title);
            } else {
                return b.novelTracker.updated - a.novelTracker.updated;
            }
        });
    }, [enrichedTrackers, filterStatus, sortBy]);

    const lastReadNovel = useMemo(() => {
        if (enrichedTrackers.length === 0) return null;
        const readingNovels = enrichedTrackers.filter(t => 
            t.readingStatus.lastReadTimestamp && t.readingStatus.status === 'Reading'
        );
        if (readingNovels.length === 0) return null;
        return readingNovels.sort((a, b) => 
            (b.readingStatus.lastReadTimestamp || 0) - (a.readingStatus.lastReadTimestamp || 0)
        )[0];
    }, [enrichedTrackers]);

    const handleFilterChange = (status: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFilterStatus(status);
    };

    const handleViewToggle = (type: 'grid' | 'list') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewType(type);
    };

    const renderItem = ({ item, index }: { item: EnrichedTracker, index: number }) => {
        const totalChapters = item.novelTracker.novel.latestChapter || item.readingStatus.totalChaptersTracked || undefined;
        const commonProps = {
            item: item.novelTracker.novel,
            repo: item.novelTracker.repo,
            status: item.readingStatus.status,
            progress: item.readingStatus.progress,
            totalChapters,
            lastReadTimestamp: item.readingStatus.lastReadTimestamp,
        };

        return (
            <Animated.View
                layout={LinearTransition.springify()}
                entering={FadeInDown.delay(index * 50)}
                exiting={FadeOut}
                style={viewType === 'grid' ? { width: '50%' } : { width: '100%' }}
            >
                {viewType === 'grid' ? (
                    <BookItem {...commonProps} />
                ) : (
                    <BookListItem {...commonProps} />
                )}
            </Animated.View>
        );
    };

    const ViewToggle = () => (
        <View style={[styles.toggleContainer, { backgroundColor: themeColors.surfaceContainer }]}>
            <TouchableOpacity 
                style={[
                    styles.toggleButton, 
                    viewType === 'list' && [styles.toggleActive, { backgroundColor: themeColors.surfaceContainerLowest }]
                ]}
                onPress={() => handleViewToggle('list')}
            >
                <MaterialIcons 
                    name="view-list" 
                    size={20} 
                    color={viewType === 'list' ? themeColors.primary : themeColors.onSurfaceVariant} 
                />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[
                    styles.toggleButton, 
                    viewType === 'grid' && [styles.toggleActive, { backgroundColor: themeColors.surfaceContainerLowest }]
                ]}
                onPress={() => handleViewToggle('grid')}
            >
                <MaterialIcons 
                    name="grid-view" 
                    size={20} 
                    color={viewType === 'grid' ? themeColors.primary : themeColors.onSurfaceVariant} 
                />
            </TouchableOpacity>
        </View>
    );

    const ContinueReadingCard = ({ item }: { item: EnrichedTracker }) => {
        const scale = useSharedValue(1);
        
        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }]
        }));

        const handlePressIn = () => {
            scale.value = withSpring(0.97);
        };

        const handlePressOut = () => {
            scale.value = withSpring(1);
        };

        const handlePress = () => {
            const chapterProps: RenderChapterProps = {
                focusedMode: false,
                id: item.readingStatus.lastChapterRead || '1',
                content: item.novelTracker.novel,
                repo: item.novelTracker.repo,
                enableNextPrev: true,
                speachState: 'unknown',
                data: ''
            };
            router.push({
                pathname: '/chapters' as any,
                params: { props: JSON.stringify(chapterProps) }
            });
        };

        const coverUri = normalizeUrl(item.novelTracker.novel.bookImage, item.novelTracker.repo.repoUrl) || 
            `https://picsum.photos/seed/${item.novelTracker.novel.bookId}/200/300`;

        return (
            <View>
                <Animated.View style={[styles.continueCardContainer, animatedStyle]}>
                    <Pressable
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={handlePress}
                        style={styles.continueCardPressable}
                    >
                        <ImageBackground
                            source={{ uri: coverUri }}
                            style={styles.continueCardBg}
                            imageStyle={styles.continueCardImage}
                            blurRadius={10}
                        >
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.continueCardContent}>
                                <View style={styles.continueCardHeader}>
                                    <View style={[styles.continueBadge, { backgroundColor: themeColors.primary }]}>
                                        <MaterialCommunityIcons name="play" size={12} color={themeColors.onPrimary} />
                                        <AtelierText variant="caption" bold color={themeColors.onPrimary} style={styles.continueBadgeText}>
                                            RESUME READING
                                        </AtelierText>
                                    </View>
                                </View>
                                
                                <View style={styles.continueCardFooter}>
                                    <View style={styles.continueCardInfo}>
                                        <AtelierText variant="title" bold color="#fff" numberOfLines={1}>
                                            {item.novelTracker.novel.title}
                                        </AtelierText>
                                        <AtelierText variant="body" color="rgba(255,255,255,0.8)" numberOfLines={1}>
                                            Chapter {item.readingStatus.lastChapterRead}
                                        </AtelierText>
                                    </View>
                                    <View style={[styles.continuePlayButton, { backgroundColor: themeColors.primary }]}>
                                        <MaterialCommunityIcons name="chevron-right" size={28} color={themeColors.onPrimary} />
                                    </View>
                                </View>
                            </View>
                        </ImageBackground>
                    </Pressable>
                </Animated.View>
            </View>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.illustrationContainer}>
                <LinearGradient
                    colors={[themeColors.secondaryContainer + '33', 'transparent']}
                    style={styles.glow}
                />
                <View style={styles.bookIllustration}>
                    <View style={[styles.bookBody, { backgroundColor: themeColors.surfaceContainerLowest }]}>
                        <View style={styles.bookLines}>
                            <View style={[styles.line, { width: '75%', backgroundColor: themeColors.surfaceContainer }]} />
                            <View style={[styles.line, { width: '100%', backgroundColor: themeColors.surfaceContainer }]} />
                            <View style={[styles.line, { width: '85%', backgroundColor: themeColors.surfaceContainer }]} />
                            <View style={[styles.bookIconContainer, { backgroundColor: themeColors.secondaryContainer + '4D' }]}>
                                <MaterialIcons name="auto-stories" size={48} color={themeColors.secondary} />
                            </View>
                            <View style={[styles.line, { width: '100%', marginTop: 16, backgroundColor: themeColors.surfaceContainer }]} />
                            <View style={[styles.line, { width: '65%', backgroundColor: themeColors.surfaceContainer }]} />
                        </View>
                        <LinearGradient
                            colors={['rgba(0,0,0,0.05)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.bookSpine}
                        />
                    </View>
                    <View style={[styles.floatingElement, { backgroundColor: themeColors.primaryContainer }]}>
                        <MaterialCommunityIcons name="bookmark" size={24} color={themeColors.onPrimaryContainer} />
                    </View>
                </View>
            </View>

            <View style={styles.emptyTextContainer}>
                <AtelierText variant="title" bold style={styles.emptyTitle}>
                    Your library is empty.
                </AtelierText>
                <AtelierText variant="body" color={themeColors.onSurfaceVariant} style={styles.emptyDescription}>
                    Start adding stories to your collection and build your personal literary sanctuary.
                </AtelierText>
            </View>

            <AtelierButton 
                title="Browse Novels" 
                onPress={() => router.push('/repos' as any)}
                icon={<MaterialCommunityIcons name="arrow-right" size={20} color={themeColors.onPrimary} />}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Space at the top */}
            <View style={{ height: 24 }} />


            <FlatList
                data={displayedTrackers}
                renderItem={renderItem}
                keyExtractor={(item) => item.novelTracker.novel.bookId}
                ListHeaderComponent={() => enrichedTrackers.length > 0 ? (
                    <View style={styles.listHeader}>
                        <AtelierText variant="headline" bold style={styles.listTitle}>My Library</AtelierText>
                        <AtelierText variant="body" color={themeColors.onSurfaceVariant} style={styles.listSubtitle}>
                            Curating your personal literary collection.
                        </AtelierText>
                        
                        {lastReadNovel && filterStatus === 'All' && (
                            <ContinueReadingCard item={lastReadNovel} />
                        )}

                        <View style={styles.headerActions}>
                            <TouchableOpacity 
                                style={[styles.sortButton, { backgroundColor: themeColors.surfaceContainerLow }]}
                                onPress={() => setIsSortModalVisible(true)}
                            >
                                <MaterialIcons name="sort" size={18} color={themeColors.onSurfaceVariant} />
                                <AtelierText variant="caption" bold color={themeColors.onSurfaceVariant}>
                                    {sortBy}
                                </AtelierText>
                            </TouchableOpacity>
                            <ViewToggle />
                        </View>

                        {/* Status Filter Tabs */}
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterTabs}
                        >
                            {['All', 'Reading', 'Completed', 'Plan to Read', 'Dropped'].map((status) => {
                                const isActive = filterStatus === status;
                                return (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => handleFilterChange(status)}
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
                                            {status === 'All' ? 'All Works' : status}
                                        </AtelierText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                ) : null}
                ListEmptyComponent={EmptyState}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchFavoriteTrackers} tintColor={themeColors.primary} />
                }
                contentContainerStyle={styles.scrollContent}
                numColumns={viewType === 'grid' ? 2 : 1}
                key={viewType}
                columnWrapperStyle={viewType === 'grid' && displayedTrackers.length > 0 ? styles.columnWrapper : undefined}
            />

            {/* Sort Bottom Sheet Modal */}
            <Modal
                visible={isSortModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsSortModalVisible(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setIsSortModalVisible(false)}
                >
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={[styles.bottomSheet, { backgroundColor: themeColors.surfaceContainerLowest }]}>
                        <View style={[styles.dragHandle, { backgroundColor: themeColors.outlineVariant }]} />
                        <AtelierText variant="title" bold style={styles.modalTitle}>Sort Library</AtelierText>
                        
                        {['Updated', 'Title'].map((option) => (
                            <TouchableOpacity 
                                key={option} 
                                style={styles.sortOption}
                                onPress={() => {
                                    setSortBy(option);
                                    setIsSortModalVisible(false);
                                }}
                            >
                                <AtelierText 
                                    variant="body" 
                                    bold={sortBy === option}
                                    color={sortBy === option ? themeColors.primary : themeColors.onSurfaceVariant}
                                >
                                    Sort by {option}
                                </AtelierText>
                                {sortBy === option && (
                                    <MaterialIcons name="check" size={20} color={themeColors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#e0e0e0',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        fontSize: 22,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    listHeader: {
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 8,
    },
    listSubtitle: {
        marginTop: 4,
        marginBottom: 16,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    listTitle: {
        fontSize: 32,
    },
    filterTabs: {
        gap: 12,
        paddingBottom: 8,
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
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
    toggleContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 24,
    },
    toggleButton: {
        padding: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        padding: 24,
        paddingTop: 12,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        marginBottom: 16,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 60,
    },
    illustrationContainer: {
        width: '100%',
        aspectRatio: 1,
        marginBottom: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: '120%',
        height: '120%',
        borderRadius: 999,
        top: '-10%',
    },
    bookIllustration: {
        width: 220,
        height: 280,
        transform: [{ rotate: '-3deg' }],
    },
    bookBody: {
        flex: 1,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    bookLines: {
        flex: 1,
    },
    line: {
        height: 4,
        borderRadius: 2,
        marginBottom: 12,
    },
    bookIconContainer: {
        height: 100,
        width: '100%',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
    },
    bookSpine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 12,
    },
    floatingElement: {
        position: 'absolute',
        top: '25%',
        right: -16,
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '12deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    emptyTextContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emptyTitle: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
        marginBottom: 32,
    },
    continueCardContainer: {
        width: '100%',
        height: 160,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    continueCardPressable: {
        flex: 1,
    },
    continueCardBg: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    continueCardImage: {
        opacity: 0.7,
    },
    continueCardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    continueCardHeader: {
        flexDirection: 'row',
    },
    continueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    continueBadgeText: {
        fontSize: 10,
        letterSpacing: 1,
    },
    continueCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    continueCardInfo: {
        flex: 1,
        marginRight: 16,
    },
    continuePlayButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default FavoriteScreen;

function extractTrackers(t: Record<string, NovelTracker>): NovelTracker[] {
    const trackers = Object.values(t);
    return trackers.filter((tracker) => tracker.favorite)
        .sort((a, b) => b.updated - a.updated);
}
