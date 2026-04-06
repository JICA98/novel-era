import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, FlatList, Dimensions, Platform, ActivityIndicator, RefreshControl, Modal, Pressable, LayoutAnimation } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { AtelierText } from '@/components/AtelierText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
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
import { getChaptersForNovel, NovelReadingStatus } from './favorites/tracker';

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
    const router = useRouter();

    const systemColorScheme = useColorScheme();
    const colorScheme = (systemColorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    const themeColors = Colors[colorScheme];

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

    const fetchDiscovery = async () => {
        setDiscoveryData({ isLoading: true });
        try {
            const data = await fetchContentList({ repo: selectedRepo, cached: false });
            setDiscoveryData({ data, isLoading: false });
        } catch (error) {
            setDiscoveryData({ error, isLoading: false });
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
        searchScale.value = withSpring(0.96, { damping: 15, stiffness: 200 }, () => {
            searchScale.value = withSpring(1, { damping: 15, stiffness: 200 });
        });
    };

    const discoveryView = useMemo(() => {
        const trending = discoveryData.data?.slice(0, 6) ?? [];
        const curated = discoveryData.data?.slice(6, 9) ?? [];
        const fresh = discoveryData.data?.slice(9, 14) ?? [];

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
                <Animated.View sharedTransitionTag="searchBar" style={searchAnimatedStyle}>
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

                {/* Genre Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                    {['All Works', 'Action', 'Fantasy', 'Romance', 'Sci-Fi', 'Mystery'].map((genre, i) => (
                        <TouchableOpacity 
                            key={genre} 
                            style={[
                                styles.genreChip, 
                                i === 0 ? { backgroundColor: themeColors.primary } : { backgroundColor: themeColors.secondaryContainer }
                            ]}
                        >
                            <AtelierText 
                                variant="label" 
                                bold 
                                color={i === 0 ? themeColors.onPrimary : themeColors.onSecondaryContainer}
                            >
                                {genre}
                            </AtelierText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Trending Now */}
                {trending.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <AtelierText variant="title" bold>Trending Now</AtelierText>
                            <TouchableOpacity onPress={() => handleSearchSubmit('')}><AtelierText variant="label" bold color={themeColors.primary}>VIEW ALL</AtelierText></TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
                            {trending.map((item, i) => (
                                <TouchableOpacity key={i} style={styles.trendingCard} onPress={() => navigateToBook(item)}>
                                    <Image source={{ uri: item.bookImage }} style={styles.trendingImage} />
                                    <View style={styles.cardInfo}>
                                        <AtelierText variant="subtitle" bold numberOfLines={1}>{item.title}</AtelierText>
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
                                <TouchableOpacity style={[styles.bentoCardLarge, { backgroundColor: themeColors.primaryContainer }]} onPress={() => curated[0] && navigateToBook(curated[0])}>
                                    <Image source={{ uri: curated[0]?.bookImage }} style={styles.bentoImage} />
                                    <View style={styles.bentoOverlay}>
                                        <AtelierText variant="caption" bold color={themeColors.primary + 'AA'} style={styles.bentoTag}>EDITOR\'S PICK</AtelierText>
                                        <AtelierText variant="subtitle" bold color="#fff" numberOfLines={2}>{curated[0]?.title}</AtelierText>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.bentoRight}>
                                <TouchableOpacity style={[styles.bentoCardSmall, { backgroundColor: themeColors.secondaryContainer }]} onPress={() => curated[1] && navigateToBook(curated[1])}>
                                    <Image source={{ uri: curated[1]?.bookImage }} style={styles.bentoImage} />
                                    <View style={styles.bentoOverlay}>
                                        <AtelierText variant="label" bold color="#fff" numberOfLines={1}>{curated[1]?.title || 'Fantasy Escapes'}</AtelierText>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.bentoCardSmall, { backgroundColor: themeColors.primaryContainer, marginTop: 12 }]} onPress={() => curated[2] && navigateToBook(curated[2])}>
                                    <Image source={{ uri: curated[2]?.bookImage }} style={styles.bentoImage} />
                                    <View style={styles.bentoOverlay}>
                                        <AtelierText variant="label" bold color="#fff" numberOfLines={1}>{curated[2]?.title || 'New Frontiers'}</AtelierText>
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
                            <TouchableOpacity key={i} style={[styles.arrivalItem, { backgroundColor: themeColors.surfaceContainerLow }]} onPress={() => navigateToBook(item)}>
                                <Image source={{ uri: item.bookImage }} style={styles.arrivalImage} />
                                <View style={styles.arrivalInfo}>
                                    <AtelierText variant="subtitle" bold numberOfLines={1}>{item.title}</AtelierText>
                                    <AtelierText variant="caption" color={themeColors.onSurfaceVariant}>{selectedRepo.name}</AtelierText>
                                    <View style={styles.arrivalMeta}>
                                        <View style={[styles.tag, { backgroundColor: themeColors.surfaceContainerHighest }]}>
                                            <AtelierText variant="caption" bold color={themeColors.onSurfaceVariant}>CHAPTER {item.latestChapter || '1'}</AtelierText>
                                        </View>
                                        {item.rating && (
                                            <View style={styles.ratingRow}>
                                                <MaterialIcons name="star" size={12} color={themeColors.primary} />
                                                <AtelierText variant="caption" bold> {item.rating}</AtelierText>
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
    }, [discoveryData, themeColors, selectedRepo, searchAnimatedStyle]);

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

        {/* Suggested Tags */}
        <AtelierText variant="subtitle" bold color={themeColors.primary} style={styles.sectionTitle}>Suggested Tags</AtelierText>
        <View style={styles.tagGrid}>
            {['Overpowered MC', 'Isekai', 'Slow Burn', 'System', 'Historical Romance', 'Grimdark', 'Cultivation'].map(tag => (
                <TouchableOpacity key={tag} style={[styles.tagChip, { backgroundColor: themeColors.secondaryContainer }]} onPress={() => handleSearchSubmit(tag)}>
                    <AtelierText variant="label" bold color={themeColors.onSecondaryContainer}>{tag}</AtelierText>
                </TouchableOpacity>
            ))}
        </View>

        {/* Bento Style Recommendation */}
        <View style={[styles.promoCard, { backgroundColor: themeColors.primary }]}>
            <AtelierText variant="caption" bold color={themeColors.onPrimary + '88'}>CURATED RECOMMENDATION</AtelierText>
            <AtelierText variant="title" color={themeColors.onPrimary} italic style={styles.promoTitle}>Discover: Shadows of the Atelier</AtelierText>
            <TouchableOpacity style={styles.promoButton}>
                <AtelierText variant="label" bold color={themeColors.primary}>Explore Series</AtelierText>
            </TouchableOpacity>
        </View>
        </ScrollView>
    ), [themeColors, recentSearches, handleSearchSubmit, clearRecent, removeRecent]);

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
                entering={FadeInDown.delay(200).duration(400)}
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
                        repos={repos}
                        setSelectedRepository={setSelectedRepository}
                        setPreferredRepository={setPreferredRepository}
                        emptyComponent={React.createElement(feedbackView, { type: 'empty' })}
                        errorComponent={({ onRetry }) => React.createElement(feedbackView, { type: 'error', onRetry })}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

interface EnrichedContent {
    content: Content;
    readingStatus?: NovelReadingStatus;
}

interface SearchResultsViewProps {
    repo: Repo;
    searchQuery: string;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    repos: Repo[];
    setSelectedRepository: (id: string) => void;
    setPreferredRepository: (id: string) => void;
    emptyComponent: React.ReactElement;
    errorComponent: React.ReactElement<{ onRetry: () => void }>;
}

function SearchResultsView({
    repo,
    searchQuery,
    showFilters,
    setShowFilters,
    repos,
    setSelectedRepository,
    setPreferredRepository,
    emptyComponent,
    errorComponent,
}: SearchResultsViewProps) {
    const [content, setContent] = useState<FetchData<Content[]>>({ isLoading: true });
    const [enrichedResults, setEnrichedResults] = useState<EnrichedContent[]>([]);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];

    const fetchContent = async ({ cached }: { cached: boolean }) => {
        setContent({ isLoading: true });
        try {
            const data = await fetchContentList({ repo, searchQuery, cached });
            setContent({ data, isLoading: false });

            // Enrich with reading status - query chapter trackers directly
            const enriched = await Promise.all(
                data.map(async (item) => {
                    // Get chapter trackers for this novel
                    const chapterTrackers = await getChaptersForNovel(repo.id, item.bookId);
                    
                    let readingStatus: NovelReadingStatus | undefined;
                    
                    if (chapterTrackers.length > 0) {
                        // Calculate reading status from trackers
                        const hasReading = chapterTrackers.some(c => c.status === 'reading');
                        const allRead = chapterTrackers.every(c => c.status === 'read');
                        const completedChapters = chapterTrackers.filter(c => c.chapterProgress >= 1 || c.status === 'read').length;
                        const readingChapter = chapterTrackers.find(c => c.chapterProgress > 0 && c.chapterProgress < 1);
                        const partialProgress = readingChapter ? readingChapter.chapterProgress : 0;
                        
                        const totalChapters = item.latestChapter || chapterTrackers.length;
                        const overallProgress = totalChapters > 0 ? (completedChapters + partialProgress) / totalChapters : 0;
                        
                        const lastReadChapter = chapterTrackers.reduce((latest, current) =>
                            current.lastRead > latest.lastRead ? current : latest
                        , chapterTrackers[0]);
                        
                        let status: NovelReadingStatus['status'];
                        if (completedChapters >= totalChapters) {
                            status = 'Completed';
                        } else if (hasReading || completedChapters > 0) {
                            status = 'Reading';
                        } else {
                            status = 'Plan to Read';
                        }
                        
                        readingStatus = {
                            status,
                            progress: overallProgress,
                            lastChapterRead: lastReadChapter.chapterId,
                            lastReadTimestamp: lastReadChapter.lastRead,
                            totalChaptersTracked: chapterTrackers.length,
                        };
                    }
                    
                    return {
                        content: item,
                        readingStatus,
                    };
                })
            );
            setEnrichedResults(enriched);
        } catch (error) {
            setContent({ error, isLoading: false });
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
        if (item.type === 'sticky-header') {
            return (
                <View style={[styles.stickyHeader, { backgroundColor: themeColors.background }]}>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.filterBtn, { backgroundColor: showFilters ? themeColors.secondary : themeColors.primary }]}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <MaterialIcons
                                name={showFilters ? "close" : "tune"}
                                size={20}
                                color={showFilters ? themeColors.onSecondary : themeColors.onPrimary}
                            />
                            <AtelierText variant="label" bold color={showFilters ? themeColors.onSecondary : themeColors.onPrimary} style={{ marginLeft: 8 }}>
                                {showFilters ? "Hide" : "Filter"}
                            </AtelierText>
                        </TouchableOpacity>
                        <View style={[styles.viewToggleContainer, { backgroundColor: themeColors.surfaceContainer }]}>
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
                                        style={[styles.repoChip, { backgroundColor: isSelected ? themeColors.primary : themeColors.surfaceContainerHigh }]}
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
            );
        }

        if (item.type === 'row') {
            return (
                <View style={styles.gridRow}>
                    {item.items.map((res: any, i: number) => {
                        const result = res.data;
                        const commonProps = {
                            item: result.content,
                            repo,
                            status: result.readingStatus?.status || 'Plan to Read',
                            progress: result.readingStatus?.progress || 0,
                            totalChapters: result.content.latestChapter || result.readingStatus?.totalChaptersTracked || undefined,
                            lastReadTimestamp: result.readingStatus?.lastReadTimestamp,
                        };
                        return (
                            <Animated.View
                                key={result.content.bookId}
                                layout={LinearTransition.springify()}
                                entering={FadeInDown.delay((index - 1) * 50 + i * 50)}
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
            status: result.readingStatus?.status || 'Plan to Read',
            progress: result.readingStatus?.progress || 0,
            totalChapters: result.content.latestChapter || result.readingStatus?.totalChaptersTracked || undefined,
            lastReadTimestamp: result.readingStatus?.lastReadTimestamp,
        };

        return (
            <Animated.View
                layout={LinearTransition.springify()}
                entering={FadeInDown.delay((index - 1) * 50)}
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

    const ListHeaderComp = (
        <View style={styles.resultsTitleContainer}>
            <AtelierText variant="headline" bold color={themeColors.primary} style={{ fontSize: 36 }}>
                Results for '{searchQuery}'
            </AtelierText>
            <AtelierText variant="subtitle" color={themeColors.onSurfaceVariant}>
                {content.data?.length || 0} volume{(content.data?.length || 0) !== 1 ? 's' : ''} found
            </AtelierText>
        </View>
    );

    const data = useMemo(() => {
        if (content.isLoading || content.error || !content.data || content.data.length === 0) {
            return [];
        }
        
        const results = enrichedResults.map(item => ({ type: 'result', data: item }));
        
        if (viewType === 'grid') {
            const rows: any[] = [];
            for (let i = 0; i < results.length; i += 2) {
                rows.push({
                    type: 'row',
                    items: results.slice(i, i + 2)
                });
            }
            return [{ type: 'sticky-header' }, ...rows];
        }
        
        return [
            { type: 'sticky-header' },
            ...results
        ];
    }, [enrichedResults, content.isLoading, content.error, content.data, viewType]);

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
                {errorComponent}
            </View>
        );
    }

    if (content.data.length === 0) {
        return (
            <View style={styles.resultsContainer}>
                {emptyComponent}
            </View>
        );
    }

    return (
        <View style={styles.resultsContainer}>
            <FlatList
                data={data}
                renderItem={renderListElement}
    keyExtractor={(item, index) => {
        if (item.type === 'sticky-header') return 'sticky';
        if (item.type === 'row') return `row-${index}`;
        return item.data.content.bookId;
    }}
                numColumns={1}
                key={viewType}
                stickyHeaderIndices={[0]}
                contentContainerStyle={styles.resultsList}
                ListHeaderComponent={ListHeaderComp}
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
    genreScroll: {
        marginTop: 24,
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    genreChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
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
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
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
    stickyHeader: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
        zIndex: 10,
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
