import UseRepositoryLayout from "@/app/_repos";
import { Content, FetchData, processData, Repo } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Divider, IconButton, List, Title } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { Tabs, TabScreen, TabsProvider } from 'react-native-paper-tabs';

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

const homeStore = create((set) => ({
    content: { isLoading: true } as FetchData<{ latestChapter: string, summary: string }>,
    fetchData: (repo: Repo, content: Content) => {
        set({ content: { isLoading: true } });
        fetchContentChapters(repo, content)
            .then(data => set({ content: { data, isLoading: false } }))
            .catch(error => set({ content: { error, isLoading: false } }));
    },
}));

export default function ContentLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const content = JSON.parse(useLocalSearchParams().content as string) as Content;
    const scrollY = useRef(new Animated.Value(0)).current;
    const fetchData = homeStore((state: any) => state.fetchData);
    const contentData: FetchData<HomeData> = homeStore((state: any) => state.content);
    useEffect(() => {
        fetchData(repo, content);
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
                <Button onPress={() => fetchData(repo, content)} children={
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
            </Appbar.Header>
            {child}
        </SafeAreaView>
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
                        renderChapterCard(index, start, repo, content)
                    ))}
                </View>
            </ScrollView>
        );
    }

    function renderChapterCard(index: number, start: number, repo: Repo, item: Content) {
        function handleDownload(): void {
        }

        return (
            <View key={index}>
                <List.Item
                    key={index}
                    title={() => <Text>Chapter {start + index + 1}</Text>}
                    right={_ => <IconButton
                        icon="download-outline"
                        mode="contained-tonal"
                        style={{ marginLeft: 'auto' }}
                        onPress={() => handleDownload()}
                    />}
                    onPress={() => router.push(
                        {
                            pathname: '/chapters',
                            params: {
                                id: `${start + index + 1}`,
                                repo: JSON.stringify(item),
                                content: JSON.stringify(content)
                            }
                        })}
                />
                <Divider />
            </View>
        );
    }

    const tabLength = Math.ceil(data.latestChapter / 120);

    function renderTabs() {

        return (
            <Animated.View style={[styles.container, { marginTop: tabsMarginTop }]} >
                <TabsProvider defaultIndex={0}>
                    <Tabs mode="scrollable">
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
