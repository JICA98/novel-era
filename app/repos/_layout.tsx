import { ActivityIndicator, Appbar, Button, Card, Icon, Menu, Title, useTheme } from "react-native-paper";
import { FlatList, SafeAreaView, View } from "react-native";
import { StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Content, FetchData, processData, Repo, Selector, SelectorType } from "@/types";
import { useEffect, useState } from "react";
import { create } from "zustand";
import IDOMParser from "advanced-html-parser";
import { Searchbar } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import jsonpath from 'jsonpath';
import { MenuFunction } from "../components/menu";

async function fetchContentList({ repo, searchQuery }: { repo: Repo, searchQuery?: string }): Promise<Content[]> {
    try {
        const selector = searchQuery ? repo.repoSearch : repo.listSelector;
        const url = repo.repoUrl + selector.path.replace('[text]', searchQuery || '');
        console.log(url);
        const response = await fetch(url);
        let html = '';
        if (selector.type === SelectorType.http) {
            const json = await response.json();
            html = jsonpath.query(json, selector.jsonPath)[0];
        } else {
            html = await response.text();
        }
        var dom = IDOMParser.parse(html).documentElement;
        const list = dom.querySelectorAll(selector.selector);

        return Array.from(list).map((item) => {
            const title = processData(item, selector.title);
            const bookImage = processData(item, selector.bookImage);
            const bookLink = processData(item, selector.bookLink);
            const bookId = processData(item, selector.bookId);
            // const rating = processData(item, selector.rating);
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searchBarVisible, setSearchBarVisible] = useState(false);
    const theme = useTheme();
    let child;

    function fetchContent({ cached, searchQuery }: { cached: boolean, searchQuery?: string }) {
        if (cached && content.data) {
            return;
        }
        setLoading();
        fetchContentList({ repo, searchQuery })
            .then(data => setContent({ data }))
            .catch(error => setContent({ error }));
    }
    useEffect(() => {
        fetchContent({ cached: false });
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
                <Button onPress={() => fetchContent({ cached: false })} children={
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
                {!content.isLoading &&
                    <Appbar.Action icon={searchBarVisible ? 'close' : 'magnify'} onPress={() => setSearchBarVisible(!searchBarVisible)} />}
                {hasDataLoaded && <MenuFunction
                    children={[
                        { title: 'Refresh', leadingIcon: 'refresh', onPress: () => fetchContent({ cached: false }) },
                    ]}
                />}
            </Appbar.Header>

            {searchBarVisible && !content.isLoading && <View style={styles.searchBar}>
                <Searchbar
                    placeholder="Search"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    onEndEditing={() => searchQuery && fetchContent({ cached: false, searchQuery })}
                    traileringIcon={searchQuery.length ? 'close' : undefined}
                    onTraileringIconPress={() => setSearchQuery('')}
                />
            </View>}

            {child}

        </SafeAreaView>
    );

}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    searchBar: {
        padding: 16,
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