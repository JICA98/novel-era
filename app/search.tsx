import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, FlatList, Dimensions, Platform, ActivityIndicator, RefreshControl, Modal, Pressable, LayoutAnimation } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { AtelierText } from '@/components/AtelierText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BookItem from './repos/bookItem';
import { BookListItem } from '@/components/BookListItem';
import { useSearchStore } from './store/searchStore';
import { Repo, Content, FetchData } from '@/types';
import UseRepositoryLayout from './_repos';
import { fetchContentList } from './repos/_layout';
import { useShallow } from 'zustand/react/shallow';
import { userPrefStore } from './userpref';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    chapterTrackerStore,
    getAllTrackersAsync,
    getFavoriteTrackersAsync,
    getNovelReadingStatusFromChapters,
    NovelReadingStatus,
    NovelTracker,
    novelKey,
    noveFavoriteStore,
} from './favorites/tracker';

const { width } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = 'explore-recent-searches';

type ViewState = 'discovery' | 'focus' | 'results' | 'empty';

export default function ExploreLayout() {
    return (
        <UseRepositoryLayout props={{ renderRepositories: (repos) => <ExploreScreen repos={repos} /> }} />
    );
}

function ExploreScreen({ repos }: { repos: Repo[] }) {
    const [viewState, setViewState] = useState<ViewState>('discovery');
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [discoveryData, setDiscoveryData] = useState<FetchData<Content[]>>({ isLoading: true });
    const [discoveryEnriched, setDiscoveryEnriched] = useState<EnrichedContent[]>([]);
    const router = useRouter();
    const params = useLocalSearchParams();
    const incomingQuery = params.query as string | undefined;

    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];
    const favoriteTrackerStoreState = noveFavoriteStore((state: any) => state.content);
    const chapterTrackerStoreState = chapterTrackerStore((state: any) => state.content);
    const liveFavoriteTrackerStores = favoriteTrackerStoreState instanceof Map ? favoriteTrackerStoreState : undefined;
    const liveChapterTrackerStores = chapterTrackerStoreState instanceof Map ? chapterTrackerStoreState : undefined;

    const { selectedRepositoryId, setSelectedRepository } = useSearchStore(
        useShallow((state) => ({
            selectedRepositoryId: state.selectedRepositoryId,
            setSelectedRepository: state.setSelectedRepository,
        }))
    );

    const setPreferredRepository = userPrefStore((state: any) => state.setPreferredRepository);

    const selectedRepo = useMemo(() => {
        return repos.find((repo) => repo.id === selectedRepositoryId) ?? repos[0];
    }, [repos, selectedRepositoryId]);
    const suggestedTags = selectedRepo?.repoTagSearch?.tags ?? [];

    // Load recent searches on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
                if (stored) setRecentSearches(JSON.parse(stored));
            } catch (err) {
                console.error('Failed to load search history', err);
            }
        };
        loadHistory();
    }, []);

    // Handle incoming search query from navigation params
    useEffect(() => {
        if (incomingQuery && incomingQuery !== searchQuery) {
            handleSearchSubmit(incomingQuery);
        }
    }, [incomingQuery]);

    const fetchDiscovery = async () => {
        setDiscoveryData({ isLoading: true });
        try {
            const data = await fetchContentList({ repo: selectedRepo, cached: false });
            setDiscoveryData({ data, isLoading: false });
            try {
                setDiscoveryEnriched(
                    await enrichContentsWithTracking({
                        data,
                        repo: selectedRepo,
                        liveFavoriteTrackerStores,
                        liveChapterTrackerStores,
                    })
                );
            } catch (enrichmentError) {
                console.warn('Discovery enrichment failed, falling back to raw results:', enrichmentError);
                setDiscoveryEnriched(data.map((item) => ({ content: item, resolvedTotalChapters: item.latestChapter })));
            }
        } catch (error) {
            setDiscoveryData({ error, isLoading: false });
            setDiscoveryEnriched([]);
        }
    };

    // Fetch discovery data when repo changes
    useEffect(() => {
        fetchDiscovery();
    }, [selectedRepo]);

    const saveRecentSearch = async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        
        const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
        setRecentSearches(updated);
        try {
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save search history', err);
        }
    };

    const handleSearchSubmit = (query: string) => {
        if (!query.trim()) return;
        setSearchQuery(query);
        setViewState('results');
        setShowFilters(false); // Reset filters on new search
        saveRecentSearch(query);
    };

    const [showFilters, setShowFilters] = useState(false);
    const [isTagsExpanded, setIsTagsExpanded] = useState(false);
    const tagRotation = useSharedValue(0);

    useEffect(() => {
        tagRotation.value = withTiming(isTagsExpanded ? 180 : 0, { duration: 250 });
    }, [isTagsExpanded]);

    const chevronAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${tagRotation.value}deg` }],
    }));

    const clearRecent = async () => {
        setRecentSearches([]);
        await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const removeRecent = async (item: string) => {
        const updated = recentSearches.filter(s => s !== item);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    const navigateToBook = (item: Content) => {
        router.push({
            pathname: '/contents',
            params: { content: JSON.stringify(item), repo: JSON.stringify(selectedRepo) }
        } as any);
    };

    const searchScale = useSharedValue(1);
    const searchAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: searchScale.value }],
    }));

    const handleSearchPress = () => {
        setViewState('focus');
    };

    const renderTagRail = (title: string) => {
        if (suggestedTags.length === 0) {
            return null;
        }

        const isExpanded = isTagsExpanded;

        return (
            <View style={styles.tagRailSection}>
                <View style={styles.tagRailHeader}>
                    <AtelierText variant="subtitle" bold color={themeColors.primary}>{title}</AtelierText>
                    <TouchableOpacity 
                        onPress={() => {
                            setIsTagsExpanded(!isExpanded);
                        }}
                        style={styles.expandButton}
                    >
                        <AtelierText variant="caption" bold color={themeColors.primary}>
                            {isExpanded ? 'COLLAPSE' : 'EXPAND'}
                        </AtelierText>
                        <Animated.View style={chevronAnimatedStyle}>
                            <MaterialCommunityIcons 
                                name="chevron-down" 
                                size={16} 
                                color={themeColors.primary} 
                                style={{ marginLeft: 4 }}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
                <View style={styles.tagRailContainer}>
                    {isExpanded ? (
                        <View style={styles.tagGridContent}>
                            {suggestedTags.map((tag, index) => (
                                <Animated.View
                                    key={tag.value}
                                    entering={FadeIn.duration(200)}
                                >
                                    <TouchableOpacity
                                        style={[styles.tagRailChip, { backgroundColor: themeColors.secondaryContainer, marginBottom: 10 }]}
                                        onPress={() => handleSearchSubmit(tag.label)}
                                    >
                                        <AtelierText variant="label" bold color={themeColors.onSecondaryContainer}>
                                            {tag.label}
                                        </AtelierText>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tagRailContent}
                        >
                            {suggestedTags.map((tag) => (
                                <View 
                                    key={tag.value}
                                >
                                    <TouchableOpacity
                                        style={[styles.tagRailChip, { backgroundColor: themeColors.secondaryContainer }]}
                                        onPress={() => handleSearchSubmit(tag.label)}
                                    >
                                        <AtelierText variant="label" bold color={themeColors.onSecondaryContainer}>
                                            {tag.label}
                                        </AtelierText>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        );
    };

    const discoveryView = useMemo(() => {
        const trending = discoveryEnriched.slice(0, 6);
        const curated = discoveryEnriched.slice(6, 9);
        const fresh = discoveryEnriched.slice(9, 14);

        if (discoveryData.isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <AtelierText style={{ marginTop: 12 }} color={themeColors.onSurfaceVariant}>Curating your library...</AtelierText>
                </View>
            );
        }

        if (discoveryData.error) {
            return feedbackView({ type: 'error', onRetry: fetchDiscovery });
        }

        return (
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                {/* Search Bar Section */}
                <Animated.View sharedTransitionTag="searchBar">
                    <Animated.View style={searchAnimatedStyle}>
                        <TouchableOpacity 
                            activeOpacity={1} 
                            onPress={handleSearchPress}
                            style={[styles.searchBarTrigger, { backgroundColor: themeColors.surfaceContainerLow }]}
                        >
                            <MaterialCommunityIcons name="magnify" size={24} color={themeColors.onSurfaceVariant} />
                            <AtelierText color={themeColors.onSurfaceVariant + '88'} style={styles.placeholderText}>
                                Find your next masterpiece...
                            </AtelierText>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>

                {renderTagRail('Popular Tags')}

                {/* Trending Now */}
                {trending.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <AtelierText variant="title" bold>Trending Now</AtelierText>
                            <TouchableOpacity onPress={() => router.push('/explore_all' as any)}><AtelierText variant="label" bold color={themeColors.primary}>VIEW ALL</AtelierText></TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
                            {trending.map((item, i) => (
                                <TouchableOpacity key={i} style={styles.trendingCard} onPress={() => navigateToBook(item.content)}>
                                    <Image source={{ uri: item.content.bookImage }} style={styles.trendingImage} />
                                    {item.readingStatus?.status ? (
                                        <View style={[styles.discoveryStatusChip, { backgroundColor: getStatusChipColors(themeColors, item.readingStatus.status)?.bg }]}>
                                            <AtelierText variant="caption" bold style={[styles.discoveryStatusText, { color: getStatusChipColors(themeColors, item.readingStatus.status)?.text }]}>
                                                {item.readingStatus.status.toUpperCase()}
                                            </AtelierText>
                                        </View>
                                    ) : null}
                                    <View style={styles.cardInfo}>
                                        <AtelierText variant="subtitle" bold numberOfLines={1}>{item.content.title}</AtelierText>
                                        <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>{selectedRepo.name}</AtelierText>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* Curated Collections (Bento Grid) */}
                {curated.length > 0 && (
                    <>
                        <AtelierText variant="title" bold style={styles.sectionTitle}>Curated Collections</AtelierText>
                        <View style={styles.bentoGrid}>
                            <View style={styles.bentoLeft}>
                                <TouchableOpacity style={[styles.bentoCardLarge, { backgroundColor: themeColors.primaryContainer }]} onPress={() => curated[0] && navigateToBook(curated[0].content)}>
                                    <Image source={{ uri: curated[0]?.content.bookImage }} style={styles.bentoImage} />
                                    {curated[0]?.readingStatus?.status ? (
                                        <View style={[styles.discoveryStatusChip, styles.bentoStatusChip, { backgroundColor: getStatusChipColors(themeColors, curated[0].readingStatus.status)?.bg }]}>
                                            <AtelierText variant="caption" bold style={[styles.discoveryStatusText, { color: getStatusChipColors(themeColors, curated[0].readingStatus.status)?.text }]}>
                                                {curated[0].readingStatus.status.toUpperCase()}
                                            </AtelierText>
                                        </View>
                                    ) : null}
                                    <View style={styles.bentoOverlay}>
                                        <AtelierText variant="caption" bold color={themeColors.primary + 'AA'} style={styles.bentoTag}>EDITOR\'S PICK</AtelierText>
                                        <AtelierText variant="subtitle" bold color="#fff" numberOfLines={2}>{curated[0]?.content.title}</AtelierText>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.bentoRight}>
                                <TouchableOpacity style={[styles.bentoCardSmall, { backgroundColor: themeColors.secondaryContainer }]} onPress={() => curated[1] && navigateToBook(curated[1].content)}>
                                    <Image source={{ uri: curated[1]?.content.bookImage }} style={styles.bentoImage} />
                                    {curated[1]?.readingStatus?.status ? (
                                        <View style={[styles.discoveryStatusChip, styles.bentoStatusChip, { backgroundColor: getStatusChipColors(themeColors, curated[1].readingStatus.status)?.bg }]}>
                                            <AtelierText variant="caption" bold style={[styles.discoveryStatusText, { color: getStatusChipColors(themeColors, curated[1].readingStatus.status)?.text }]}>
                                                {curated[1].readingStatus.status.toUpperCase()}
                                            </AtelierText>
                                        </View>
                                    ) : null}
                                    <View style={styles.bentoOverlay}>
                                        <AtelierText variant="label" bold color="#fff" numberOfLines={1}>{curated[1]?.content.title || 'Fantasy Escapes'}</AtelierText>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.bentoCardSmall, { backgroundColor: themeColors.primaryContainer, marginTop: 12 }]} onPress={() => curated[2] && navigateToBook(curated[2].content)}>
                                    <Image source={{ uri: curated[2]?.content.bookImage }} style={styles.bentoImage} />
                                    {curated[2]?.readingStatus?.status ? (
                                        <View style={[styles.discoveryStatusChip, styles.bentoStatusChip, { backgroundColor: getStatusChipColors(themeColors, curated[2].readingStatus.status)?.bg }]}>
                                            <AtelierText variant="caption" bold style={[styles.discoveryStatusText, { color: getStatusChipColors(themeColors, curated[2].readingStatus.status)?.text }]}>
                                                {curated[2].readingStatus.status.toUpperCase()}
                                            </AtelierText>
                                        </View>
                                    ) : null}
                                    <View style={styles.bentoOverlay}>
                                        <AtelierText variant="label" bold color="#fff" numberOfLines={1}>{curated[2]?.content.title || 'New Frontiers'}</AtelierText>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Fresh Arrivals */}
                {fresh.length > 0 && (
                    <>
                        <AtelierText variant="title" bold style={styles.sectionTitle}>Fresh Arrivals</AtelierText>
                        {fresh.map((item, i) => (
                            <TouchableOpacity key={i} style={[styles.arrivalItem, { backgroundColor: themeColors.surfaceContainerLow }]} onPress={() => navigateToBook(item.content)}>
                                <Image source={{ uri: item.content.bookImage }} style={styles.arrivalImage} />
                                <View style={styles.arrivalInfo}>
                                    <AtelierText variant="subtitle" bold numberOfLines={1}>{item.content.title}</AtelierText>
                                    <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>{selectedRepo.name}</AtelierText>
                                    <View style={styles.arrivalMeta}>
                                        <View style={[styles.tag, { backgroundColor: themeColors.surfaceContainerHighest }]}>
                                            <AtelierText variant="caption" bold color={themeColors.onSurfaceVariant}>CHAPTER {item.resolvedTotalChapters || item.content.latestChapter || '1'}</AtelierText>
                                        </View>
                                        {item.readingStatus?.status ? (
                                            <View style={[styles.inlineDiscoveryStatusChip, { backgroundColor: getStatusChipColors(themeColors, item.readingStatus.status)?.bg }]}>
                                                <AtelierText variant="caption" bold style={{ color: getStatusChipColors(themeColors, item.readingStatus.status)?.text }}>
                                                    {item.readingStatus.status.toUpperCase()}
                                                </AtelierText>
                                            </View>
                                        ) : null}
                                        {item.content.rating && (
                                            <View style={styles.ratingRow}>
                                                <MaterialIcons name="star" size={12} color={themeColors.primary} />
                                                <AtelierText variant="caption" bold> {item.content.rating}</AtelierText>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={themeColors.onSurfaceVariant + '44'} />
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
        );
    }, [discoveryData, discoveryEnriched, themeColors, selectedRepo, searchAnimatedStyle, isTagsExpanded]);

    const focusContent = useMemo(() => (
        <ScrollView 
            contentContainerStyle={styles.focusContent}
        >
        {/* Recent Searches */}
        <View style={styles.sectionHeader}>
            <AtelierText variant="subtitle" bold color={themeColors.primary}>Recent Searches</AtelierText>
            <TouchableOpacity onPress={clearRecent}>
                <AtelierText variant="caption" bold color={themeColors.primary}>CLEAR ALL</AtelierText>
            </TouchableOpacity>
        </View>
        <View style={[styles.recentList, { backgroundColor: themeColors.surfaceContainerLow }]}>
            {recentSearches.map((item, index) => (
                <TouchableOpacity 
                    key={item} 
                    style={[styles.recentItem, index < recentSearches.length - 1 && { borderBottomWidth: 1, borderBottomColor: themeColors.outlineVariant + '11' }]}
                    onPress={() => handleSearchSubmit(item)}
                >
                    <View style={styles.recentLeft}>
                        <MaterialCommunityIcons name="history" size={20} color={themeColors.onSurfaceVariant} />
                        <AtelierText style={styles.recentText}>{item}</AtelierText>
                    </View>
                    <TouchableOpacity onPress={() => removeRecent(item)}>
                        <MaterialCommunityIcons name="close" size={18} color={themeColors.onSurfaceVariant} />
                    </TouchableOpacity>
                </TouchableOpacity>
            ))}
        </View>

        {renderTagRail('Suggested Tags')}

        {/* Bento Style Recommendation */}
        <View style={[styles.promoCard, { backgroundColor: themeColors.primary }]}>
            <AtelierText variant="caption" bold color={themeColors.onPrimary + '88'}>CURATED RECOMMENDATION</AtelierText>
            <AtelierText variant="title" color={themeColors.onPrimary} italic style={styles.promoTitle}>Discover: Shadows of the Atelier</AtelierText>
            <TouchableOpacity style={styles.promoButton}>
                <AtelierText variant="label" bold color={themeColors.primary}>Explore Series</AtelierText>
            </TouchableOpacity>
        </View>
        </ScrollView>
    ), [themeColors, recentSearches, suggestedTags, handleSearchSubmit, isTagsExpanded]);

    const focusView = (
        <View style={styles.focusContainer}>
            {/* Search Input Bar */}
            <Animated.View 
                sharedTransitionTag="searchBar"
                style={[styles.activeSearchBar, { backgroundColor: themeColors.surfaceContainerLowest, borderColor: themeColors.outlineVariant + '33' }]}
            >
                <MaterialCommunityIcons name="magnify" size={24} color={themeColors.primary} style={styles.searchIcon} />
                <TextInput 
                    style={[styles.searchInput, { color: themeColors.text }]}
                    placeholder="Sword Master's..."
                    placeholderTextColor={themeColors.onSurfaceVariant + '88'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => handleSearchSubmit(searchQuery)}
                    autoFocus
                />
                <TouchableOpacity onPress={() => { setSearchQuery(''); setViewState('discovery'); }}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={themeColors.onSurfaceVariant} />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View 
                entering={FadeIn.duration(300)}
                style={{ flex: 1 }}
            >
                {focusContent}
            </Animated.View>
        </View>
    );

    const feedbackView = useMemo(() => {
        const InnerFeedbackView = ({ type = 'empty', onRetry }: { type?: 'empty' | 'error', onRetry?: () => void }) => {
            const recommendations = discoveryData.data?.slice(0, 3) ?? [];
            const isError = type === 'error';
            
            return (
                <ScrollView contentContainerStyle={styles.emptyViewContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.emptyStatusHeader}>
                        <View style={styles.searchTag}>
                            <MaterialIcons name={isError ? "error-outline" : "history"} size={14} color={isError ? themeColors.error : themeColors.onSurfaceVariant} />
                            <AtelierText variant="caption" bold color={isError ? themeColors.error : themeColors.onSurfaceVariant}> 
                                {isError ? "CONNECTION ERROR" : `SEARCH: "${searchQuery}"`}
                            </AtelierText>
                        </View>
                        <AtelierText variant="headline" bold color={themeColors.primary} style={styles.emptyTitle}>
                            {isError ? "The archive is out of reach" : "No stories found for that search"}
                        </AtelierText>
                        <AtelierText variant="subtitle" color={themeColors.onSurfaceVariant} style={styles.emptySub}>
                            {isError 
                                ? "We couldn\'t connect to the repository. Please check your connection or try again later."
                                : "Our curators couldn\'t find a match. Try adjusting your filters or explore our selected recommendations below."}
                        </AtelierText>
                    </View>

                    <View style={[styles.illustrationCard, { backgroundColor: isError ? themeColors.errorContainer + '22' : themeColors.surfaceContainerLow }]}>
                        <View style={[styles.illustrationIcon, { backgroundColor: isError ? themeColors.errorContainer : themeColors.surfaceContainerLowest }]}>
                            <MaterialIcons name={isError ? "cloud-off" : "auto-stories"} size={48} color={isError ? themeColors.error : themeColors.primary} />
                        </View>
                        <AtelierText variant="title" bold style={styles.illustrationText}>
                            {isError ? "The ink has run dry." : "The shelves are silent."}
                        </AtelierText>
                        <View style={styles.emptyButtons}>
                            {isError ? (
                                <TouchableOpacity 
                                    style={[styles.emptyPrimaryBtn, { backgroundColor: themeColors.error }]}
                                    onPress={onRetry}
                                >
                                    <AtelierText variant="label" bold color={themeColors.onError}>Try Again</AtelierText>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.emptyPrimaryBtn, { backgroundColor: themeColors.primary }]}
                                    onPress={() => setViewState('discovery')}
                                >
                                    <AtelierText variant="label" bold color={themeColors.onPrimary}>Clear Filters</AtelierText>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                                style={[styles.emptySecondaryBtn, { borderColor: isError ? themeColors.error : themeColors.outlineVariant }]} 
                                onPress={() => setViewState('discovery')}
                            >
                                <AtelierText variant="label" bold color={isError ? themeColors.error : themeColors.primary}>Browse All</AtelierText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recommendations Bento */}
                    {recommendations.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <AtelierText variant="title" bold color={themeColors.primary}>Recommended for You</AtelierText>
                                    <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>Hand-picked by our curators for your taste.</AtelierText>
                                </View>
                            </View>

                            <View style={styles.bentoGridResults}>
                                <TouchableOpacity style={[styles.bentoLargeItem, { backgroundColor: themeColors.surfaceContainerHigh }]} onPress={() => navigateToBook(recommendations[0])}>
                                    <Image source={{ uri: recommendations[0]?.bookImage }} style={styles.bentoImage} />
                                    <View style={styles.bentoGradient}>
                                        <View style={[styles.editorTag, { backgroundColor: themeColors.secondaryContainer }]}>
                                            <AtelierText variant="caption" bold color={themeColors.onSecondaryContainer}>EDITOR\'S CHOICE</AtelierText>
                                        </View>
                                        <AtelierText variant="title" bold color="#fff" numberOfLines={1}>{recommendations[0]?.title}</AtelierText>
                                        <AtelierText variant="caption" color="rgba(255,255,255,0.7)" numberOfLines={2}>Discover this hidden gem from the {selectedRepo.name} collection.</AtelierText>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.bentoStackResults}>
                                    {recommendations.slice(1, 3).map((rec, i) => (
                                        <TouchableOpacity key={i} style={[styles.bentoSmallResultItem, { backgroundColor: themeColors.surfaceContainerHigh, marginTop: i === 1 ? 12 : 0 }]} onPress={() => navigateToBook(rec)}>
                                            <Image source={{ uri: rec.bookImage }} style={styles.bentoSmallThumb} />
                                            <View style={styles.bentoSmallInfo}>
                                                <AtelierText variant="label" bold numberOfLines={1}>{rec.title}</AtelierText>
                                                <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>{selectedRepo.name}</AtelierText>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            );
        };
        return InnerFeedbackView;
    }, [discoveryData, themeColors, searchQuery, selectedRepo, setViewState]);


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={{ flex: 1 }}>
                {viewState === 'discovery' && discoveryView}
                {viewState === 'focus' && focusView}
                {viewState === 'results' && (
                    <SearchResultsView
                        repo={selectedRepo}
                        searchQuery={searchQuery}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        onReset={() => {
                            setSearchQuery('');
                            setShowFilters(false);
                            setViewState('discovery');
                        }}
                        repos={repos}
                        setSelectedRepository={setSelectedRepository}
                        setPreferredRepository={setPreferredRepository}
                        renderEmpty={() => React.createElement(feedbackView, { type: 'empty' })}
                        renderError={({ onRetry }) => React.createElement(feedbackView, { type: 'error', onRetry })}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

export interface EnrichedContent {
    content: Content;
    resolvedTotalChapters?: number;
    readingStatus?: NovelReadingStatus;
}

interface SearchResultListItem {
    type: 'result';
    resultKey: string;
    data: EnrichedContent;
}

function normalizeNovelIdentity(value?: string) {
    return (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function resolveLatestChapterCount(...values: Array<number | undefined>) {
    const chapterCounts = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
    if (chapterCounts.length === 0) {
        return undefined;
    }

    return Math.max(...chapterCounts);
}

function getBoundStoreContent<T>(store: any): T | undefined {
    if (store && typeof store.getState === 'function') {
        return store.getState().content as T;
    }

    return undefined;
}

export async function enrichContentsWithTracking({
    data,
    repo,
    liveFavoriteTrackerStores,
    liveChapterTrackerStores,
}: {
    data: Content[];
    repo: Repo;
    liveFavoriteTrackerStores?: Map<string, any>;
    liveChapterTrackerStores?: Map<string, any>;
}): Promise<EnrichedContent[]> {
    const [favoriteTrackers, chapterTrackers] = await Promise.all([
        getFavoriteTrackersAsync(),
        getAllTrackersAsync(),
    ]);
    const favoriteTrackerValues = [
        ...Object.values(favoriteTrackers),
        ...(liveFavoriteTrackerStores
            ? Array.from(liveFavoriteTrackerStores.values())
                .map((store) => getBoundStoreContent<NovelTracker>(store))
                .filter(Boolean)
            : []),
    ] as NovelTracker[];
    const chapterTrackerValues = [
        ...Object.values(chapterTrackers),
        ...(liveChapterTrackerStores
            ? Array.from(liveChapterTrackerStores.values())
                .map((store) => getBoundStoreContent(store))
                .filter(Boolean)
            : []),
    ];

    return Promise.all(
        data.map(async (item) => {
            try {
                let resolvedContent = item;
                let readingStatus: NovelReadingStatus | undefined;
                let resolvedTotalChapters = item.latestChapter;
                const normalizedTitle = normalizeNovelIdentity(item.title);

                const trackerStoreKey = novelKey(repo.id, item.bookId);
                const liveNovelTracker = getBoundStoreContent<NovelTracker>(
                    liveFavoriteTrackerStores?.get(trackerStoreKey)
                );
                const matchedNovelTrackerByTitle = favoriteTrackerValues.find((tracker) =>
                    tracker?.repo?.id === repo.id &&
                    normalizeNovelIdentity(tracker.novel.title) === normalizedTitle
                );
                const storedNovelTracker = liveNovelTracker ?? favoriteTrackers[trackerStoreKey] ?? matchedNovelTrackerByTitle;
                const trackedChapters = chapterTrackerValues.filter((tracker: any) => {
                    if (!tracker || tracker.repo?.id !== repo.id) {
                        return false;
                    }

                    return (
                        tracker.novel?.bookId === item.bookId ||
                        normalizeNovelIdentity(tracker.novel?.title) === normalizedTitle
                    );
                });

                if (storedNovelTracker) {
                    resolvedTotalChapters = resolveLatestChapterCount(
                        item.latestChapter,
                        storedNovelTracker.novel.latestChapter
                    );
                    resolvedContent = {
                        ...storedNovelTracker.novel,
                        ...item,
                        latestChapter: resolvedTotalChapters,
                    };
                }

                if (trackedChapters.length > 0) {
                    readingStatus = getNovelReadingStatusFromChapters(resolvedContent, trackedChapters as any);
                } else if (storedNovelTracker?.favorite) {
                    readingStatus = {
                        status: 'Plan to Read',
                        progress: 0,
                        totalChaptersTracked: 0,
                    };
                }

                return {
                    content: resolvedContent,
                    resolvedTotalChapters,
                    readingStatus,
                };
            } catch (enrichmentError) {
                console.warn(`Failed to enrich search result for ${item.title}:`, enrichmentError);
                return {
                    content: item,
                    resolvedTotalChapters: item.latestChapter,
                    readingStatus: undefined,
                };
            }
        })
    );
}

export function getStatusChipColors(themeColors: typeof Colors.light, status?: NovelReadingStatus['status']) {
    switch (status) {
        case 'Completed':
            return { bg: '#15803d', text: '#ffffff' };
        case 'Dropped':
            return { bg: '#ffdad6', text: '#93000a' };
        case 'Plan to Read':
            return { bg: themeColors.outlineVariant, text: themeColors.onSurfaceVariant };
        case 'Reading':
            return { bg: themeColors.secondaryContainer, text: themeColors.onSecondaryContainer };
        default:
            return undefined;
    }
}

export interface SearchResultsViewProps {
    repo: Repo;
    searchQuery: string;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    onReset: () => void;
    repos: Repo[];
    setSelectedRepository: (id: string) => void;
    setPreferredRepository: (id: string) => void;
    renderEmpty: () => React.ReactElement;
    renderError: (props: { onRetry: () => void }) => React.ReactElement;
    hideHeader?: boolean;
}

export function SearchResultsView({
    repo,
    searchQuery,
    showFilters,
    setShowFilters,
    onReset,
    repos,
    setSelectedRepository,
    setPreferredRepository,
    renderEmpty,
    renderError,
    hideHeader = false,
}: SearchResultsViewProps) {
    const [content, setContent] = useState<FetchData<Content[]>>({ isLoading: true });
    const [enrichedResults, setEnrichedResults] = useState<EnrichedContent[]>([]);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];
    const favoriteTrackerStoreState = noveFavoriteStore((state: any) => state.content);
    const chapterTrackerStoreState = chapterTrackerStore((state: any) => state.content);
    const liveFavoriteTrackerStores = favoriteTrackerStoreState instanceof Map ? favoriteTrackerStoreState : undefined;
    const liveChapterTrackerStores = chapterTrackerStoreState instanceof Map ? chapterTrackerStoreState : undefined;

    const fetchContent = async ({ cached }: { cached: boolean }) => {
        setContent({ isLoading: true });
        try {
            const data = await fetchContentList({ repo, searchQuery, cached });
            setContent({ data, isLoading: false });

            try {
                setEnrichedResults(
                    await enrichContentsWithTracking({
                        data,
                        repo,
                        liveFavoriteTrackerStores,
                        liveChapterTrackerStores,
                    })
                );
            } catch (enrichmentError) {
                console.warn('Search enrichment failed, falling back to raw results:', enrichmentError);
                setEnrichedResults(
                    data.map((item) => ({
                        content: item,
                        resolvedTotalChapters: item.latestChapter,
                        readingStatus: undefined,
                    }))
                );
            }
        } catch (fetchError) {
            setContent({ error: fetchError, isLoading: false });
            setEnrichedResults([]);
        }
    };

    useEffect(() => {
        fetchContent({ cached: false });
    }, [repo, searchQuery]);

    const handleViewToggle = (type: 'grid' | 'list') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewType(type);
    };

    const renderListElement = ({ item, index }: { item: any; index: number }) => {
        if (item.type === 'result-header') {
            return (
                <Animated.View 
                    entering={FadeInDown.duration(400)}
                    style={[styles.resultsTitleContainer, { backgroundColor: themeColors.background, zIndex: 1 }]}
                >
                    <View style={styles.resultsHeaderTopRow}>
                        <View style={styles.resultsHeaderText}>
                            <AtelierText variant="headline" bold color={themeColors.primary} style={{ fontSize: 36 }}>
                                Results for '{searchQuery}'
                            </AtelierText>
                            <AtelierText variant="subtitle" color={themeColors.onSurfaceVariant}>
                                {content.data?.length || 0} volume{(content.data?.length || 0) !== 1 ? 's' : ''} found
                            </AtelierText>
                        </View>
                        <TouchableOpacity
                            onPress={onReset}
                            style={[styles.resultsResetButton, { backgroundColor: themeColors.surfaceContainerHigh }]}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={18} color={themeColors.primary} />
                            <AtelierText variant="label" bold color={themeColors.primary} style={styles.resultsResetLabel}>
                                Reset
                            </AtelierText>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            );
        }

        if (item.type === 'sticky-header') {
            return (
                <BlurView 
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={colorScheme === 'dark' ? 'dark' : 'light'}
                    style={styles.stickyHeaderContainer}
                >
                    <View style={[styles.stickyHeader, { backgroundColor: themeColors.background + 'cc' }]}>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={[styles.filterBtn, { backgroundColor: showFilters ? themeColors.secondary : themeColors.surfaceContainerHigh }]}
                                onPress={() => setShowFilters(!showFilters)}
                            >
                                <MaterialIcons
                                    name={showFilters ? "close" : "tune"}
                                    size={20}
                                    color={showFilters ? themeColors.onSecondary : themeColors.onSurfaceVariant}
                                />
                                <AtelierText variant="label" bold color={showFilters ? themeColors.onSecondary : themeColors.onSurfaceVariant} style={{ marginLeft: 8 }}>
                                    {showFilters ? "Hide" : "Filter"}
                                </AtelierText>
                            </TouchableOpacity>
                            <View style={[styles.viewToggleContainer, { backgroundColor: themeColors.surfaceContainerHigh }]}>
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
                        </View>

                        {showFilters && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repoChips}>
                                {repos.map((r) => {
                                    const isSelected = repo.id === r.id;
                                    return (
                                        <TouchableOpacity
                                            key={r.id}
                                            onPress={() => {
                                                setSelectedRepository(r.id);
                                                setPreferredRepository(r.id);
                                            }}
                                            style={[styles.repoChip, { backgroundColor: isSelected ? themeColors.primary : themeColors.surfaceContainerLowest }]}
                                        >
                                            <AtelierText variant="label" bold color={isSelected ? themeColors.onPrimary : themeColors.onSurfaceVariant}>
                                                {r.name}
                                            </AtelierText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </BlurView>
            );
        }

        if (item.type === 'row') {
            return (
                <View style={styles.gridRow}>
                    {item.items.map((res: SearchResultListItem, i: number) => {
                        const result = res.data;
                        const commonProps = {
                            item: result.content,
                            repo,
                            status: result.readingStatus?.status,
                            progress: result.readingStatus?.progress || 0,
                            totalChapters: result.resolvedTotalChapters || result.readingStatus?.totalChaptersTracked || undefined,
                            lastChapterRead: result.readingStatus?.lastChapterRead,
                            lastReadTimestamp: result.readingStatus?.lastReadTimestamp,
                        };
                        return (
                            <Animated.View
                                key={res.resultKey}
                                layout={LinearTransition.duration(300)}
                                entering={FadeInDown.delay(index * 80 + i * 40).duration(400)}
                                exiting={FadeOut}
                                style={{ width: '50%' }}
                            >
                                <BookItem {...commonProps} />
                            </Animated.View>
                        );
                    })}
                </View>
            );
        }

        const result = item.data;
        const commonProps = {
            item: result.content,
            repo,
            status: result.readingStatus?.status,
            progress: result.readingStatus?.progress || 0,
            totalChapters: result.resolvedTotalChapters || result.readingStatus?.totalChaptersTracked || undefined,
            lastChapterRead: result.readingStatus?.lastChapterRead,
            lastReadTimestamp: result.readingStatus?.lastReadTimestamp,
        };

        return (
            <Animated.View
                layout={LinearTransition.duration(300)}
                entering={FadeInDown.delay(index * 80).duration(400)}
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



    const data = useMemo(() => {
        if (content.isLoading || content.error || !content.data || content.data.length === 0) {
            return [];
        }
        
        const results: SearchResultListItem[] = enrichedResults.map((item, index) => ({
            type: 'result',
            resultKey: `results-${item.content.bookId}-${index}`,
            data: item,
        }));
        
        const finalResults: any[] = [];
        if (!hideHeader) {
            finalResults.push({ type: 'result-header' });
        }
        finalResults.push({ type: 'sticky-header' });

        if (viewType === 'grid') {
            for (let i = 0; i < results.length; i += 2) {
                finalResults.push({
                    type: 'row',
                    items: results.slice(i, i + 2)
                });
            }
        } else {
            finalResults.push(...results);
        }
        
        return finalResults;
    }, [enrichedResults, content.isLoading, content.error, content.data, viewType, hideHeader]);
 
    const stickyIndices = useMemo(() => {
        if (hideHeader) return [0];
        return [1];
    }, [hideHeader]);

    if (content.isLoading) {
        return (
            <View style={styles.resultsContainer}>
                <View style={styles.resultsLoading}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <AtelierText style={{ marginTop: 12 }} color={themeColors.onSurfaceVariant}>Searching archives...</AtelierText>
                </View>
            </View>
        );
    }

    if (content.error || !content.data) {
        return (
            <View style={styles.resultsContainer}>
                {renderError({ onRetry: () => fetchContent({ cached: false }) })}
            </View>
        );
    }

    if (content.data.length === 0) {
        return (
            <View style={styles.resultsContainer}>
                {renderEmpty()}
            </View>
        );
    }

    return (
        <View style={styles.resultsContainer}>
            <FlatList
                data={data}
                renderItem={renderListElement}
                keyExtractor={(item, index) => {
                    if (item.type === 'result-header') return 'header';
                    if (item.type === 'sticky-header') return 'sticky';
                    if (item.type === 'row') {
                        const rowKey = item.items.map((entry: SearchResultListItem) => entry.resultKey).join('__');
                        return `row-${rowKey || index}`;
                    }
                    return item.resultKey || `item-${index}`;
                }}
                numColumns={1}
                key={viewType}
                stickyHeaderIndices={stickyIndices}
                contentContainerStyle={styles.resultsList}
                refreshControl={
                    <RefreshControl
                        refreshing={content.isLoading}
                        onRefresh={() => fetchContent({ cached: false })}
                        tintColor={themeColors.primary}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    searchBarTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 64,
        borderRadius: 16,
        paddingHorizontal: 20,
        marginTop: 24,
    },
    placeholderText: {
        marginLeft: 12,
        fontSize: 16,
    },
    tagRailSection: {
        marginTop: 24,
    },
    tagRailContainer: {
        minHeight: 44,
    },
    tagRailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagGridContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tagRailContent: {
        paddingRight: 24,
    },
    tagRailChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        marginRight: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 32,
        marginBottom: 16,
    },
    sectionTitle: {
        marginTop: 32,
        marginBottom: 16,
    },
    trendingScroll: {
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    trendingCard: {
        width: 200,
        marginRight: 20,
    },
    trendingImage: {
        width: '100%',
        aspectRatio: 2/3,
        borderRadius: 12,
        backgroundColor: '#eee',
    },
    cardInfo: {
        marginTop: 12,
    },
    discoveryStatusChip: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        zIndex: 2,
    },
    bentoStatusChip: {
        top: 10,
        left: 10,
    },
    discoveryStatusText: {
        fontSize: 9,
        letterSpacing: 0.8,
    },
    bentoGrid: {
        flexDirection: 'row',
        height: 320,
    },
    bentoLeft: {
        flex: 1.2,
        marginRight: 12,
    },
    bentoRight: {
        flex: 1,
    },
    bentoCardLarge: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bentoCardSmall: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bentoImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    bentoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    bentoTag: {
        marginBottom: 2,
    },
    arrivalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    arrivalImage: {
        width: 70,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    arrivalInfo: {
        flex: 1,
        marginLeft: 16,
    },
    arrivalMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 12,
    },
    inlineDiscoveryStatusChip: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        marginRight: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    focusContainer: {
        flex: 1,
        paddingTop: 24,
    },
    activeSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        height: 64,
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 18,
        fontFamily: 'Manrope-Medium',
    },
    focusContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 100,
    },
    recentList: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    recentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recentText: {
        marginLeft: 16,
        fontSize: 16,
    },
    promoCard: {
        marginTop: 32,
        padding: 24,
        borderRadius: 16,
        overflow: 'hidden',
    },
    promoTitle: {
        fontSize: 24,
        marginTop: 8,
        marginBottom: 16,
    },
    promoButton: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    resultsHeader: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 20,
    },
    resultsTitleContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    resultsHeaderTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    resultsHeaderText: {
        flex: 1,
    },
    resultsResetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: 8,
    },
    resultsResetLabel: {
        marginLeft: 6,
    },
    stickyHeader: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
        zIndex: 10,
    },
    stickyHeaderContainer: {
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    resultsTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
    },
    resultsContainer: {
        flex: 1,
    },
    resultsLoading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    resultsList: {
        paddingHorizontal: 2,
        paddingBottom: 100,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    viewToggleContainer: {
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
    repoChips: {
        marginTop: 4,
    },
    repoChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        marginRight: 8,
    },
    emptyViewContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    emptyStatusHeader: {
        marginBottom: 32,
    },
    searchTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        marginBottom: 12,
    },
    emptySub: {
        fontSize: 15,
        lineHeight: 22,
    },
    illustrationCard: {
        height: 360,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        marginBottom: 40,
    },
    illustrationIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 24,
    },
    illustrationText: {
        marginBottom: 24,
    },
    emptyButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    emptyPrimaryBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    emptySecondaryBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
    },
    bentoGridResults: {
        flexDirection: 'row',
        height: 380,
    },
    bentoLargeItem: {
        flex: 1.5,
        borderRadius: 32,
        overflow: 'hidden',
        marginRight: 16,
    },
    bentoGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: 'rgba(23, 28, 60, 0.6)',
    },
    editorTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 8,
    },
    bentoStackResults: {
        flex: 1,
    },
    bentoSmallResultItem: {
        flex: 1,
        borderRadius: 24,
        padding: 12,
    },
    bentoSmallThumb: {
        width: '100%',
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#eee',
    },
    bentoSmallInfo: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
});
