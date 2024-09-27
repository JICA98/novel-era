import UseRepositoryLayout from "@/app/_repos";
import { Content, FetchData, processData, Repo } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Title } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";

const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 90;
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
        const latestChapter = parseInt(processData(dom, repo.homeSelector.latestChapterSelector));
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
    const repoId = useLocalSearchParams().repoId as string;
    const content = JSON.parse(useLocalSearchParams().content as string) as Content;

    return (
        <UseRepositoryLayout props={{
            renderRepositories: (repos) => (<RenderContentView repoId={repoId} content={content} repos={repos} />)
        }} />
    );
}

function RenderContentView({ repoId, content, repos }: { repoId: string, content: Content, repos: Repo[] }) {
    const repo = repos.filter(repo => repo.id === repoId)[0];
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
        return renderHeaderContent(scrollY, content, contentData.data);
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

function renderHeaderContent(scrollY: Animated.Value, content: Content, data: HomeData) {
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

    const appBarTitleOpacity = scrollY.interpolate({
        inputRange: [HEADER_SCROLL_DISTANCE - 10, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <Appbar.Header style={styles.appbar}>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Animated.View style={{ opacity: appBarTitleOpacity }}>
                        <Appbar.Content title={content.title} />
                    </Animated.View>
                </Appbar.Header>
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
                        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                            {content.title}
                        </Text>
                    </Animated.View>
                </ImageBackground>
            </Animated.View>

            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {new Array(10).map((chapter, index) => (
                    <View key={index} style={styles.listItem}>
                        <Text style={styles.chapterTitle}>{chapter.title}</Text>
                        <Button mode="contained" onPress={() => console.log(`Downloading ${chapter.title}`)}>
                            Download
                        </Button>
                    </View>
                ))}
            </ScrollView>

        </SafeAreaView >

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
        zIndex: 1,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollViewContent: {
        paddingTop: HEADER_MAX_HEIGHT,
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
