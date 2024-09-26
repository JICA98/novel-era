import { ActivityIndicator, Appbar, Button, Title } from "react-native-paper";
import { Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import UseRepositoryLayout from "../_repos";
import { Content, FetchData, processData, Repo } from "@/types";
import { useEffect } from "react";
import { create } from "zustand";
const IDOMParser = require("advanced-html-parser");

export default function RepositorLayout() {
    const id = useLocalSearchParams().id as string;
    console.log(id);
    return (
        <UseRepositoryLayout props={{
            renderRepositories: (repos) => (<RenderRepoView id={id} repos={repos} />)
        }} />
    );
}

async function fetchContentList(repo: Repo): Promise<Content[]> {
    try {
        const url = repo.repoUrl + repo.listSelector.path;
        console.log(url);
        const response = await fetch(url);
        const html = await response.text();

        var dom = IDOMParser.parse(html);
        const list = dom.querySelectorAll(repo.listSelector.selector);

        return Array.from(list).map((item) => {
            const title = processData(item, repo.listSelector.title);
            const bookImage = processData(item, repo.listSelector.bookImage);
            const bookLink = processData(item, repo.listSelector.bookLink);
            return { title, bookImage, bookLink };
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

const useContentStore = create((set) => ({
    content: {} as FetchData<Content[]>,
    setContent: (repositories: FetchData<Content[]>) => set({ content: repositories }),
}));

function RenderRepoView({ id, repos }: { id: string, repos: Repo[] }): JSX.Element {
    const repo = repos.filter(repo => repo.id === id)[0];
    const setContent = useContentStore((state: any) => state.setContent);
    const content = useContentStore((state: any) => state.content);

    useEffect(() => {
        setContent({ isLoading: true });
        fetchContentList(repo)
            .then(data => setContent({ data, isLoading: false }))
            .catch(error => setContent({ error, isLoading: false }));
    }, []);

    if (content.isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator animating={true} size="large" />
            </View>
        );
    }

    if (content.error) {
        return (
            <View style={styles.container}>
                <Title style={styles.errorText}>Failed to fetch content. Please try again.</Title>
                <Button onPress={() => fetchContentList(repo)} children={
                    'Retry'
                } />
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={repo.name} />
                <Appbar.Action icon="magnify" onPress={() => { }} />
            </Appbar.Header>


            <ScrollView>
                {content.data?.map((item: Content, index: number) => (
                    <View key={index} style={{ padding: 16 }}>
                        <Text>{item.title}</Text>
                        <Text>{item.bookLink}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    errorText: {
        textAlign: 'center',
        margin: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});