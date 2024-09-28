import { Content, FetchData, processData, Repo } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import PagerView from "react-native-pager-view";
import { ActivityIndicator, Appbar, Button, Card, Divider, IconButton, List, Title } from "react-native-paper";
import { create } from "zustand";
import IDOMParser from "advanced-html-parser";
import RenderPagedContent from "./content";
import { allDownloadsStore, saveFile, useDownloadStore } from "../downloads/utils";
import RNFetchBlob from 'rn-fetch-blob';

interface ChapterData {
    id: string;
    chapterContent: string;
    repo: Repo;
    content: Content;
}

export function chapterKey(repo: Repo, content: Content, id: string) {
    return repo.repoUrl + repo.chapterSelector.path.replace('[bookId]', content.bookId).replace('[chapterId]', id);
}

export async function fetchChapter(repo: Repo, content: Content, id: string): Promise<ChapterData> {
    try {
        const key = chapterKey(repo, content, id);
        console.log(key);
        const response = await fetch(key);
        const html = await response.text();
        const dom = IDOMParser.parse(html).documentElement;
        const contentData = processData(dom, repo.chapterSelector.content);
        const chapterContent = { id, chapterContent: contentData, repo, content } as ChapterData;
        saveFile(key, chapterContent).then(() => console.log('Saved'));
        return chapterContent;
    } catch (error) {
        console.error(error);
        return { chapterContent: '', repo, content } as ChapterData;
    }
}

export default function ChapterLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const content = JSON.parse(useLocalSearchParams().content as string) as Content;
    const id = useLocalSearchParams().id as string;
    const key = chapterKey(repo, content, id);
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const useChapterData = useDownloadStore({
        key,
        downloads,
        setDownloads: allDownloadsStore((state: any) => state.setDownloads),
    });
    const contentData: FetchData<ChapterData> = useChapterData((state: any) => state.content);
    const setContent = useChapterData((state: any) => state.setContent);
    const setLoading = useChapterData((state: any) => state.setLoading);
    const [focusedMode, setFocusedMode] = useState(false);

    useEffect(() => {
        fetchChapterData();
    }, []);

    function fetchChapterData(cached = true) {
        if (cached && contentData.data) { return; }
        setLoading();
        fetchChapter(repo, content, id)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }

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
                <Button onPress={() => fetchChapterData()} children={
                    'Retry'
                } />
            </View>
        );
    } else {
        child = <RenderPagedContent content={contentData.data.chapterContent} />;
    }
    return (
        <SafeAreaView style={styles.container}>
            {!focusedMode && (
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title={`Chapter ${id}`} />
                </Appbar.Header>
            )}
            {child}
            <TouchableOpacity
                style={styles.invisibleButton}
                onPress={() => setFocusedMode(!focusedMode)}
            />
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
    invisibleButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 50,
        height: 50,
        borderRadius: 25,
        transform: [{ translateX: -25 }, { translateY: -25 }],
        backgroundColor: 'transparent',
    },
};

