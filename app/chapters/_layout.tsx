import { Content, FetchData, processData, Repo } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, View, Text, SafeAreaView, TouchableOpacity, StatusBar } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Divider, IconButton, List, PaperProvider, Title, useTheme } from "react-native-paper";
import IDOMParser from "advanced-html-parser";
import { allDownloadsStore, saveFile, useDownloadStore } from "../downloads/utils";
import { AppBar } from "../components/appbar";
import { RenderPagedContent } from "./content";

export interface ChapterData {
    id: string;
    chapterContent: string;
    name: string;
    repo: Repo;
    content: Content;
}

export interface RenderChapterProps {
    focusedMode: boolean;
    id: string;
    content: Content;
    data: string;
    repo: Repo,
    continueReading?: boolean;
    fromPrevious?: boolean;
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
        const name = `Chapter ${id}`;
        const chapterContent = { id, chapterContent: contentData, repo, content, name } as ChapterData;
        saveFile(key, chapterContent).then(() => console.log('Saved'));
        return chapterContent;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch chapter');
    }
}

export function navigateToNextChapter(props: RenderChapterProps, add = 1) {
    router.replace({
        pathname: '/chapters',
        params: {
            props: JSON.stringify({
                ...props,
                id: (parseInt(props.id) + add).toString(),
                continueReading: true,
                fromPrevious: add === -1,
            }),
        }
    });
}

const ChapterLayout: React.FC = () => {
    const _props: RenderChapterProps = JSON.parse(useLocalSearchParams().props as string) as RenderChapterProps;
    const downloads = allDownloadsStore((state: any) => state.downloads);
    const props: RenderChapterProps = { ..._props };
    const key = chapterKey(props.repo, props.content, props.id);
    const useChapterData = useDownloadStore({
        key,
        downloads,
        setDownloads: allDownloadsStore((state: any) => state.setDownloads),
    });
    const contentData: FetchData<ChapterData> = useChapterData((state: any) => state.content);
    const setContent = useChapterData((state: any) => state.setContent);
    const setLoading = useChapterData((state: any) => state.setLoading);
    const [focusedMode, setFocusedMode] = useState(props.focusedMode);
    const theme = useTheme();

    useEffect(() => {
        fetchChapterData();
    }, []);

    function fetchChapterData(cached = true) {
        if (cached && contentData.data) { return; }
        setLoading();
        fetchChapter(props.repo, props.content, props.id)
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
        child = <RenderPagedContent
            fromPrevious={props.fromPrevious}
            data={contentData.data.chapterContent}
            focusedMode={focusedMode}
            continueReading={props.continueReading}
            id={props.id} content={props.content} repo={props.repo}
        />;
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {!focusedMode && (
                <AppBar title={`Chapter ${props.id}`} actions={[
                    {
                        leadingIcon: 'arrow-right', title: 'Next Chapter', onPress: () =>
                            navigateToNextChapter(props)
                    },
                    {
                        title: 'Focus Mode', onPress: () => setFocusedMode(true)
                    },
                ]}></AppBar>
            )}
            {focusedMode && (<StatusBar hidden />)}
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

export default ChapterLayout;