import { Content, FetchData, processData, processDataList, Repo, SnackBarData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Animated as RNAnimated, ScrollView, StyleSheet, View, Text, ImageBackground, RefreshControl, Image, TouchableOpacity, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Snackbar, useTheme, MD3Theme, FAB, IconButton } from "react-native-paper";
import { BlurView } from "expo-blur";
import Reanimated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    interpolate, 
    Extrapolate, 
    runOnJS,
    FadeInDown,
    FadeOutUp,
    SharedValue,
    withTiming
} from "react-native-reanimated";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { allDownloadsStore } from "../downloads/utils";
import ExportDialog from "../exports/_layout";
import { ChapterCard } from "./chapterCard";
import { exportChapters } from "../exports/exportUtils";
import { Tab, TabBar } from "../components/tabs";
import { AppBar } from "../components/appbar";
import { ChapterTracker, chapterTrackerStore, getOrCreateNovelTrackerStore, inverseFavoriteTracker, noveFavoriteStore, NovelTracker, saveNovelTracker } from "../favorites/tracker";
import { errorPlaceholder } from "../placeholders";
import { httpGet } from "../storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChaptersLoadingView } from "./skeletons";

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 400;
const PAGE_SIZE = 100;

function getBoundStoreContent<T>(store: any): T | undefined {
    if (!store) {
        return undefined;
    }
    if (typeof store.getState === 'function') {
        return store.getState().content as T;
    }
    return store.content as T | undefined;
}

