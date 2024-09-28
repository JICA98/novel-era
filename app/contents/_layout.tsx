import UseRepositoryLayout from "@/app/_repos";
import { Content, FetchData, processData, Repo } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Divider, Icon, IconButton, List, Menu, Title } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { Tabs, TabScreen, TabsProvider } from 'react-native-paper-tabs';
import { allDownloadsStore, isDownloadErrored, isDownloading, startDownload, useDownloadStore } from "../downloads/utils";
import { chapterKey, fetchChapterUsing } from "../chapters/_layout";

const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

interface HomeData {
    latestChapter: number;
    summary: string;
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
        return { latestChapter, summary };
    } catch (error) {
        console.error(error);
        return { latestChapter: 0, summary: '' };
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
        child = renderHeaderContent(scrollY, content, contentData.data, repo);
    }
    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={content.title} />
                {hasDataLoaded && <MenuFunction />}
            </Appbar.Header>
            {child}
        </SafeAreaView>
    );
}

function MenuFunction() {
    const [visible, setVisible] = useState(false);
    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);
    return (
        <View
            style={{
            }}>
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchor={<Button onPress={openMenu}><Icon source="menu" size={18} ></Icon></Button>}>
                <Menu.Item onPress={() => { }} title="Item 1" />
                <Menu.Item onPress={() => { }} title="Item 2" />
                <Divider />
                <Menu.Item onPress={() => { }} title="Item 3" />
            </Menu>
        </View>
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

function renderHeaderContent(scrollY: Animated.Value, content: Content, data: HomeData, repo: Repo) {
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
                        renderChapterCard(index, start, repo)
                    ))}
                </View>
            </ScrollView>
        );
    }

    function renderChapterCard(index: number, start: number, repo: Repo) {
        return (
            <ContentListCard
                key={index}
                index={index}
                start={start}
                repo={repo}
                content={content}
            />
        );
    }

    const tabLength = Math.ceil(data.latestChapter / 120);

    function renderTabs() {

        return (
            <Animated.View style={[styles.container, { marginTop: tabsMarginTop }]} >
                <TabsProvider defaultIndex={0}>
                    <Tabs mode={tabLength === 1 ? 'fixed' : 'scrollable'}>
                        {Array.from({ length: tabLength }).map((_, index) => {
                            const start = index * 120;
                            const end = Math.min((index + 1) * 120, data.latestChapter);
                            return (
                                <TabScreen key={index} label={`${start + 1} — ${end}`}>
                                    {renderChapterScrollView(start, end)}
                                </TabScreen>
                            );
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
                            {data.summary}
                        </Text>
                    </Animated.View>
                </ImageBackground>
            </Animated.View>
            {renderTabs()}
        </View >

    );

}


function ContentListCard({ index, start, repo, content }: { index: number, start: number, repo: Repo, content: Content }) {
    const id = `${start + index + 1}`;
    const key = chapterKey(repo, content, id);
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const downloadStore = useDownloadStore({
        key,
        downloads,
        setDownloads: allDownloadsStore((state: any) => state.setDownloads),
    });
    const store = downloadStore((state: any) => state.content);
    const setLoading = downloadStore((state: any) => state.setLoading);
    const setContent = downloadStore((state: any) => state.setContent);

    function handleDownload(): void {
        console.log('Download chapter');
        startDownload({
            fetcher: () => fetchChapterUsing(key, repo),
            setLoading,
            setContent,
        });
    }

    return (
        <View key={index}>
            <List.Item
                key={index}
                title={() => <Text>Chapter {id}</Text>}
                right={_ => {
                    if (store.noStarted) {
                        return <IconButton
                            icon="download-outline"
                            mode="contained-tonal"
                            style={{ marginLeft: 'auto' }}
                            onPress={() => handleDownload()} />;
                    } else if (store?.isLoading) {
                        return <ActivityIndicator animating={true} size="small" />;
                    } else if (store?.error) {
                        return <IconButton
                            icon="alert-circle-outline"
                            mode="contained-tonal"
                            style={{ marginLeft: 'auto' }}
                            onPress={() => handleDownload()} />;
                    } else {
                        return <IconButton
                            icon="check"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listPadding: {
        padding: 16,
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
        borderBottomColor: '#ccc',
    },
    chapterTitle: {
        fontSize: 16,
    },
});
