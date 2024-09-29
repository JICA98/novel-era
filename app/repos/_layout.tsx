import { ActivityIndicator, Appbar, Button, Card, Icon, Menu, Title, useTheme } from "react-native-paper";
import { FlatList, SafeAreaView, View } from "react-native";
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Content, FetchData, processData, Repo } from "@/types";
import { useEffect, useState } from "react";
import { create } from "zustand";
import IDOMParser from "advanced-html-parser";
import { FontAwesome } from '@expo/vector-icons';

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
        throw new Error('Failed to fetch content');
    }
}

const useContentStore = create((set) => ({
    content: { isLoading: true } as FetchData<Content[]>,
    setContent: (content: FetchData<Content[]>) => set({ content }),
    setLoading: () => set({ content: { isLoading: true } }),
}));

export default function RepositorLayout() {
    const repo = JSON.parse(useLocalSearchParams().repo as string) as Repo;
    const setContent = useContentStore((state: any) => state.setContent);
    const content = useContentStore((state: any) => state.content);
    const setLoading = useContentStore((state: any) => state.setLoading);
    const theme = useTheme();
    let child;

    function fetchContent(cached = true) {
        if (cached && content.data) {
            return;
        }
        setLoading();
        fetchContentList(repo)
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }
    useEffect(() => {
        fetchContent();
    }, []);
    const hasDataLoaded = content.data && !content.isLoading;

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
                <Button onPress={() => fetchContent(false)} children={
                    'Retry'
                } />
            </View>
        );
    } else {
        child = (
            <FlatList
                data={content.data}
                renderItem={({ item }) => renderItem(repo, item)}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.grid}
                style={{ flex: 1 }}
                ListFooterComponent={<View style={{ height: 120 }} />}
                ListHeaderComponent={<View style={{ height: 20 }} />}
            />
        );
    }

    function MenuFunction({ fetchContent }: { fetchContent: any }) {
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
                    anchorPosition="bottom"
                    anchor={<Button onPress={openMenu}><FontAwesome color={theme.colors.onBackground} 
                    name="ellipsis-v" size={18} ></FontAwesome ></Button>}>
                    <Menu.Item onPress={() => {
                        fetchContent(false); closeMenu();
                    }} title="Refresh" leadingIcon="refresh" />
                </Menu>
            </View>
        );
    }


    const renderItem = (repo: Repo, item: Content) => (
        <Card style={styles.card} onPress={() => {
            return router.push({
                pathname: '/contents',
                params: { content: JSON.stringify(item), repo: JSON.stringify(repo) }
            });
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Card.Cover source={{ uri: item.bookImage }} style={{ width: 100, height: 100, marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                    <Card.Title title={item.title} titleNumberOfLines={2} />
                </View>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={repo.name} />
                <Appbar.Action icon="magnify" onPress={() => { }} />
                {hasDataLoaded && <MenuFunction fetchContent={fetchContent} />}
            </Appbar.Header>

            {child}

        </SafeAreaView>
    );

}


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
        paddingHorizontal: 2,
    },
    card: {
        flex: 1,
        margin: 2,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
});