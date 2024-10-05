import { Content, FetchData, processData, Repo, SnackBarData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground, RefreshControl } from "react-native";
import { ActivityIndicator, Button, Title, Snackbar, useTheme, MD3Theme, SegmentedButtons } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { allDownloadsStore } from "../downloads/utils";
import ExportDialog from "../exports/_layout";
import { ChapterCard } from "./chapterCard";
import { exportChapters } from "../exports/exportUtils";
import { Tab, TabBar } from "../components/tabs";
import { AppBar } from "../components/appbar";
import { getOrCreateNovelTrackerStore, noveFavoriteStore, novelKey, NovelTracker } from "../favorites/tracker";
import { FAB } from 'react-native-paper';


const HEADER_MAX_HEIGHT = 320;
const PAGE_SIZE = 80;

async function fetchContentChapters(repo: Repo, content: Content): Promise<Content> {
    const url = repo.repoUrl + repo.homeSelector.path.replace('[bookId]', content.bookId);
    console.log(url);
    try {
        const response = await fetch(url);
        const html = await response.text();
        var dom = IDOMParser.parse(html).documentElement;
        const latestChapter = parseInt(processData(dom, repo.homeSelector.latestChapterSelector).trim());
        const summary = processData(dom, repo.homeSelector.summarySelector);
        const author = processData(dom, repo.homeSelector.authorSelector);
        return { ...content, latestChapter, summary, author };
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
    const [snackBarData, setSnackBarData] = useState<SnackBarData>({ visible: false });
    const theme = useTheme();
    const tabLength = Math.ceil((content?.latestChapter ?? 1) / PAGE_SIZE);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const allNovelTrackerStore = noveFavoriteStore((state: any) => state.content);
    const setAllNovelTracker = noveFavoriteStore((state: any) => state.setContent);
    const novelTracker = getOrCreateNovelTrackerStore({
        repo,
        content: _content,
        allTrackers: allNovelTrackerStore,
        setAllTrackers: setAllNovelTracker,
    });

    function handleContentFetch() {
        setLoading();
        fetchContentChapters(repo, _content)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }
    useEffect(() => {
        handleContentFetch();
    }, []);

    let child;
    if (contentData.isLoading) {
        child = (
            <View style={styles.listPadding}>
                <ActivityIndicator animating={true} size="large" />
            </View>
        );
    } else if (contentData.error || contentData.data === undefined) {
        child = (
            <View style={styles.listPadding}>
                <Title style={styles.errorText}>Failed to fetch content. Please try again.</Title>
                <Button onPress={() => handleContentFetch()} children={
                    'Retry'
                } />
            </View>
        );
    } else {
        return renderContentTabs();
    }
    return (
        renderBaseLayout({ child })
    );

    function renderBaseLayout({ child, tabBar }: { child?: React.ReactNode; tabBar?: React.ReactNode } = {}) {
        const appBar = <AppBar title={_content.title} transparent actions={[
            { leadingIcon: 'export', title: 'Export', onPress: () => setExportsVisible(true) },
        ]} />;
        return <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {tabBar && (createAnimatedHeader(scrollY, theme, appBar))}
            {!tabBar && (appBar)}
            <Animated.ScrollView
                style={[styles.scrollViewContent, { paddingBottom: 0 }]}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => handleContentFetch()} />}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
            >
                {child}
            </Animated.ScrollView>
            <Animated.View
                style={[
                    {
                        height: scrollY.interpolate({
                            inputRange: [-60, 60],
                            outputRange: [-60, 60],
                            extrapolate: 'clamp',
                        }),
                    },
                    {
                        transform: [
                            {
                                translateY: scrollY.interpolate({
                                    inputRange: [0, HEADER_MAX_HEIGHT],
                                    outputRange: [HEADER_MAX_HEIGHT, 0],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ],
                    },
                ]}
            >
                {tabBar}
            </Animated.View>
            <ExportDialog
                visible={exportsVisible}
                onDismiss={() => setExportsVisible(false)}
                maxChapters={contentData.data?.latestChapter}
                onExport={(range, format) => {
                    exportChapters(range, format, repo, content!, downloads, setDownloads, setSnackBarData);
                }} />
            <FAB
                style={{
                    position: 'absolute',
                    margin: 16,
                    right: 0,
                    bottom: 0,
                }}
                icon={novelTracker.favorite ? 'heart' : 'heart-outline'}
                onPress={() => {
                    const key = novelKey(repo.id, _content.bookId);
                    const updatedTracker: NovelTracker = { ...novelTracker, favorite: !novelTracker.favorite };
                    allNovelTrackerStore.set(key, updatedTracker);
                    setAllNovelTracker(allNovelTrackerStore);
                }}
            />
            <ShowSnackbar />
        </SafeAreaView>;
    }

    function renderContentTabs() {
        const tabs: Tab[] = Array.from({ length: tabLength }).map((_, tabIndex) => {
            const start = tabIndex * PAGE_SIZE;
            const end = Math.min((tabIndex + 1) * PAGE_SIZE, content?.latestChapter ?? 0);
            return {
                title: `${tabIndex * PAGE_SIZE + 1} — ${Math.min((tabIndex + 1) * PAGE_SIZE, content?.latestChapter ?? 0)}`,
                content: (
                    <ScrollView>
                        <View style={{ height: 15 }} />
                        {Array.from({ length: (end - start) }).map((_, index) => (
                            <View key={index} style={styles.contentContainer}>
                                <ChapterCard
                                    props={{
                                        repo, content: content!, chapterId: `${start + index + 1}`,
                                        enableNextPrev: true,
                                    }} />
                            </View>
                        ))}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )
            };
        });

        const tabBar = (<TabBar
            tabs={tabs}
            selectedIndex={selectedIndex}
            onTabPress={setSelectedIndex} />);

        child = (
            <ScrollView style={styles.container}>
                <View style={{ height: HEADER_MAX_HEIGHT }}>
                    <ImageBackground
                        source={{ uri: content?.bookImage }}
                        style={styles.imageBackground}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.gradient}
                        />
                        <View style={{ padding: 16 }}>
                            <Text style={styles.title} numberOfLines={8} ellipsizeMode="tail">
                                {content?.summary}
                            </Text>
                        </View>
                    </ImageBackground>
                </View>
                {tabBar}
                {tabs[selectedIndex].content}
            </ScrollView>
        );

        return renderBaseLayout({ child, tabBar });
    }

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listPadding: {
        padding: 16,
    },
    loading: {
        margin: 4.0, paddingHorizontal: 5.0, paddingVertical: 5.0
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    childContainer: {
        paddingVertical: 16,
    },
    header: {
        top: 0,
        left: 0,
        right: 0,
    },
    appbar: {
        justifyContent: 'center',
    },
    imageBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        // opacity: 0.8,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: HEADER_MAX_HEIGHT,
    },
    innerView: {
        padding: 16,
    },
    title: {
        fontSize: 15,
        color: 'white',
        fontVariant: ['small-caps'],
        textShadowColor: 'rgba(0, 0, 0, 0.90)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    scrollViewContent: {
        paddingTop: 10,
        paddingBottom: 120,
    },
    contentContainer: {
        paddingHorizontal: 16,
    },
    card: {
        marginBottom: 16,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    chapterTitle: {
        fontSize: 16,
    },
});

function createAnimatedHeader(scrollY: Animated.Value, theme: MD3Theme, appBar: React.JSX.Element): React.ReactNode {
    return <Animated.View
        style={[
            styles.header,
            {
                height: 80,
                zIndex: 10000,
                position: 'absolute',
                backgroundColor: scrollY.interpolate({
                    inputRange: [0, HEADER_MAX_HEIGHT],
                    outputRange: ['transparent', theme.colors.background],
                    extrapolate: 'clamp',
                }),
            },
        ]}
    >
        {appBar}
    </Animated.View>;
}
