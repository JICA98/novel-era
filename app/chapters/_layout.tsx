import { Content, FetchData, Repo } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, View, Text, SafeAreaView } from "react-native";
import PagerView from "react-native-pager-view";
import { Appbar, Title } from "react-native-paper";
import { create } from "zustand";

interface ChapterData {
    chapterContent: string;
}

async function fetchChapter(repo: Repo, content: Content, id: string): Promise<ChapterData> {
    const url = repo.repoUrl + content.bookLink.replace('[bookId]', id);
    console
}

create((set) => ({
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

    const [pages, setPages] = useState<string[]>([]);

    useEffect(() => {
        // Simulate fetching content and splitting it into pages
        const content = [
            "Page 1: This is the content of page 1.",
            "Page 2: This is the content of page 2.",
            "Page 3: This is the content of page 3.",
            "Page 4: This is the content of page 4.",
        ];
        setPages(content);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={`Chapter ${id}  —  ${content.title}`} />
            </Appbar.Header>
            <View style={styles.container}>
                <PagerView style={styles.pagerView} initialPage={0}>
                    {pages.map((page, index) => (
                        <View key={index} >
                            <Text >{page}</Text>
                        </View>
                    ))}
                </PagerView>
            </View>
        </SafeAreaView>

    );
}

const styles = {
    container: {
        flex: 1,
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

