import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Image, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, Modal, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { getFavoriteTrackersAsync, NovelTracker } from './tracker';
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

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FavoriteScreen = () => {
    const [favoriteTrackers, setFavoriteTrackers] = useState<NovelTracker[]>([]);
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
        const trackers = await getFavoriteTrackersAsync();
        setFavoriteTrackers(extractTrackers(trackers));
        setRefreshing(false);
    };

    const displayedTrackers = useMemo(() => {
        let filtered = [...favoriteTrackers];
        
        // Filtering
        if (filterStatus !== 'All') {
            filtered = filtered.filter(t => (t.favorite ? 'Reading' : 'Dropped') === filterStatus);
        }

        // Sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'Title') {
                return a.novel.title.localeCompare(b.novel.title);
            } else if (sortBy === 'Rating') {
                return (parseFloat(b.novel.rating || '0')) - (parseFloat(a.novel.rating || '0'));
            } else {
                return b.updated - a.updated;
            }
        });
    }, [favoriteTrackers, filterStatus, sortBy]);

    const handleFilterChange = (status: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFilterStatus(status);
    };

    const handleViewToggle = (type: 'grid' | 'list') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewType(type);
    };

    const renderItem = ({ item, index }: { item: NovelTracker, index: number }) => {
        const commonProps = {
            item: item.novel,
            repo: item.repo,
            status: (item.favorite ? 'Reading' : 'Dropped') as any,
            progress: 0.45,
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
                icon={<MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />}
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
                keyExtractor={(item) => item.novel.bookId}
                ListHeaderComponent={() => favoriteTrackers.length > 0 ? (
                    <View style={styles.listHeader}>
                        <AtelierText variant="headline" bold style={styles.listTitle}>My Library</AtelierText>
                        <AtelierText variant="body" color={themeColors.onSurfaceVariant} style={styles.listSubtitle}>
                            Curating your personal literary collection.
                        </AtelierText>
                        
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
                            {['All', 'Reading', 'Completed', 'Dropped'].map((status) => {
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
                        
                        {['Updated', 'Title', 'Rating'].map((option) => (
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
    },
});

export default FavoriteScreen;

function extractTrackers(t: Record<string, NovelTracker>): NovelTracker[] {
    const trackers = Object.values(t);
    return trackers.filter((tracker) => tracker.favorite)
        .sort((a, b) => b.updated - a.updated);
}

