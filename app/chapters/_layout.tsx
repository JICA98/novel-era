import { Content, FetchData, processData, Repo } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, View, Text, SafeAreaView } from "react-native";
import PagerView from "react-native-pager-view";
import { ActivityIndicator, Appbar, Button, Card, Divider, IconButton, List, Title } from "react-native-paper";
import { create } from "zustand";
import IDOMParser from "advanced-html-parser";
import RenderPagedContent from "./content";

interface ChapterData {
    chapterContent: string;
}

async function fetchChapter(repo: Repo, content: Content, id: string): Promise<ChapterData> {
    console.log('fetchChapter');
    const url = repo.repoUrl + repo.chapterSelector.path.replace('[bookId]', content.bookId).replace('[chapterId]', id);
    console.log(url);
    try {
        const response = await fetch(url);
        const html = await response.text();
        const dom = IDOMParser.parse(html).documentElement;
        const chapterContent = processData(dom, repo.chapterSelector.content);
        return { chapterContent };
    } catch (error) {
        console.error(error);
        return { chapterContent: '' };
    }
}

const useChapterData = create((set) => ({
    chapterContent: { isLoading: true } as FetchData<ChapterData>,
    fetchData: (repo: Repo, content: Content, id: string) => {
        set({ chapterContent: { isLoading: true } });
        fetchChapter(repo, content, id)
            .then(data => set({ chapterContent: { data, isLoading: false } }))
            .catch(error => set({ chapterContent: { error, isLoading: false } }));
    },
}));


export default function ChapterLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const content = JSON.parse(useLocalSearchParams().content as string) as Content;
    const id = useLocalSearchParams().id as string;
    const contentData: FetchData<ChapterData> = useChapterData((state: any) => state.chapterContent);
    const fetchData = useChapterData((state: any) => state.fetchData);

    useEffect(() => {
        fetchData(repo, content, id);
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
        child = <RenderPagedContent content={contentData.data.chapterContent} />;
    }
    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={`Chapter ${id}  —  ${content.title}`} />
            </Appbar.Header>
            {child}
        </SafeAreaView>
    );

}


const styles = {
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
    page: {
        justifyContent: 'center',
        alignItems: 'center',
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    text: {
        fontSize: 18,
        textAlign: 'center',
        margin: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
    },
    pagerView: {
        flex: 1,
    },
    content: {
        fontSize: 16,
    },
};