function normalizeNovelTitle(title?: string): string {
    return (title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export async function fetchContentChapters(repo: Repo, content: Content, cached: boolean): Promise<Content> {
    try {
        const url = repo.repoUrl + repo.homeSelector.path.replace('[bookId]', content.bookId);
        return await httpGet<Content>(url, {
            cached,
            onCache: (data) => {
                if (!data.latestChapter) {
                    return false;
                }

                if (repo.homeSelector.tagsSelector) {
                    return Array.isArray(data.tags);
                }

                return true;
            },
            onResponse: async (response) => {
                const html = await response.text();
                const dom = IDOMParser.parse(html).documentElement;
                const latestChapter = parseInt(processData(dom, repo.homeSelector.latestChapterSelector).trim());
                const summary = processData(dom, repo.homeSelector.summarySelector);
                const author = processData(dom, repo.homeSelector.authorSelector);
                const tags = processDataList(dom, repo.homeSelector.tagsSelector);
                return { ...content, latestChapter, summary, author, tags };
            }
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const useContentStore = create((set) => ({
    content: { isLoading: true } as FetchData<Content>,
    setContent: (content: FetchData<Content>) => set({ content }),
    setLoading: () => set({ content: { isLoading: true } }),
}));

export default function ContentLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const _content = JSON.parse(useLocalSearchParams().content as string) as Content;
    const scrollY = useRef(new RNAnimated.Value(0)).current;
    const setContent = useContentStore((state: any) => state.setContent);
    const contentData: FetchData<Content> = useContentStore((state: any) => state.content);
    const setLoading = useContentStore((state: any) => state.setLoading);
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const setDownloads = allDownloadsStore((state: any) => state.setDownloads);
    const content = contentData.data;
    const [exportsVisible, setExportsVisible] = useState(false);
    const [exportState, setExportState] = useState({ isExporting: false, completed: 0, total: 0 });
    const [snackBarData, setSnackBarData] = useState<SnackBarData>({ visible: false });
    const theme = useTheme();
    const tabLength = Math.ceil((content?.latestChapter ?? 1) / PAGE_SIZE);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);
    const setAllNovelTracker = noveFavoriteStore((state: any) => state.setContent);
    const allChapterTrackerStore = chapterTrackerStore((state: any) => state.content);
    const novelTrackerStore = getOrCreateNovelTrackerStore({
        repo,
        content: _content,
        allTrackers: allNovelTrackerStore,
        setAllTrackers: setAllNovelTracker,
    });
    const novelTracker = novelTrackerStore((state: any) => state.content) as NovelTracker;
    const setNovelTracker = novelTrackerStore((state: any) => state.setContent);
    const continueReadingTracker = useMemo(() => {
        if (!(allChapterTrackerStore instanceof Map)) {
            return undefined;
        }

        const normalizedContentTitle = normalizeNovelTitle(content?.title || _content.title);
        const trackers = Array.from(allChapterTrackerStore.values())
            .map((trackerStore) => getBoundStoreContent<ChapterTracker>(trackerStore))
            .filter((tracker): tracker is ChapterTracker => {
                if (!tracker || tracker.repo.id !== repo.id) {
                    return false;
                }

                const sameBookId = tracker.novel.bookId === _content.bookId || tracker.novel.bookId === content?.bookId;
                const sameTitle = normalizedContentTitle.length > 0 &&
                    normalizeNovelTitle(tracker.novel.title) === normalizedContentTitle;

                return (sameBookId || sameTitle) &&
                    (tracker.status === 'reading' || tracker.status === 'read' || tracker.chapterProgress > 0);
            })
            .sort((left, right) => right.lastRead - left.lastRead);

        return trackers[0];
    }, [allChapterTrackerStore, content?.bookId, content?.title, repo.id, _content.bookId, _content.title]);
    const resumeChapterId = continueReadingTracker?.chapterId || "1";
    const shouldContinueReading = Boolean(continueReadingTracker);

    const handleExportRequest = useCallback(
        async (range: [number, number], format: "epub" | "pdf") => {
            if (!content) {
                return;
            }

            const total = range[1] - range[0] + 1;
            setExportState({ isExporting: true, completed: 0, total });

            let shouldClose = false;
            try {
                await exportChapters(range, format, repo, content, downloads, setDownloads, setSnackBarData, {
                    onProgress: (completed, totalCount) => {
                        setExportState((prev) => ({
                            ...prev,
                            completed,
                            total: totalCount,
                        }));
                    },
                });
                shouldClose = true;
            } catch (error) {
                console.error(error);
                setSnackBarData({
                    visible: true,
                    severity: "error",
                    message: error instanceof Error ? error.message : "Failed to export chapters.",
                });
            } finally {
                setExportState({ isExporting: false, completed: 0, total: 0 });
                if (shouldClose) {
                    setExportsVisible(false);
                }
            }
        },
        [content, downloads, repo, setDownloads, setSnackBarData, setExportsVisible, setExportState]
    );

    function handleContentFetch(cached = false) {
        setLoading();
        fetchContentChapters(repo, _content, cached)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }
    useEffect(() => {
        handleContentFetch(true);
    }, []);

    useEffect(() => {
        if (!content?.latestChapter || !novelTracker.favorite) {
            return;
        }

        const existingTags = novelTracker.novel.tags ?? [];
        const nextTags = content.tags ?? [];
        const tagsChanged = existingTags.length !== nextTags.length ||
            existingTags.some((tag, index) => tag !== nextTags[index]);
        const metadataChanged =
            novelTracker.novel.latestChapter !== content.latestChapter ||
            novelTracker.novel.summary !== content.summary ||
            novelTracker.novel.author !== content.author ||
            tagsChanged;

        if (!metadataChanged) {
            return;
        }

        const updatedNovelTracker: NovelTracker = {
            ...novelTracker,
            novel: {
                ...novelTracker.novel,
                ...content,
                latestChapter: content.latestChapter,
            },
            updated: Date.now(),
        };

        setNovelTracker(updatedNovelTracker);
        saveNovelTracker(updatedNovelTracker).catch((error) => {
            console.warn(`Failed to sync chapter count for ${content.title}:`, error);
        });
    }, [content, novelTracker, setNovelTracker]);

    const [activeTab, setActiveTab] = useState<'synopsis' | 'chapters'>('synopsis');
    const [isTabTransitioning, setIsTabTransitioning] = useState(false);
    const [selectedVolumeIndex, setSelectedVolumeIndex] = useState(0);
    const tabProgress = useSharedValue(0);

    const handleTabChange = (tab: 'synopsis' | 'chapters') => {
        if (tab === activeTab) return;
        
        tabProgress.value = withTiming(tab === 'chapters' ? 1 : 0, { duration: 250 });
        
        if (tab === 'chapters') {
            setIsTabTransitioning(true);
            setActiveTab(tab);
            setTimeout(() => {
                setIsTabTransitioning(false);
            }, 600);
        } else {
            setActiveTab(tab);
        }
    };

    const volumes = useMemo(() => {
        if (!content?.latestChapter) return [];
        return Array.from({ length: Math.ceil(content.latestChapter / PAGE_SIZE) }).map((_, i) => {
            const start = i * PAGE_SIZE + 1;
            const end = Math.min((i + 1) * PAGE_SIZE, content.latestChapter!);
            return { label: `${start} - ${end}`, start, end };
        });
    }, [content?.latestChapter]);

    const hasDataLoaded = !contentData.isLoading && contentData.data;

    if (contentData.isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (contentData.error || contentData.data === undefined) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {errorPlaceholder({ onRetry: handleContentFetch })}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            {/* Custom Frosted Header */}
            <Header scrollY={scrollY} title={_content.title} onExport={() => setExportsVisible(true)} />

            <RNAnimated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100 }}
                scrollEventThrottle={16}
                onScroll={RNAnimated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => handleContentFetch()} />}
            >
                {/* Hero Section */}
                <NovelHero content={content!} tabProgress={tabProgress} />

                {/* Tab Navigation */}
                <View style={styles.tabNav}>
                    <TouchableOpacity
                        onPress={() => handleTabChange('synopsis')}
                        style={[styles.tabButton, activeTab === 'synopsis' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]]}
                    >
                        <Text style={[styles.tabButtonText, { color: theme.colors.onSurfaceVariant }, activeTab === 'synopsis' && [styles.activeTabButtonText, { color: theme.colors.primary }]]}>SYNOPSIS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleTabChange('chapters')}
                        style={[styles.tabButton, activeTab === 'chapters' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]]}
                    >
                        <Text style={[styles.tabButtonText, { color: theme.colors.onSurfaceVariant }, activeTab === 'chapters' && [styles.activeTabButtonText, { color: theme.colors.primary }]]}>CHAPTERS</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'synopsis' ? (
                    <View key="synopsis">
                        <SynopsisTab content={content!} />
                    </View>
                ) : (
                    isTabTransitioning ? (
                        <View key="loading">
                            <ChaptersLoadingView />
                        </View>
                    ) : (
                        <View key="chapters">
                            <ChaptersTab
                                repo={repo}
                                content={content!}
                                volumes={volumes}
                                selectedIndex={selectedVolumeIndex}
                                onVolumePress={setSelectedVolumeIndex}
                            />
                        </View>
                    )
                )}
            </RNAnimated.ScrollView>

            {/* Sticky Action Bar */}
            <BottomActionBar
                isFavorite={novelTracker.favorite}
                onFavoritePress={() => {
                    if (content === undefined) return;
                    inverseFavoriteTracker({
                        repo,
                        content,
                        allNovelTrackerStore,
                        setAllNovelTracker,
                        novelTracker,
                        setNovelTracker,
                    });
                }}
                onReadPress={() => {
                    router.push({
                        pathname: '/chapters' as any,
                        params: {
                            props: JSON.stringify({
                                focusedMode: false,
                                id: resumeChapterId,
                                content,
                                repo,
                                enableNextPrev: true,
                                continueReading: shouldContinueReading,
                                data: ''
                            }),
                        }
                    });
                }}
                readLabel={shouldContinueReading ? 'Continue Reading' : 'Start Reading'}
            />

            <ExportDialog
                visible={exportsVisible}
                onDismiss={() => {
                    if (!exportState.isExporting) {
                        setExportsVisible(false);
                    }
                }}
                maxChapters={contentData.data?.latestChapter ?? 1}
                isExporting={exportState.isExporting}
                progress={exportState.isExporting ? exportState : undefined}
                onExport={handleExportRequest}
            />
            <ShowSnackbar />
        </SafeAreaView>
    );

    function ShowSnackbar() {
        return (
            <Snackbar
                visible={snackBarData.visible}
                onDismiss={() => setSnackBarData({ visible: false })}
                action={snackBarData.action}>
                {snackBarData.message}
            </Snackbar>
        );
    }
}

