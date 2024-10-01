import { Content, FetchData, processData, Repo, SnackBarData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, View, Text, ImageBackground } from "react-native";
import { ActivityIndicator, Appbar, Button, Title, Snackbar, useTheme } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { create } from "zustand";
import { allDownloadsStore } from "../downloads/utils";
import ExportDialog from "../exports/_layout";
import { MenuFunction } from "../components/menu";
import { ChapterCard } from "./chapterCard";
import { useWindowDimensions } from 'react-native';
import { exportChapters } from "../exports/exportUtils";
import { Tab, TabView } from "../tabs/tabs";


const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 0;
const PAGE_SIZE = 40;

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
    const layout = useWindowDimensions();

    const [index, setIndex] = React.useState(0);
    const routes = Array.from({ length: tabLength }).map((_, i) => ({
        key: `tab${i}`,
        title: `${i * PAGE_SIZE + 1} — ${Math.min((i + 1) * PAGE_SIZE, content?.latestChapter ?? 0)}`,
    }));

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

        const Header = () => {
            return (
                <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <Appbar.Header>
                        <Appbar.BackAction onPress={() => router.back()} />
                        <Appbar.Content title={_content.title} />
                        {hasDataLoaded && <MenuFunction
                            children={[
                                { title: 'Export', onPress: () => setExportsVisible(true) },
                            ]}
                        />}
                    </Appbar.Header>

                    <ExportDialog
                        visible={exportsVisible}
                        onDismiss={() => setExportsVisible(false)}
                        maxChapters={contentData.data?.latestChapter}
                        onExport={(range, format) => {
                            exportChapters(range, format, repo, content!, downloads, setDownloads, setSnackBarData);
                        }}
                    />
                    <ShowSnackbar />
                </SafeAreaView>

            );
        };

        const tabs: Tab[] = Array.from({ length: tabLength }).map((_, tabIndex) => {
            const start = tabIndex * PAGE_SIZE;
            const end = Math.min((tabIndex + 1) * PAGE_SIZE, content?.latestChapter ?? 0);
            return {
                title: `${tabIndex * PAGE_SIZE + 1} — ${Math.min((tabIndex + 1) * PAGE_SIZE, content?.latestChapter ?? 0)}`,
                content: (
                    <ScrollView>
                        {Array.from({ length: (end - start) }).map((_, index) => (
                            <View key={index} style={styles.contentContainer}>
                                <ChapterCard
                                    index={index}
                                    props={{
                                        index, start, repo, content: content!
                                    }} />
                            </View>
                        ))}
                    </ScrollView>
                )
            };
        });

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
                <TabView tabs={tabs} />
            </ScrollView >
        );
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={_content.title} />
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
                    exportChapters(range, format, repo, content!, downloads, setDownloads, setSnackBarData);
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
        backgroundColor: 'white',
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