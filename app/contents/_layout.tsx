import { Content, FetchData, processData, Repo, SnackBarData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Animated, ScrollView, StyleSheet, View, Text, ImageBackground, RefreshControl, Image, TouchableOpacity, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Snackbar, useTheme, MD3Theme, FAB, IconButton } from "react-native-paper";
import { BlurView } from "expo-blur";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { allDownloadsStore } from "../downloads/utils";
import ExportDialog from "../exports/_layout";
import { ChapterCard } from "./chapterCard";
import { exportChapters } from "../exports/exportUtils";
import { Tab, TabBar } from "../components/tabs";
import { AppBar } from "../components/appbar";
import { getOrCreateNovelTrackerStore, inverseFavoriteTracker, noveFavoriteStore, NovelTracker, saveNovelTracker } from "../favorites/tracker";
import { errorPlaceholder } from "../placeholders";
import { httpGet } from "../storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 400;
const PAGE_SIZE = 100;

export async function fetchContentChapters(repo: Repo, content: Content, cached: boolean): Promise<Content> {
    try {
        const url = repo.repoUrl + repo.homeSelector.path.replace('[bookId]', content.bookId);
        return await httpGet<Content>(url, {
            cached,
            onCache: (data) => !!data.latestChapter,
            onResponse: async (response) => {
                const html = await response.text();
                const dom = IDOMParser.parse(html).documentElement;
                const latestChapter = parseInt(processData(dom, repo.homeSelector.latestChapterSelector).trim());
                const summary = processData(dom, repo.homeSelector.summarySelector);
                const author = processData(dom, repo.homeSelector.authorSelector);
                return { ...content, latestChapter, summary, author };
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
    const scrollY = useRef(new Animated.Value(0)).current;
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
    const novelTrackerStore = getOrCreateNovelTrackerStore({
        repo,
        content: _content,
        allTrackers: allNovelTrackerStore,
        setAllTrackers: setAllNovelTracker,
    });
    const novelTracker = novelTrackerStore((state: any) => state.content) as NovelTracker;
    const setNovelTracker = novelTrackerStore((state: any) => state.setContent);

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

        if (novelTracker.novel.latestChapter === content.latestChapter) {
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
    const [selectedVolumeIndex, setSelectedVolumeIndex] = useState(0);

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

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100 }}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => handleContentFetch()} />}
            >
                {/* Hero Section */}
                <NovelHero content={content!} activeTab={activeTab} />

                {/* Tab Navigation */}
                <View style={styles.tabNav}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('synopsis')}
                        style={[styles.tabButton, activeTab === 'synopsis' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]]}
                    >
                        <Text style={[styles.tabButtonText, { color: theme.colors.onSurfaceVariant }, activeTab === 'synopsis' && [styles.activeTabButtonText, { color: theme.colors.primary }]]}>SYNOPSIS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('chapters')}
                        style={[styles.tabButton, activeTab === 'chapters' && [styles.activeTabButton, { borderBottomColor: theme.colors.primary }]]}
                    >
                        <Text style={[styles.tabButtonText, { color: theme.colors.onSurfaceVariant }, activeTab === 'chapters' && [styles.activeTabButtonText, { color: theme.colors.primary }]]}>CHAPTERS</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'synopsis' ? (
                    <SynopsisTab content={content!} />
                ) : (
                    <ChaptersTab
                        repo={repo}
                        content={content!}
                        volumes={volumes}
                        selectedIndex={selectedVolumeIndex}
                        onVolumePress={setSelectedVolumeIndex}
                    />
                )}
            </Animated.ScrollView>

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
                    // Navigate to first chapter or last read
                    const firstChapterId = "1";
                    router.push({
                        pathname: '/chapters' as any,
                        params: {
                            props: JSON.stringify({
                                focusedMode: false,
                                id: firstChapterId,
                                content,
                                repo,
                                enableNextPrev: true,
                                data: ''
                            }),
                        }
                    });
                }}
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

const Header = ({ scrollY, title, onExport }: { scrollY: Animated.Value, title: string, onExport: () => void }) => {
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
        <Animated.View style={[styles.headerFixed, { backgroundColor: bgColor }]}>
            <BlurView intensity={Platform.OS === 'ios' ? 20 : 0} style={StyleSheet.absoluteFill} tint={theme.dark ? "dark" : "light"} />
            <View style={styles.headerContent}>
                <IconButton icon="arrow-left" iconColor={theme.colors.onSurface} onPress={() => router.back()} />
                <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity, color: theme.colors.onSurface }]} numberOfLines={1}>
                    {title}
                </Animated.Text>
                <View style={styles.headerActions}>
                    <IconButton icon="share-variant-outline" iconColor={theme.colors.onSurface} onPress={() => { }} />
                    <IconButton icon="export-variant" iconColor={theme.colors.onSurface} onPress={onExport} />
                </View>
            </View>
        </Animated.View>
    );
};