// Sub-components

const Header = ({ scrollY, title, onExport }: { scrollY: RNAnimated.Value, title: string, onExport: () => void }) => {
    const theme = useTheme();
    const bgColor = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: ['rgba(0,0,0,0)', theme.colors.surface + 'e6'], // 0.9 opacity
        extrapolate: 'clamp',
    });

    const titleOpacity = scrollY.interpolate({
        inputRange: [150, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <RNAnimated.View style={[styles.headerFixed, { backgroundColor: bgColor }]}>
            <BlurView intensity={Platform.OS === 'ios' ? 20 : 0} style={StyleSheet.absoluteFill} tint={theme.dark ? "dark" : "light"} />
            <View style={styles.headerContent}>
                <IconButton icon="arrow-left" iconColor={theme.colors.onSurface} onPress={() => router.back()} />
                <RNAnimated.Text style={[styles.headerTitle, { opacity: titleOpacity, color: theme.colors.onSurface }]} numberOfLines={1}>
                    {title}
                </RNAnimated.Text>
                <View style={styles.headerActions}>
                    <IconButton icon="share-variant-outline" iconColor={theme.colors.onSurface} onPress={() => { }} />
                    <IconButton icon="export-variant" iconColor={theme.colors.onSurface} onPress={onExport} />
                </View>
            </View>
        </RNAnimated.View>
    );
};

const NovelHero = ({ content, tabProgress }: { content: Content, tabProgress: SharedValue<number> }) => {
    const theme = useTheme();

    const heroStyle = useAnimatedStyle(() => {
        // Essential for page layout below, but height 
        const height = interpolate(tabProgress.value, [0, 1], [520, 320], Extrapolate.CLAMP);
        return { height };
    });

    const coverStyle = useAnimatedStyle(() => {
        const scale = interpolate(tabProgress.value, [0, 1], [1, 0.625], Extrapolate.CLAMP);
        // Correcting the shift caused by scaling from center
        const translateX = interpolate(tabProgress.value, [0, 1], [0, -30], Extrapolate.CLAMP);
        const translateY = interpolate(tabProgress.value, [0, 1], [0, -45], Extrapolate.CLAMP);
        return {
            transform: [{ scale }, { translateX }, { translateY }],
            width: width * 0.4,   // Fixed base width
            height: (width * 0.4) * 1.5, // Fixed base height
        };
    });

    const detailsStyle = useAnimatedStyle(() => {
        // Tightened gutter to ~12px for a more compact and professional look
        const translateX = interpolate(tabProgress.value, [0, 1], [0, -38], Extrapolate.CLAMP);
        const translateY = interpolate(tabProgress.value, [0, 1], [0, -10], Extrapolate.CLAMP);
        return {
            flex: 1,
            marginLeft: 20, 
            transform: [{ translateX }, { translateY }],
            justifyContent: 'center',
        };
    });

    const rowStyle = useAnimatedStyle(() => {
        return {
            flexDirection: 'row',
            alignItems: 'center',
        };
    });

    const backgroundOpacity = useAnimatedStyle(() => ({
        // Ensuring the blurred background is visible in both Synopsis (0.3) and Chapters (0.4)
        opacity: interpolate(tabProgress.value, [0, 1], [0.3, 0.4], Extrapolate.CLAMP),
    }));

    const statsOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(tabProgress.value, [0, 0.4], [1, 0], Extrapolate.CLAMP),
        transform: [{ translateY: interpolate(tabProgress.value, [0, 1], [0, 10], Extrapolate.CLAMP) }],
    }));

    const authorRowOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(tabProgress.value, [0.5, 1], [0, 1], Extrapolate.CLAMP),
        transform: [{ translateY: interpolate(tabProgress.value, [0, 1], [10, 0], Extrapolate.CLAMP) }],
    }));

    const flexLayerStyle = useAnimatedStyle(() => {
        // Refined translateY for perfect vertical centering in Chapters mode
        const translateY = interpolate(tabProgress.value, [0, 1], [10, 20], Extrapolate.CLAMP);
        return {
            transform: [{ translateY }],
        };
    });

    const titleStyle = useAnimatedStyle(() => {
        const scale = interpolate(tabProgress.value, [0, 1], [1, 0.875], Extrapolate.CLAMP);
        // Correcting internal scale drift to keep the title flush with the ONGOING text
        const translateX = interpolate(tabProgress.value, [0, 1], [0, -12], Extrapolate.CLAMP);
        return {
            transform: [{ scale }, { translateX }],
        };
    });

    return (
        <Reanimated.View style={[styles.heroContainer, heroStyle]}>
            <Reanimated.Image source={{ uri: content.bookImage }} style={[styles.chapterHeroBackground, backgroundOpacity]} blurRadius={10} />
            <LinearGradient colors={['transparent', theme.colors.surface]} style={styles.heroGradient} />

            <Reanimated.View style={[styles.glow, { backgroundColor: theme.colors.secondaryContainer }, statsOpacity]} />

            <Reanimated.View style={[styles.heroFlexLayer, flexLayerStyle]}>
                <Reanimated.View style={[styles.heroMainRow, rowStyle]}>
                    <Reanimated.View style={[styles.heroCoverShadow, coverStyle]}>
                        <View style={styles.heroCoverContainer}>
                            <Image source={{ uri: content.bookImage }} style={styles.heroCover} resizeMode="cover" />
                        </View>
                    </Reanimated.View>

                    <Reanimated.View style={[styles.heroDynamicDetails, detailsStyle]}>
                        <Text style={[styles.heroStatus, { color: theme.colors.onSurfaceVariant }]}>ONGOING</Text>
                        <Reanimated.Text style={[styles.heroTitle, { color: theme.colors.primary }, titleStyle]}>{content.title}</Reanimated.Text>

                        {/* Author row only visible in Chapters mode (Compact) */}
                        <Reanimated.View style={[styles.heroAuthorRow, authorRowOpacity]}>
                            <Text style={[styles.authorNameSmall, { color: theme.colors.onSurfaceVariant }]}>{content.author || 'Unknown Author'}</Text>
                        </Reanimated.View>

                        {/* Sub author only visible in Synopsis mode (Expanded) */}
                        <Reanimated.Text style={[styles.heroAuthorSub, { color: theme.colors.onSurfaceVariant, fontSize: 16 }, statsOpacity]}>
                            {content.author || 'Unknown Author'}
                        </Reanimated.Text>
                    </Reanimated.View>
                </Reanimated.View>

                {/* Stats Row only visible in Synopsis mode */}
                <Reanimated.View style={[styles.statsRow, statsOpacity]}>
                    <View style={[styles.statBox, { backgroundColor: (theme.colors as any).surfaceContainer }]}>
                        <MaterialCommunityIcons name="star" size={20} color={theme.colors.primary} />
                        <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>4.9</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>RATING</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: (theme.colors as any).surfaceContainer }]}>
                        <MaterialCommunityIcons name="eye" size={20} color={theme.colors.primary} />
                        <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>240K</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>VIEWS</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: (theme.colors as any).surfaceContainer }]}>
                        <MaterialCommunityIcons name="bookmark" size={20} color={theme.colors.primary} />
                        <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>15K</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>FOLLOWS</Text>
                    </View>
                </Reanimated.View>
            </Reanimated.View>
        </Reanimated.View>
    );
};

