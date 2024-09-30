import UseRepositoryLayout from "@/app/_repos";
import { Content, FetchData, processData, Repo, SnackBarData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Divider, Icon, IconButton, List, Menu, Title, Snackbar, useTheme } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { Tabs, TabScreen, TabsProvider } from 'react-native-paper-tabs';
import { allDownloadsStore, createDownloadStore, createStore, deleteFile, readFile, removeFromStore, moveToAlbum, startDownload, useDownloadStore } from "../downloads/utils";
import { ChapterData, chapterKey, fetchChapter } from "../chapters/_layout";
import ExportDialog from "../exports/_layout";
import { pLimitLit } from "../_layout";
import { saveAsEpub } from "../exports/epubUtil";
import { FontAwesome } from "@expo/vector-icons";
import { MenuFunction } from "../components/menu";

const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const PAGE_SIZE = 40;

interface HomeData {
    latestChapter: number;
    summary: string;
    author: string;
}

async function fetchContentChapters(repo: Repo, content: Content): Promise<HomeData> {
    const url = repo.repoUrl + repo.homeSelector.path.replace('[bookId]', content.bookId);
    console.log(url);
    try {
        const response = await fetch(url);
        const html = await response.text();
        var dom = IDOMParser.parse(html).documentElement;
        const latestChapter = parseInt(processData(dom, repo.homeSelector.latestChapterSelector).trim());
        const summary = processData(dom, repo.homeSelector.summarySelector);
        const author = processData(dom, repo.homeSelector.authorSelector);
        return { latestChapter, summary, author };
    } catch (error) {
        console.error(error);
        return { latestChapter: 0, summary: '', author: '' };
    }
}

const useContentStore = create((set) => ({
    content: { isLoading: true } as FetchData<HomeData>,
    setContent: (content: FetchData<HomeData>) => set({ content }),
    setLoading: () => set({ content: { isLoading: true } }),
}));

