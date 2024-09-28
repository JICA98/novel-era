import { ActivityIndicator, Appbar, Button, Card, Title } from "react-native-paper";
import { FlatList, SafeAreaView, ScrollView, View } from "react-native";
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import UseRepositoryLayout from "../_repos";
import { Content, FetchData, processData, Repo } from "@/types";
import { useEffect } from "react";
import { create } from "zustand";
import IDOMParser from "advanced-html-parser";

async function fetchContentList(repo: Repo): Promise<Content[]> {
    try {
        const url = repo.repoUrl + repo.listSelector.path;
        console.log(url);
        const response = await fetch(url);
        const html = await response.text();

        var dom = IDOMParser.parse(html).documentElement;
        const list = dom.querySelectorAll(repo.listSelector.selector);

        return Array.from(list).map((item) => {
            const title = processData(item, repo.listSelector.title);
            const bookImage = processData(item, repo.listSelector.bookImage);
            const bookLink = processData(item, repo.listSelector.bookLink);
            const bookId = processData(item, repo.listSelector.bookId);
            return { title, bookImage, bookLink, bookId };
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

const useContentStore = create((set, get: any) => ({
    content: { isLoading: true } as FetchData<Content[]>,
    fetchData: (repo: Repo) => {
        let data = get();
        set({ content: { isLoading: true } });
        fetchContentList(repo)
            .then(data => set({ content: { data, isLoading: false } }))
            .catch(error => set({ content: { error, isLoading: false } }));
    },
}));

export default function RepositorLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const fetchData = useContentStore((state: any) => state.fetchData);
    const content = useContentStore((state: any) => state.content);
    let child;

    useEffect(() => {
        fetchData(repo);
    }, []);

    if (content.isLoading) {
        child = (
            <View style={styles.listPadding}>
                <ActivityIndicator animating={true} size="large" />
            </View>
        );
    } else if (content.error) {
        child = (
            <View style={styles.listPadding}>
                <Title style={styles.errorText}>Failed to fetch content. Please try again.</Title>
                <Button onPress={() => fetchContentList(repo)} children={
                    'Retry'
                } />
            </View>
        );
    } else {
        child = (
            <FlatList
                data={content.data}
                renderItem={({ item }) => renderItem(repo, item)}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                contentContainerStyle={styles.grid}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={repo.name} />
                <Appbar.Action icon="magnify" onPress={() => { }} />
            </Appbar.Header>

            {child}

        </SafeAreaView>
    );
}


const renderItem = (repo: Repo, item: Content) => (
    <Card style={styles.card} onPress={() => console.log('Pressed')}>
        <Card.Cover source={{ uri: item.bookImage }} />
        <Card.Title title={item.title} />
        <Card.Actions>
            <Button onPress={() => {
                return router.push({
                    pathname: '/contents',
                    params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
                });
            }}>
                View</Button>
        </Card.Actions>
    </Card >
);


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    listPadding: {
        padding: 16,
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    grid: {
        paddingHorizontal: 8,
    },
    card: {
        flex: 1,
        margin: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});