const SynopsisTab = ({ content }: { content: Content }) => {
    const theme = useTheme();
    const summaryText = content.summary || 'No description available for this novel.';
    const tags = content.tags || [];
    const words = summaryText.trim().split(/\s+/);
    const hasMore = words.length > 7;
    const headline = words.slice(0, 7).join(' '); // Removed ellipsis for inline continuation
    const remainingText = hasMore ? words.slice(7).join(' ') : '';

    return (
        <View style={styles.tabContent}>

            <View style={styles.synopsisContainer}>
                <Text style={[styles.synopsisText, { color: theme.colors.onSurfaceVariant }]}>
                    <Text style={[styles.synopsisHeadline, { color: theme.colors.onSurface }]}>{headline}</Text>
                    {remainingText ? ` ${remainingText}` : ''}
                </Text>
            </View>

            {tags.length > 0 && (
                <LinearGradient colors={[theme.colors.primary, theme.colors.primaryContainer]} style={styles.authorCard}>
                    <View style={styles.authorInfo}>
                        <Text style={[styles.authorNoteTitle, { color: theme.colors.onPrimary }]}>Tags</Text>
                        <View style={styles.detailTagWrap}>
                            {tags.map((tag) => (
                                <View key={tag} style={[styles.detailTagChip, { backgroundColor: theme.colors.onPrimary + '1f' }]}>
                                    <Text style={[styles.detailTagText, { color: theme.colors.onPrimary }]}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </LinearGradient>
            )}

            <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeader}>
                    <Text style={[styles.reviewsTitle, { color: theme.colors.primary }]}>Top Reviews</Text>
                    <TouchableOpacity><Text style={[styles.seeAll, { color: theme.colors.onSurfaceVariant }]}>SEE ALL</Text></TouchableOpacity>
                </View>
                <View style={[styles.reviewCard, { backgroundColor: (theme.colors as any).surfaceContainer }]}>
                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map(i => <MaterialCommunityIcons key={i} name="star" size={14} color={theme.colors.secondary} />)}
                    </View>
                    <Text style={[styles.reviewText, { color: theme.colors.onSurface }]}>"The magic system is unlike anything I've read. Absolute masterpiece."</Text>
                    <Text style={[styles.reviewer, { color: theme.colors.onSurfaceVariant }]}>— LITERARY_KNIGHT</Text>
                </View>
            </View>
        </View>
    );
};

const ChaptersTab = ({ repo, content, volumes, selectedIndex, onVolumePress }: {
    repo: Repo,
    content: Content,
    volumes: { label: string, start: number, end: number }[],
    selectedIndex: number,
    onVolumePress: (idx: number) => void
}) => {
    const theme = useTheme();
    const selectedVolume = volumes[selectedIndex] || volumes[0];
    const chapters = useMemo(() => {
        if (!selectedVolume) return [];
        const count = selectedVolume.end - selectedVolume.start + 1;
        return Array.from({ length: count }).map((_, i) => selectedVolume.start + i);
    }, [selectedVolume]);

    return (
        <View style={styles.tabContent}>
            <View style={styles.volumesHeader}>
                <Text style={[styles.volumesTitle, { color: theme.colors.primary }]}>Volumes</Text>
                <Text style={[styles.chapterCount, { color: theme.colors.onSurfaceVariant }]}>{content.latestChapter || 0} Chapters Total</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.volumeRow}>
                {volumes.map((vol, idx) => (
                    <TouchableOpacity
                        key={vol.label}
                        onPress={() => onVolumePress(idx)}
                        style={[
                            styles.volumeChip,
                            { backgroundColor: (theme.colors as any).surfaceContainerHigh },
                            selectedIndex === idx && [styles.activeVolumeChip, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]
                        ]}
                    >
                        <Text style={[
                            styles.volumeSub,
                            { color: theme.colors.onSurfaceVariant },
                            selectedIndex === idx && [styles.activeVolumeSub, { color: theme.colors.onPrimary }]
                        ]}>
                            {selectedIndex === idx ? 'CURRENT' : `VOLUME ${idx + 1}`}
                        </Text>
                        <Text style={[
                            styles.volumeLabel,
                            { color: theme.colors.onSurface },
                            selectedIndex === idx && [styles.activeVolumeLabel, { color: theme.colors.onPrimary, opacity: 1 }]
                        ]}>{vol.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.chapterList}>
                {chapters.map((id) => (
                    <ChapterCard
                        key={id}
                        props={{
                            repo,
                            content,
                            chapterId: `${id}`,
                            enableNextPrev: true,
                        }}
                    />
                ))}
            </View>
        </View>
    );
};

const BottomActionBar = ({
    isFavorite,
    onFavoritePress,
    onReadPress,
    readLabel,
}: {
    isFavorite: boolean,
    onFavoritePress: () => void,
    onReadPress: () => void,
    readLabel: string,
}) => {
    const theme = useTheme();
    return (
        <View style={styles.bottomBar}>
            <BlurView intensity={Platform.OS === 'ios' ? 30 : 0} style={StyleSheet.absoluteFill} tint={theme.dark ? "dark" : "light"} />
            <View style={styles.bottomBarContent}>
                <TouchableOpacity style={[styles.readButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} onPress={onReadPress}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={24} color={theme.colors.onPrimary} />
                    <Text style={[styles.readButtonText, { color: theme.colors.onPrimary }]}>{readLabel.toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.favoriteButton,
                        { borderColor: theme.colors.primary },
                        isFavorite && [styles.favoriteActive, { backgroundColor: theme.colors.primary }]
                    ]}
                    onPress={onFavoritePress}
                >
                    <MaterialCommunityIcons
                        name={isFavorite ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={isFavorite ? theme.colors.onPrimary : theme.colors.primary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    headerFixed: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        zIndex: 100,
        paddingTop: Platform.OS === 'android' ? 24 : 0,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 18,
        flex: 1,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
    },
    // Hero Styles
    heroContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    heroFlexLayer: {
        width: '100%',
        padding: 24,
        paddingTop: 120, // Static base padding
    },
    heroMainRow: {
        width: '100%',
    },
    heroDynamicDetails: {
        width: '100%',
    },
    authorNameSmall: {
        fontFamily: 'Manrope-Medium',
        fontSize: 14,
    },
    chapterHero: {
        height: 380,
        justifyContent: 'flex-end',
    },
    chapterHeroBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.4,
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    chapterHeroContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 24,
        paddingBottom: 32,
    },
    heroCoverShadow: {
        borderRadius: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    heroCoverContainer: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    heroCover: {
        flex: 1,
    },
    heroDetails: {
        flex: 1,
        marginLeft: 20,
        paddingBottom: 8,
    },
    heroStatus: {
        fontFamily: 'Manrope-ExtraBold',
        fontSize: 10,
        opacity: 0.6,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    heroTitle: {
        fontFamily: 'NotoSerif-Black',
        fontSize: 28,
        lineHeight: 32,
    },
    heroAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    authorAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    heroAuthor: {
        fontFamily: 'Manrope-Medium',
        fontSize: 14,
    },

    synopsisHero: {
        paddingTop: 110,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    glow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        opacity: 0.2,
    },
    synopsisHeroRow: {
        flexDirection: 'column',
    },
    heroCoverContainerSmall: {
        width: width * 0.5,
        aspectRatio: 2 / 3,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        marginBottom: 20,
    },
    synopsisHeroDetails: {
        marginBottom: 24,
    },
    heroAuthorSub: {
        fontFamily: 'Manrope-SemiBold',
        fontSize: 16,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 32,
        gap: 12,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statValue: {
        fontFamily: 'Manrope-Bold',
        fontSize: 18,
        marginTop: 4,
    },
    statLabel: {
        fontFamily: 'Manrope-ExtraBold',
        fontSize: 8,
        opacity: 0.6,
        letterSpacing: 1,
    },

    // Tab Nav
    tabNav: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginTop: 8,
    },
    tabButton: {
        paddingVertical: 16,
        marginRight: 32,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
    },
    tabButtonText: {
        fontFamily: 'Manrope-Bold',
        fontSize: 12,
        opacity: 0.5,
        letterSpacing: 1,
    },
    activeTabButtonText: {
        opacity: 1,
    },

    tabContent: {
        paddingVertical: 24,
    },

    synopsisContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    synopsisHeadline: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 22,
    },
    synopsisText: {
        fontFamily: 'Manrope-Regular',
        fontSize: 16,
        lineHeight: 26,
    },
    authorCard: {
        marginHorizontal: 24,
        padding: 24,
        borderRadius: 20,
        marginBottom: 32,
        elevation: 5,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    authorInfo: {
        flex: 1,
    },
    authorNoteTitle: {
        fontFamily: 'NotoSerif-Bold',
        fontStyle: 'italic',
        fontSize: 18,
        marginBottom: 4,
    },
    authorNoteText: {
        fontFamily: 'Manrope-Medium',
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 20,
    },
    detailTagWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    detailTagChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        marginBottom: 8,
    },
    detailTagText: {
        fontFamily: 'Manrope-Bold',
        fontSize: 12,
    },
    reviewsSection: {
        paddingHorizontal: 24,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    reviewsTitle: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 20,
    },
    seeAll: {
        fontFamily: 'Manrope-Bold',
        fontSize: 10,
        letterSpacing: 1,
    },
    reviewCard: {
        backgroundColor: 'rgba(238, 237, 240, 0.5)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
    },
    stars: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    reviewText: {
        fontFamily: 'Manrope-SemiBold',
        fontStyle: 'italic',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 8,
    },
    reviewer: {
        fontFamily: 'Manrope-ExtraBold',
        fontSize: 10,
        opacity: 0.6,
        letterSpacing: 1,
    },

    // Chapters Tab Styles
    volumesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    volumesTitle: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 20,
    },
    chapterCount: {
        fontFamily: 'Manrope-Bold',
        fontSize: 12,
        opacity: 0.7,
    },
    volumeRow: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    volumeChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginRight: 10,
        minWidth: 100,
    },
    activeVolumeChip: {
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    volumeSub: {
        fontFamily: 'Manrope-ExtraBold',
        fontSize: 8,
        opacity: 0.6,
        letterSpacing: 1,
        marginBottom: 2,
    },
    activeVolumeSub: {
        opacity: 0.6,
    },
    volumeLabel: {
        fontFamily: 'Manrope-Bold',
        fontSize: 14,
    },
    activeVolumeLabel: {
    },
    chapterList: {
        paddingHorizontal: 24,
    },

    // Bottom Bar Styles
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        paddingBottom: 24,
        paddingHorizontal: 24,
        justifyContent: 'center',
        zIndex: 1000,
    },
    bottomBarContent: {
        flexDirection: 'row',
        gap: 12,
    },
    readButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    readButtonText: {
        fontFamily: 'Manrope-ExtraBold',
        fontSize: 14,
        letterSpacing: 1,
    },
    favoriteButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoriteActive: {
    },
});