export default function ContentLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const content = JSON.parse(useLocalSearchParams().content as string) as Content;
    const scrollY = useRef(new Animated.Value(0)).current;
    const setContent = useContentStore((state: any) => state.setContent);
    const contentData: FetchData<HomeData> = useContentStore((state: any) => state.content);
    const setLoading = useContentStore((state: any) => state.setLoading);
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const setDownloads = allDownloadsStore((state: any) => state.setDownloads);
    const homeData = contentData.data;
    const [exportsVisible, setExportsVisible] = useState(false);
    const [snackBarData, setSnackBarData] = useState<SnackBarData>({ visible: false });
    const theme = useTheme();
    const [tabIndex, setTabIndex] = useState(0)

    function handleContentFetch() {
        setLoading();
        fetchContentChapters(repo, content)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }
    useEffect(() => {
        handleContentFetch();
    }, []);

    let child;
    const hasDataLoaded = !contentData.isLoading && contentData.data !== undefined && !contentData.error;
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
        child = renderHeaderContent(scrollY);
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={content.title} />
                {hasDataLoaded && <MenuFunction
                    children={[
                        { title: 'Export', onPress: () => setExportsVisible(true) },
                    ]}
                />}
            </Appbar.Header>
            {child}
            <ExportDialog
                visible={exportsVisible}
                onDismiss={() => setExportsVisible(false)}
                maxChapters={contentData.data?.latestChapter}
                onExport={(range, format) => {
                    console.log(range, format);
                    const endRange = range[1];
                    const startRange = range[0];
                    const limit = pLimitLit(1);
                    const promises: Promise<ChapterData>[] = Array.from({ length: endRange - startRange + 1 }).map((_, index) => {
                        const id = (range[0] + index).toString();
                        return limit(async () => {
                            const key = chapterKey(repo, content, id);
                            if (downloads.has(key)) {
                                const stateData = await readFile(key);
                                if (stateData?.chapterContent) {
                                    return stateData;
                                }
                            }
                            console.log('Downloading ', key);
                            const chapterData = await fetchChapter(repo, content, id);
                            if (chapterData.chapterContent) {
                                const store = createStore(chapterData);
                                downloads.set(key, store);
                                setDownloads(downloads);
                            }
                            return chapterData;
                        });
                    });

                    Promise.all(promises).then(async (data) => {
                        if (format === 'epub') {
                            const uri = await saveAsEpub({
                                author: homeData!.author,
                                title: content.title,
                                content: data,
                                // cover: content.bookImage,
                            });

                            await moveToAlbum(uri, 'application/epub+zip');

                            setSnackBarData({
                                visible: true,
                                message: `Exported as EPUB under ${uri}`,
                                severity: 'success',
                                action: {
                                    label: 'Ok',
                                    onPress: () => {
                                        setSnackBarData({ visible: false });
                                    }
                                }
                            });
                        }
                    }).catch((error) => {
                        console.error(error);
                    });
                }}
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

    function interpolateScrollY(scrollY: Animated.Value) {
        const headerHeight = scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
            extrapolate: 'clamp',
        });

        const titleOpacity = scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
        });

        const titleTranslateY = scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [0, -HEADER_SCROLL_DISTANCE / 2],
            extrapolate: 'clamp',
        });

        const tabsMarginTop = scrollY.interpolate({
            inputRange: [0, HEADER_SCROLL_DISTANCE],
            outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
            extrapolate: 'clamp',
        });
        return { headerHeight, titleOpacity, titleTranslateY, tabsMarginTop };
    }

    function renderHeaderContent(scrollY: Animated.Value) {
        const { headerHeight, titleOpacity, titleTranslateY, tabsMarginTop } = interpolateScrollY(scrollY);

        function renderChapterScrollView(start: number, end: number) {
            return (
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    <View style={styles.contentContainer}>
                        {Array.from({ length: (end - start) }).map((_, index) => (
                            renderChapterCard(index, start)
                        ))}
                    </View>
                </ScrollView>
            );
        }

        function renderChapterCard(index: number, start: number) {
            return (
                <ContentListCard
                    key={index}
                    index={index}
                    start={start}
                />
            );
        }

        const tabLength = Math.ceil(homeData!.latestChapter / PAGE_SIZE);

        function renderTabs() {
            return (
                <Animated.View style={[styles.container, { marginTop: tabsMarginTop }]} >
                    <TabsProvider defaultIndex={0} onChangeIndex={setTabIndex}>
                        <Tabs mode={tabLength === 1 ? 'fixed' : 'scrollable'} disableSwipe showLeadingSpace={false}>
                            {Array.from({ length: tabLength }).map((_, index) => {
                                if (tabIndex === index) {
                                    const start = index * PAGE_SIZE;
                                    const end = Math.min((index + 1) * PAGE_SIZE, homeData!.latestChapter);
                                    return (
                                        <TabScreen key={index} label={`${start + 1} — ${end}`}>
                                            {renderChapterScrollView(start, end)}
                                        </TabScreen>
                                    );
                                } else {
                                    const start = index * PAGE_SIZE;
                                    const end = Math.min((index + 1) * PAGE_SIZE, homeData!.latestChapter);
                                    return (
                                        <TabScreen key={index} label={`${start + 1} — ${end}`}>
                                            <View />
                                        </TabScreen>
                                    );
                                }
                            })}
                        </Tabs>
                    </TabsProvider>
                </Animated.View>
            );
        }

        return (
            <View style={styles.container}>
                <Animated.View style={[styles.header, { height: headerHeight }]}>
                    <ImageBackground
                        source={{ uri: content.bookImage }} // Replace with your image URL
                        style={[styles.imageBackground]}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.gradient} />
                        <Animated.View style={[styles.innerView, {
                            opacity: titleOpacity,
                            transform: [{ translateY: titleTranslateY }]
                        }]}>
                            <Text style={styles.title} numberOfLines={8} ellipsizeMode="tail">
                                {homeData?.summary}
                            </Text>
                        </Animated.View>
                    </ImageBackground>
                </Animated.View>
                {renderTabs()}
            </View >

        );


        function ContentListCard({ index, start }: { index: number, start: number }) {
            const id = `${start + index + 1}`;
            const key = chapterKey(repo, content, id);
            const downloadStore = useDownloadStore({ key, downloads, setDownloads });
            const storeContent = downloadStore((state: any) => state.content);
            const setLoading = downloadStore((state: any) => state.setLoading);
            const setContent = downloadStore((state: any) => state.setContent);

            function handleDownload(): void {
                console.log('Download chapter');
                startDownload({
                    fetcher: () => fetchChapter(repo, content, id),
                    setLoading,
                    setContent,
                });
            }

            function handleRemove(): void {
                console.log('Remove chapter');
                removeFromStore({ key, downloads, setDownloads });
                setContent({ noStarted: true });
            }

            return (
                <View key={index}>
                    <List.Item
                        key={index}
                        title={() => <Title style={styles.chapterTitle} >Chapter {id}</Title>}
                        right={_ => {
                            if (storeContent.data) {
                                return <IconButton
                                    icon="check"
                                    mode="contained-tonal"
                                    size={14}
                                    style={{ marginLeft: 'auto' }}
                                    onPress={() => handleRemove()} />;
                            } else if (storeContent.noStarted) {
                                return <IconButton
                                    icon="download-outline"
                                    size={14}
                                    mode="contained-tonal"
                                    style={{ marginLeft: 'auto' }}
                                    onPress={() => handleDownload()} />;
                            } else
                                if (storeContent?.isLoading) {
                                    return <View style={styles.loading}>
                                        <ActivityIndicator animating={true} size="small" />
                                    </View>;
                                } else {
                                    return <IconButton
                                        icon="alert-circle-outline"
                                        size={14}
                                        mode="contained-tonal"
                                        style={{ marginLeft: 'auto' }}
                                        onPress={() => handleDownload()} />;
                                }
                        }}
                        onPress={() => router.push(
                            {
                                pathname: '/chapters',
                                params: {
                                    id,
                                    repo: JSON.stringify(repo),
                                    content: JSON.stringify(content)
                                }
                            })}
                    />
                    <Divider />
                </View>
            );
        }
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
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        zIndex: -11,
        elevation: 3,
    },
    appbar: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    imageBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
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
        paddingBottom: PAGE_SIZE,
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
        borderBottomColor: '#ccc',
    },
    chapterTitle: {
        fontSize: 16,
    },
});