const NovelHero = ({ content, activeTab }: { content: Content, activeTab: string }) => {
    const theme = useTheme();
    if (activeTab === 'chapters') {
        return (
            <View style={styles.chapterHero}>
                <Image source={{ uri: content.bookImage }} style={styles.chapterHeroBackground} blurRadius={10} />
                <LinearGradient colors={['transparent', theme.colors.surface]} style={styles.heroGradient} />
                <View style={styles.chapterHeroContent}>
                    <View style={styles.heroCoverShadow}>
                        <View style={styles.heroCoverContainer}>
                            <Image
                                source={{ uri: content.bookImage }}
                                style={styles.heroCover}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                    <View style={styles.heroDetails}>
                        <Text style={[styles.heroStatus, { color: theme.colors.onSurfaceVariant }]}>DARK FANTASY • ONGOING</Text>
                        <Text style={[styles.heroTitle, { color: theme.colors.primary }]}>{content.title}</Text>
                        <View style={styles.heroAuthorRow}>
                            <View style={[styles.authorAvatar, { backgroundColor: theme.colors.secondaryContainer }]} />
                            <Text style={[styles.heroAuthor, { color: theme.colors.onSurfaceVariant }]}>{content.author || 'Unknown Author'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.synopsisHero}>
            <View style={[styles.glow, { backgroundColor: theme.colors.secondaryContainer }]} />
            <View style={styles.synopsisHeroRow}>
                <View style={styles.heroCoverContainerSmall}>
                    <Image source={{ uri: content.bookImage }} style={styles.heroCover} resizeMode="cover" />
                </View>
                <View style={styles.synopsisHeroDetails}>
                    <Text style={[styles.heroStatus, { color: theme.colors.onSurfaceVariant }]}>ONGOING SERIES</Text>
                    <Text style={[styles.heroTitle, { fontSize: 32, color: theme.colors.primary }]}>{content.title}</Text>
                    <Text style={[styles.heroAuthorSub, { color: theme.colors.onSurfaceVariant }]}>{content.author || 'Unknown Author'} • 1.2M Words</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
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
            </View>
        </View>
    );
};

const SynopsisTab = ({ content }: { content: Content }) => {
    const theme = useTheme();
    return (
        <View style={styles.tabContent}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreRow}>
                {['Dark Fantasy', 'Mystery', 'Psychological', 'Magic System'].map((genre) => (
                    <View key={genre} style={[styles.genreTag, { backgroundColor: theme.colors.secondaryContainer }]}>
                        <Text style={[styles.genreText, { color: theme.colors.onSecondaryContainer }]}>{genre}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.synopsisContainer}>
                <Text style={[styles.synopsisHeadline, { color: theme.colors.onSurface }]}>A tapestry of fate woven in blood.</Text>
                <Text style={[styles.synopsisText, { color: theme.colors.onSurfaceVariant }]}>
                    {content.summary || 'No description available for this novel.'}
                </Text>
            </View>

            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryContainer]} style={styles.authorCard}>
                <View style={[styles.authorPortrait, { backgroundColor: theme.colors.onPrimary + '33' }]} />
                <View style={styles.authorInfo}>
                    <Text style={[styles.authorNoteTitle, { color: theme.colors.onPrimary }]}>A Note from The Author</Text>
                    <Text style={[styles.authorNoteText, { color: theme.colors.onPrimary + 'b3' }]}>
                        "This story is for those who find beauty in the dark corners of the world. Silas is a complex character, and Oakhaven is a city built on secrets."
                    </Text>
                </View>
            </LinearGradient>

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

const BottomActionBar = ({ isFavorite, onFavoritePress, onReadPress }: { isFavorite: boolean, onFavoritePress: () => void, onReadPress: () => void }) => {
    const theme = useTheme();
    return (
        <View style={styles.bottomBar}>
            <BlurView intensity={Platform.OS === 'ios' ? 30 : 0} style={StyleSheet.absoluteFill} tint={theme.dark ? "dark" : "light"} />
            <View style={styles.bottomBarContent}>
                <TouchableOpacity style={[styles.readButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} onPress={onReadPress}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={24} color={theme.colors.onPrimary} />
                    <Text style={[styles.readButtonText, { color: theme.colors.onPrimary }]}>START READING</Text>
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
        width: 120,
        height: 180,
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
        fontSize: 14,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 4,
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

    // Synopsis Tab Styles
    genreRow: {
        paddingLeft: 24,
        marginBottom: 24,
    },
    genreTag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    genreText: {
        fontFamily: 'Manrope-Bold',
        fontSize: 12,
    },
    synopsisContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    synopsisHeadline: {
        fontFamily: 'NotoSerif-Bold',
        fontSize: 22,
        marginBottom: 16,
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        elevation: 5,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    authorPortrait: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginRight: 16,
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
